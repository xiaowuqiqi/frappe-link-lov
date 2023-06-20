// Copyright (c) 2023, wz1024 and contributors
// For license information, please see license.txt

const LovViewObj = {
    oldLovcodtypeVal: null,
    onload: function (frm) {
        LovViewObj.oldLovcodtypeVal = frm.doc.lovcodtype
    },
    lovname: function (frm) {
        const lovtitle = frm.doc.lovtitle
        if (!lovtitle || lovtitle.trim() === '') {
            const lovname = frm.doc.lovname
            frm.set_value('lovtitle', lovname)
        }
    },
    lovcodtype: function (frm) {
        if (!LovViewObj.oldLovcodtypeVal || LovViewObj.oldLovcodtypeVal !== frm.doc.lovcodtype) {
            frm.set_value('lovfields', null)
            frm.set_value('lovshowfield', null)
            LovViewObj.oldLovcodtypeVal = frm.doc.lovcodtype
        }
        if (!frm.doc.lovcodtype || frm.doc.lovcodtype.trim() === '') {
            // frm.toggle_enable('lovfields', false) // 设置不可操作
            frm.toggle_enable('lovshowfield', false) // 设置不可操作
        } else {
            // frm.toggle_enable('lovfields', true) // 设置可操作
            frm.toggle_enable('lovshowfield', true)
            frm.set_query("lovshowfield", function () {
                return {
                    "filters": {
                        "fieldtype": ["not in", 'Table'],
                        "parent": frm.doc.lovcodtype,
                    },
                };
            });
            frm.set_query('lovviewfieldname', "lovfields", function () {
                return {
                    "filters": {
                        "fieldtype": ["not in", [
                            'Table',
                            'Section Break',
                            'Tab Break',
                            'Column Break',
                            'HTML',
                            'HTML Editor',
                            // 'Small Text',
                        ]],
                        "parent": frm.doc.lovcodtype,
                    },
                };
            });
        }
    },
    before_save(frm) {
        if (frm.doc.lovcodtype) {
            //保存后，doctype就不能在次修改了，防止修改后使用的link报错
            frm.toggle_enable('lovcodtype', false) // 设置不可操作
        }
    },
    refresh(frm) {
        const code = frm.doc.name
        LovViewObj.lovcodtype(frm)
        frm.set_value('lovcode', code)
        const lovtitle = frm.doc.lovtitle
        if (!lovtitle || lovtitle.trim() === '') {
            const lovname = frm.doc.lovname
            frm.set_value('lovtitle', lovname)
        }
        if (frm.doc.lovcodtype) {
            //保存后，doctype就不能在次修改了，防止修改后使用的link报错
            frm.toggle_enable('lovcodtype', false) // 设置不可操作
        }
    },

}
frappe.ui.form.on('LovView', LovViewObj);
