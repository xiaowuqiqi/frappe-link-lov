import {LovDialog} from "./lovDialog";

frappe.ui.form.ControlLink.prototype.setup_awesomeplete = function () {
    let me = this;

    this.$input.cache = {};

    this.awesomplete = new Awesomplete(me.input, {
        minChars: 0,
        maxItems: 99,
        autoFirst: true,
        list: [],
        replace: function (item) {
            // Override Awesomeplete replace function as it is used to set the input value
            // https://github.com/LeaVerou/awesomplete/issues/17104#issuecomment-359185403
            this.input.value = me.get_translated(item.label || item.value);
        },
        data: function (item) {
            return {
                label: me.get_translated(item.label || item.value),
                value: item.value,
            };
        },
        filter: function () {
            return true;
        },
        item: function (item) {
            let d = this.get_item(item.value);
            if (!d.label) {
                d.label = d.value;
            }

            let _label = me.get_translated(d.label);
            let html = d.html || "<strong>" + _label + "</strong>";
            if (
                d.description &&
                // for title links, we want to inlude the value in the description
                // because it will not visible otherwise
                (me.is_title_link() || d.value !== d.description)
            ) {
                html += '<br><span class="small">' + __(d.description) + "</span>";
            }
            return $("<li></li>")
                .data("item.autocomplete", d)
                .prop("aria-selected", "false")
                .html(`<a><p title="${_label}">${html}</p></a>`)
                .get(0);
        },
        sort: function () {
            return 0;
        },
    });

    this.custom_awesomplete_filter && this.custom_awesomplete_filter(this.awesomplete);

    this.$input.on(
        "input",
        frappe.utils.debounce(function (e) {
            var doctype = me.get_options();
            if (!doctype) return;
            if (!me.$input.cache[doctype]) {
                me.$input.cache[doctype] = {};
            }

            var term = e.target.value;

            if (me.$input.cache[doctype][term] != null) {
                // immediately show from cache
                me.awesomplete.list = me.$input.cache[doctype][term];
            }
            var args = {
                txt: term,
                doctype: doctype,
                ignore_user_permissions: me.df.ignore_user_permissions,
                reference_doctype: me.get_reference_doctype() || "",
            };

            me.set_custom_query(args);

            frappe.call({
                type: "POST",
                method: "frappe.desk.search.search_link",
                no_spinner: true,
                args: args,
                callback: function (r) {
                    if (!window.Cypress && !me.$input.is(":focus")) {
                        return;
                    }
                    r.results = me.merge_duplicates(r.results);

                    // show filter description in awesomplete
                    if (args.filters) {
                        let filter_string = me.get_filter_description(args.filters);
                        if (filter_string) {
                            r.results.push({
                                html: `<span class="text-muted" style="line-height: 1.5">${filter_string}</span>`,
                                value: "",
                                action: () => {
                                },
                            });
                        }
                    }

                    if (!me.df.only_select) {
                        if (frappe.model.can_create(doctype) && !me.df.islov) {
                            // new item
                            r.results.push({
                                html:
                                    "<span class='text-primary link-option'>" +
                                    "<i class='fa fa-plus' style='margin-right: 5px;'></i> " +
                                    __("Create a new {0}", [__(me.get_options())]) +
                                    "</span>",
                                label: __("Create a new {0}", [__(me.get_options())]),
                                value: "create_new__link_option",
                                action: me.new_doc,
                            });
                        }

                        //custom link actions
                        let custom__link_options =
                            frappe.ui.form.ControlLink.link_options &&
                            frappe.ui.form.ControlLink.link_options(me);

                        if (custom__link_options) {
                            r.results = r.results.concat(custom__link_options);
                        }

                        // advanced search
                        if (locals && locals["DocType"] && !me.df.islov) {
                            // not applicable in web forms
                            r.results.push({
                                html:
                                    "<span class='text-primary link-option'>" +
                                    "<i class='fa fa-search' style='margin-right: 5px;'></i> " +
                                    __("Advanced Search") +
                                    "</span>",
                                label: __("Advanced Search"),
                                value: "advanced_search__link_option",
                                action: me.open_advanced_search,
                            });
                        }
                    }
                    me.$input.cache[doctype][term] = r.results;
                    me.awesomplete.list = me.$input.cache[doctype][term];
                    me.toggle_href(doctype);
                },
            });
        }, 500)
    );

    this.$input.on("blur", function () {
        if (me.selected) {
            me.selected = false;
            return;
        }
        let value = me.get_input_value();
        let label = me.get_label_value();
        let last_value = me.last_value || "";

        if (value !== last_value) {
            me.parse_validate_and_set_in_model(value, null, label);
        }
    });

    this.$input.on("awesomplete-open", () => {
        this.autocomplete_open = true;

        if (!me.get_label_value() && !me.df.islov) {
            // hide link arrow to doctype if none is set
            me.$link.toggle(false);
        }
    });

    this.$input.on("awesomplete-close", (e) => {
        this.autocomplete_open = false;

        if (!me.get_label_value() && !me.df.islov) {
            // hide link arrow to doctype if none is set
            me.$link.toggle(false);
        }
    });

    this.$input.on("awesomplete-select", function (e) {
        var o = e.originalEvent;
        var item = me.awesomplete.get_item(o.text.value);

        me.autocomplete_open = false;

        // prevent selection on tab
        let TABKEY = 9;
        if (e.keyCode === TABKEY) {
            e.preventDefault();
            me.awesomplete.close();
            return false;
        }

        if (item.action) {
            item.value = "";
            item.label = "";
            item.action.apply(me);
        }

        // if remember_last_selected is checked in the doctype against the field,
        // then add this value
        // to defaults so you do not need to set it again
        // unless it is changed.
        if (me.df.remember_last_selected_value) {
            frappe.boot.user.last_selected_values[me.df.options] = item.value;
        }

        me.parse_validate_and_set_in_model(item.value, null, item.label);
    });

    this.$input.on("awesomplete-selectcomplete", function (e) {
        let o = e.originalEvent;
        if (o.text.value.indexOf("__link_option") !== -1) {
            me.$input.val("");
        }
    });
}
frappe.ui.form.ControlLink.prototype.set_link_title = async function (value) {
    let link_title
    const doctype = this.get_options();
    if (!this.df.islov) {
        if (!doctype || !this.is_title_link()) {
            this.translate_and_set_input_value(value, value);
            return;
        }
        link_title = frappe.utils.get_link_title(doctype, value) ||
            (await frappe.utils.fetch_link_title(doctype, value));
    } else {
        if (!this.lovshowVal) {
            const lovviewcode = this.df.lovviewcode
            const docName = this.get_options()
            this.lovshowVal = await new Promise((resolve) => {
                frappe.call({
                    method:
                        'lov.lov.doctype.lovview.lovview.get_link_title',
                    args: {
                        lovviewcode,
                        docName,
                        name: value
                    },
                    callback: (response) => {
                        resolve(response.message)
                    }
                });
            })
        }
        link_title = this.lovshowVal
    }
    this.translate_and_set_input_value(link_title, value);
}
frappe.ui.form.ControlLink.prototype.handle_lov = function () {
    const me = this;
    const lovviewcode = me.df.lovviewcode
    console.log(lovviewcode)
    if (!lovviewcode) {
        frappe.throw({message: __("您没有配置 lovviewcode 参数，请设置一个lov视图编码"), title: __("错误")});
    }
    frappe.call({
        method:
            'lov.lov.doctype.lovview.lovview.getAllByLovView',
        args: {
            docName: lovviewcode,
        },
        callback: (response) => {
            const lovcodtype = response.message?.[0]?.lovcodtype
            const dialogTitle = __(response.message?.[0]?.lovtitle || response.message?.[0]?.lovname)
            const lovshowfield = response.message?.[0]?.lovshowfield||'name'
            const setters = [...response.message].reduce((total, item) => {
                total[item.fieldname] = null
                return total
            }, {})
            const fields = [...response.message].reduce((total, item) => {
                total[item.name] = item.fieldname
                return total
            }, {})
            new LovDialog({
                doctype: lovcodtype,
                primary_action_label: '确定',
                dialogTitle,
                setters,
                multiple: false, // 暂时只支持单选，后续更新多选功能
                add_filters_group: 0,
                // date_field: 'name',
                columns: Array.from(Object.keys(setters)),
                action([selection], _, logThis) {
                    if (fields?.[lovshowfield])
                        me.lovshowVal = logThis.results.find(item => String(item.name) === String(selection))?.[fields[lovshowfield]] || selection
                    else
                        me.lovshowVal = selection
                    me.set_input(selection) // 执行 data 的 set_input()，然后执行 set_formatted_input()
                    // 执行 set_value 保存值
                    const value = me.get_input_value();
                    const label = me.get_label_value();
                    const last_value = me.last_value || "";
                    if (value !== last_value) {
                        me.parse_validate_and_set_in_model(value, null, label);
                    }
                }
            });
        },
    });
}
frappe.ui.form.ControlLink.prototype.make_input = function () {
    var me = this;
    $(`<div class="link-field ui-front" style="position: relative;">
			<input type="text" class="input-with-feedback form-control">
			<span class="link-btn">
				<a class="btn-open no-decoration" title="${__("Open Link")}">
					${frappe.utils.icon(me.df.islov ? "search" : "arrow-right", "xs")}
				</a>
			</span>
		</div>`).prependTo(this.input_area);
    this.$input_area = $(this.input_area);
    this.$input = this.$input_area.find("input");
    this.$link = this.$input_area.find(".link-btn");
    this.$link_open = this.$link.find(".btn-open");
    this.set_input_attributes();
    if (me.df.islov) {
        me.$link.toggle(true);
        this.$link.on("click", function () {
            // 弹窗出来
            me.handle_lov()
        });
    } else {
        this.$input.on("focus", function () {
            setTimeout(function () {
                if (me.$input.val() && me.get_options()) {
                    let doctype = me.get_options();
                    let name = me.get_input_value();
                    me.$link.toggle(true);
                    me.$link_open.attr("href", frappe.utils.get_form_link(doctype, name));
                }

                if (!me.$input.val()) {
                    me.$input.val("").trigger("input");
                    me.$link.toggle(false);
                }
            }, 500);
        });
        this.$input.on("blur", function () {
            setTimeout(function () {
                me.$link.toggle(false);
            }, 500);
        });
    }
    this.$input.attr("data-target", this.df.options);
    this.input = this.$input.get(0);
    this.has_input = true;
    this.translate_values = true;
    this.setup_buttons();
    this.setup_awesomeplete();
    this.bind_change_event();
}

