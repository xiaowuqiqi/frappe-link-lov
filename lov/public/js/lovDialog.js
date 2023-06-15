export class LovDialog extends frappe.ui.form.MultiSelectDialog {
    get_filters_from_setters() {
        let me = this;
        let filters = (this.get_query ? this.get_query().filters : {}) || {};
        let filter_fields = [];

        if ($.isArray(this.setters)) {
            for (let df of this.setters) {
                filters[df.fieldname] =
                    me.dialog.fields_dict[df.fieldname].get_value() || undefined;
                me.args[df.fieldname] = filters[df.fieldname];
                filter_fields.push(df.fieldname);
            }
        } else {
            Object.keys(this.setters).forEach(function (setter) {
                var value = me.dialog.fields_dict[setter].get_value();
                value = (value || '').replace(/^\s*|\s*$/g, '')
                if (me.dialog.fields_dict[setter].df.fieldtype == "Data" && value) {
                    filters[setter] = ["like", "%" + value + "%"];
                } else {
                    filters[setter] = value || undefined;
                    me.args[setter] = filters[setter];
                }
                filter_fields.push(setter);
            });
        }

        return [filters, filter_fields];
    }

    make_list_row(result = {}) {
        var me = this;
        // Make a head row by default (if result not passed)
        let head = Object.keys(result).length === 0;

        let contents = ``;
        this.get_datatable_columns().forEach(function (column) {
            contents += `<div class="list-item__content ellipsis">
				${
                head
                    ? `<span class="ellipsis text-muted" title="${__(
                        frappe.model.unscrub(column)
                    )}">${__(frappe.model.unscrub(column))}</span>`
                    : column !== "name"
                        ? `<span class="ellipsis result-row" title="${__(
                            result[column] || ""
                        )}">${__(result[column] || "")}</span>`
                        : `<a href="${
                            "/app/" + frappe.router.slug(me.doctype) + "/" + result[column] ||
                            ""
                        }" class="list-id ellipsis" title="${__(result[column] || "")}">
							${__(result[column] || "")}</a>`
            }
			</div>`;
        });

        let $row = $(`
            <div class="list-item">
                <div class="list-item__content" style="flex: 0 0 10px;" ${!this.multiple ? 'hidden' : ''}>
				    <input type="checkbox" class="list-row-check" 
				           data-item-name="${result.name}" ${result.checked ? "checked" : ""}>
			    </div>
			    ${contents}
		    </div>
        `);
        head
            ? $row.addClass("list-item--head")
            : ($row = $(
                `<div class="list-item-container" data-item-name="${result.name}"></div>`
            ).append($row));

        return $row;
    }

    bind_events() {
        let me = this;

        this.$results.on("click", ".list-item-container", function (e) {
            if (!$(e.target).is(":checkbox") && !$(e.target).is("a")) {
                if (!me.multiple) {
                    $(this).find(":checkbox").trigger("click")
                    me.primary_action()
                } else {
                    $(this).find(":checkbox").trigger("click");
                }
            }
        });

        this.$results.on("click", ".list-item--head :checkbox", (e) => {
            this.$results
                .find(".list-item-container .list-row-check")
                .prop("checked", $(e.target).is(":checked"));
        });

        this.$parent.find(".input-with-feedback").on("change", () => {
            frappe.flags.auto_scroll = false;
            if (this.is_child_selection_enabled()) {
                this.show_child_results();
            } else {
                this.get_results();
            }
        });

        this.$parent.find('[data-fieldtype="Data"]').on("input", () => {
            var $this = $(this);
            clearTimeout($this.data("timeout"));
            $this.data(
                "timeout",
                setTimeout(function () {
                    frappe.flags.auto_scroll = false;
                    if (me.is_child_selection_enabled()) {
                        me.show_child_results();
                    } else {
                        me.empty_list();
                        me.get_results();
                    }
                }, 300)
            );
        });
    }

    primary_action() {
        let filters_data = this.get_custom_filters();
        const data_values = cur_dialog.get_values(); // to pass values of data fields
        const filtered_children = this.get_selected_child_names();
        const selected_documents = [
            ...this.get_checked_values(),
            ...this.get_parent_name_of_selected_children(),
        ];
        this.action(selected_documents, {
            ...this.args,
            ...data_values,
            ...filters_data,
            filtered_children,
        },this);
        this.dialog.cancel()
    }

    make() {
        // let doctype_plural = __(this.doctype).plural();
        let title = __(this.dialogTitle);

        this.dialog = new frappe.ui.Dialog({
            title: title,
            fields: this.fields,
            size: this.size,
            primary_action_label: this.multiple ? (this.primary_action_label || __("Get Items")) : null,
            // secondary_action_label: __("Make {0}", [__(this.doctype)]),
            primary_action: this.multiple ? () => this.primary_action() : null,
            // secondary_action: this.make_new_document.bind(this),
        });

        if (this.add_filters_group) {
            this.make_filter_area();
        }

        this.args = {};

        this.setup_results();
        this.bind_events();
        this.get_results();
        this.dialog.show();
    }

    async perform_search(args) {
        const res = await frappe.call({
            type: "GET",
            method: "lov.lov.doctype.lovview.lovview.search_widget",
            no_spinner: true,
            args: args,
        });
        const more = res.values.length && res.values.length > this.page_length ? 1 : 0;

        return [res, more];
    }
}