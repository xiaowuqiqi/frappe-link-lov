// console.log(123123)
import {LovDialog} from "./lovDialog";

frappe.ui.form.ControlLov = class ControlLink extends frappe.ui.form.ControlData {
    make_input() {
        var me = this;
        $(`<div class="lov-field ui-front" style="position: relative;">
			<input type="text" class="input-with-feedback form-control">
			<span class="lov-btn">
				<a class="btn-open no-decoration" title="${__("Open Link")}">
					${frappe.utils.icon("search", "xs")}
					<!--放大镜icon-->
				</a>
			</span>
		</div>`).prependTo(this.input_area);
        this.$input_area = $(this.input_area);
        this.$input = this.$input_area.find("input");
        this.$lov_btn = this.$input_area.find(".lov-btn");
        // this.$btn_open = this.$lov_btn.find(".btn-open");
        this.set_input_attributes(); // 给html attr 注入数据
        this.$lov_btn.on("click", function () {
            // 弹窗出来
            me.handle_lov()
        });
        this.$input.attr("data-target", this.df.options);
        this.input = this.$input.get(0);
        this.has_input = true;
        this.translate_values = true;
        this.setup_buttons();
        // this.setup_awesomeplete();
        // this.bind_change_event();
    }

    get_options() {
        return this.df.options;
    }

    handle_lov() {
        // 如果没有配置则报错
        const me = this;
        if (!me.get_options()) {
            frappe.throw({message: __("您没有配置options参数，请设置一个lov视图编码"), title: __("错误")});
        }
        // data = frappe.get_list("DocField", filters={'parent': ['=', 'LovView']}, fields='*')
        //     b = frappe.db.get_value(
        // "Article", [['Authors', "authorname", '=', 'wz1024@163.com'], ['Article', "articlename", '=', '高校博客']],
        // ['`tabAuthors`.`authorname`','`tabArticle`.`articlename`'], cache=False)
        // frappe.db.get_list('LovView', {
        //     fields: '*',
        //     filters:[['LovView','name','=','VIEW230609000014'],['LovViewField', "parent", '=', 'VIEW230609000014']]
        // }).then((res) => {
        //     console.log(res)
        // });

        frappe.call({
            method:
                'lov.lov.doctype.lovview.lovview.getAllByLovView',
            args: {
                docName: me.get_options(),
            },
            callback: (response) => {
                // const fields = response.message.map(item => ({
                //     label: __(item.label),
                //     fieldname: item.fieldname,
                //     fieldtype: 'Data',
                //     options: item.options,
                // }))
                const lovcodtype = response.message?.[0]?.lovcodtype
                const dialogTitle = __(response.message?.[0]?.lovtitle || response.message?.[0]?.lovname)
                const lovshowfield = response.message?.[0].lovshowfield
                const setters = [...response.message].reduce((total, item) => {
                    total[item.fieldname] = null
                    return total
                }, {})
                const fields = [...response.message].reduce((total, item) => {
                    total[item.name] = item.fieldname
                    return total
                }, {})
                console.log(lovcodtype)
                console.log(fields)
                console.log()
                new LovDialog({
                    doctype: 'User',
                    // target: {},
                    primary_action_label: '确定',
                    dialogTitle,
                    setters,
                    multiple: false, // 暂时只支持单选，后续更新多选功能
                    add_filters_group: 0,
                    date_field: 'name',
                    columns: Array.from(Object.keys(fields)),
                    // get_query() {
                    //     return query_args;
                    // },
                    action([selection], _, logThis) {
                        me.set_input(selection) // 执行data的set_input()，然后执行set_formatted_input()
                        if(fields?.[lovshowfield])
                            me.lovshowVal=logThis.results.find(item=>item.name === selection)?.[fields[lovshowfield]]
                        else
                            me.lovshowVal = selection
                        console.log(me.lovshowVal, fields[lovshowfield], logThis.results)
                        // this.$input && this.$input.val(value);
                    }
                });
                // const dialog = new frappe.ui.Dialog({
                //     title,
                //     size: "large",
                //     fields,
                //     primary_action_label: '确定',
                //     primary_action(args) {
                //         if (!args) return;
                //         console.log(args)
                //         // frappe.throw({
                //         //     message: 'Please select Items from the Table',
                //         //     title: __('Items Required'),
                //         //     indicator: 'blue'
                //         // })
                //         // dialog.hide();
                //     }
                // });
            },
        });
        // frappe.db.get_list('LovView', {fields: '*'}).then((res) => {
        //     console.log(res)
        // });


        // function set_po_items_data(dialog) {
        //     var against_default_supplier = dialog.get_value("against_default_supplier");
        //     var items_for_po = dialog.get_value("items_for_po");
        //
        //     if (against_default_supplier) {
        //         let items_with_supplier = items_for_po.filter((item) => item.supplier)
        //
        //         dialog.fields_dict["items_for_po"].df.data = items_with_supplier;
        //         dialog.get_field("items_for_po").refresh();
        //     } else {
        //         let po_items = [];
        //         me.frm.doc.items.forEach(d => {
        //             let ordered_qty = me.get_ordered_qty(d, me.frm.doc);
        //             let pending_qty = (flt(d.stock_qty) - ordered_qty) / flt(d.conversion_factor);
        //             if (pending_qty > 0) {
        //                 po_items.push({
        //                     "doctype": "Sales Order Item",
        //                     "name": d.name,
        //                     "item_name": d.item_name,
        //                     "item_code": d.item_code,
        //                     "pending_qty": pending_qty,
        //                     "uom": d.uom,
        //                     "supplier": d.supplier
        //                 });
        //             }
        //         });
        //
        //         dialog.fields_dict["items_for_po"].df.data = po_items;
        //         dialog.get_field("items_for_po").refresh();
        //     }
        // }
        //
        // set_po_items_data(dialog);
        // dialog.get_field("items_for_po").grid.only_sortable();
        // dialog.get_field("items_for_po").refresh();
        // dialog.wrapper.find('.grid-heading-row .grid-row-check').click();
        // dialog.show();
    }

    set_input_attributes() {
        super.set_input_attributes();
        if (this.frm?.meta?.issingle) {
            // singles 没有长度要求
            // singles dont have any "real" length requirements
            return;
        }
        this.$input.attr("maxlength", this.df.length || 140);
        // 设置 放大镜
        if (this.$input.val() && this.get_options()) {
            let doctype = this.get_options(); // this.df.options
            let name = this.get_input_value();
            // this.$lov_btn.toggle(true);
            // this.$btn_open.attr("href", frappe.utils.get_form_link(doctype, name));
        }
    }

    setup_buttons() {
        // 如果在 grid_row中创建 this.with_link_btn === true
        if (this.only_input && !this.with_link_btn) {
            this.$input_area.find(".lov-btn").remove();
        }
    }

    // 设置 $input 的值
    set_formatted_input(value) {
        super.set_formatted_input();
        if (!value) return;
        this.$input && this.$input.val(this.lovshowVal);
        this.set_value(value, true)
    }
};

