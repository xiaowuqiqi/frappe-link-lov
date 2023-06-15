# Copyright (c) 2023, wz1024 and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class LovFieldsVirtual(Document):
    def load_from_db(self):
        data = frappe.db.get_value("DocField", {'name': ['=', self.name]}, '*')
        super(Document, self).__init__(data)

    @staticmethod
    def get_list(args):
        # data = frappe.db.get_all("DocField", fields='*')
        as_list = args['as_list'] if 'as_list' in args else False
        data = frappe.get_list("DocField", filters={'parent': ['=', 'LovView']}, fields='*')
        # data = frappe.db.get_values("DocField", {'parent': ['=', 'LovView']}, '*', as_dict=True)
        print(222, data)
        if as_list:
            return [(doc['label'], 1) for doc in data]
        # docField = frappe.db.get_value('DocField', '', '*')
        return [frappe._dict(doc) for doc in data]

    @staticmethod
    def get_count(args):
        print(args)
        return 10

    @staticmethod
    def get_stats(args):
        return {}
