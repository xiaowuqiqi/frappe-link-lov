import frappe
@frappe.whitelist()
def execute():
    def createFieldData(parent, fieldname, label, fieldtype, idx):
        return {
            'doctype': 'DocField',
            'parent': parent,
            'parentfield': 'fields',
            'parenttype': 'DocType',
            'fieldname': fieldname,
            'label': label,
            'fieldtype': fieldtype,
            'idx': idx,
            'options': '',
        }

    # 设置新增的lov字段
    doc = frappe.get_doc('DocType', 'DocField')
    fields = list(doc.fields)
    hasIsLov = next((True for f in doc.fields if f.fieldname == 'islov'), False)
    hasLovviewcode = next((True for f in doc.fields if f.fieldname == 'lovviewcode'), False)
    if not hasIsLov:
        (indexIdx, i) = next(((f.idx, i) for i, f in enumerate(fields) if f.fieldname == 'search_index'), None)
        fields.insert(i,
                      frappe.get_doc(createFieldData('DocField', 'islov', 'Is Lov', 'Check', float(indexIdx) + 0.1)))
    if not hasLovviewcode:
        (optionsIdx, i) = next(((f.idx, i) for i, f in enumerate(fields) if f.fieldname == 'options'), None)
        fields.insert(i,
                      frappe.get_doc(createFieldData('DocField', 'lovviewcode', 'Lov View Code', 'Data',
                                                     float(optionsIdx) - 0.1)))

    fields.sort(key=lambda item: item.idx)

    def fieldsFnByIdx(i, f):
        f.idx = i
        return f

    fields = list(fieldsFnByIdx(i, f) for i, f in enumerate(fields))

    for f in fields:
        if f.name:
            f.db_update()
        else:
            doc.append("fields", createFieldData('DocField', f.fieldname, f.label, f.fieldtype, f.idx))
    # 设置 doctype View Settings
    doc.db_set('show_title_field_in_link', 1, commit=True)
    doc.db_set('title_field', 'label', commit=True)

    doc.save(
        ignore_permissions=True,  # ignore write permissions during insert
        ignore_version=True,  # do not create a version record
    )
