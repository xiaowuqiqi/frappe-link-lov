// Copyright (c) 2023, wz1024 and contributors
// For license information, please see license.txt

const LovViewObj = {
    oldLovcodtypeVal: null,
    onload: function (frm) {
        LovViewObj.oldLovcodtypeVal = frm.doc.lovcodtype
    },
    lovcodtype: function (frm) {
        if (!LovViewObj.oldLovcodtypeVal || LovViewObj.oldLovcodtypeVal !== frm.doc.lovcodtype) {
            frm.set_value('lovfields', null)
            frm.set_value('lovshowfield', null)
            LovViewObj.oldLovcodtypeVal = frm.doc.lovcodtype
        }
        if (!frm.doc.lovcodtype || frm.doc.lovcodtype.trim() === '') {
            frm.toggle_enable('lovfields', false) // 设置不可操作
            frm.toggle_enable('lovshowfield', false) // 设置不可操作
        } else {
            frm.toggle_enable('lovfields', true) // 设置不可操作
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
    refresh(frm) {
        const code = frm.doc.name
        LovViewObj.lovcodtype(frm)
        frm.set_value('lovcode', code)
        const lovtitle = frm.doc.lovtitle
        if (!lovtitle || lovtitle.trim() === '') {
            const lovname = frm.doc.lovname
            frm.set_value('lovtitle', lovname)
        }
    },

}
frappe.ui.form.on('LovView', LovViewObj);
