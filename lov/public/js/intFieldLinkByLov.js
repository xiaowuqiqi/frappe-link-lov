const DocTypeObj = {
    validate: (frm) => {
        const validateErrList = frm.doc.fields
            .filter(fieldData => fieldData.fieldtype === "Link" && !fieldData.lovviewcode)
            .map(fieldData => fieldData.label)
        if (validateErrList.length > 0) {
            const str = validateErrList.reduce((total, item) => total + `,${item}`, '')
            frappe.throw(__(`一些字段设置了isLov属性，但是没有设置视图code，请前往设置。这些字段有：${str.slice(1)}`))
            return false
        }
    },
    before_save: async function (frm) {
        const fieldByLovviewcodeList = frm.doc.fields
            .filter(fieldData => fieldData.fieldtype === "Link" && fieldData.lovviewcode)
        const dataList = await Promise.all(fieldByLovviewcodeList.map(field =>
            frappe.db.get_list("LovView", {
                filters: {lovcode: field.lovviewcode},
                fields: ["lovcode", "name", 'lovcodtype']
            })
        ))
        dataList.forEach(([{lovcodtype}], i) => {
            // frm.fields_dict.fields.grid.set_value('options', lovcodtype, fieldByLovviewcodeList[i])
            const fieldsData = frm.doc.fields.map(fieldData => {
                if (fieldData.name === fieldByLovviewcodeList[i].name) {
                    fieldData.options = lovcodtype
                }
                return fieldData
            })
            frm.set_value('fields', fieldsData)
        })

    },
}
frappe.ui.form.on("DocType", DocTypeObj);

function initLovData(frm, doctype, docname) {
    // console.log(frm.fields_dict.fields.grid) // 子表单的doc
    // console.log(frm.fields_dict.fields.grid.set_value) // // 子表单的数据设置值
    const row = frappe.get_doc(doctype, docname);
    ///////////////////////// islov
    // 获取字段Field 的 doc
    const islovField = frm.cur_grid.grid_form.fields_dict.islov;
    if (row.fieldtype === "Link") {
        if (islovField.df.hidden) {
            islovField.df.hidden = 0
            islovField.refresh();
        }
    } else if (!islovField.df.hidden) {
        row.islov = 0
        islovField.df.hidden = 1
        islovField.refresh();
    }
    ///////////////////////// lovviewcode
    const lovviewcodeField = frm.cur_grid.grid_form.fields_dict.lovviewcode;
    const optionsField = frm.cur_grid.grid_form.fields_dict.options;
    if (row.islov && lovviewcodeField.df.hidden) {
        lovviewcodeField.df.hidden = 0// 设置子表单 lovviewcode ，字段隐藏变为显示
        lovviewcodeField.refresh();
        // 设置Options隐藏不使用options了
        // optionsField.df.hidden = 1
        optionsField.df.read_only = 1
        optionsField.refresh();
    }
    if (!row.islov && !lovviewcodeField.df.hidden) {
        row.lovviewcode = ''
        lovviewcodeField.df.hidden = 1
        lovviewcodeField.refresh();
        // optionsField.df.hidden = 0
        optionsField.df.read_only = 0
        optionsField.refresh();
    }
}

const DocFieldObj = {
    form_render: initLovData,
    fieldtype: initLovData,
    islov: initLovData,

}
frappe.ui.form.on("DocField", DocFieldObj);