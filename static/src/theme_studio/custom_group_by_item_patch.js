/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { CustomGroupByItem } from "@web/search/custom_group_by_item/custom_group_by_item";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";

// Crucial fix: The original CustomGroupByItem was just a <select> and had no nested OWL components.
// We MUST register Dropdown and DropdownItem inside its components registry so the XML template can use them without crashing OWL!
CustomGroupByItem.components = {
    ...CustomGroupByItem.components,
    Dropdown,
    DropdownItem,
};

patch(CustomGroupByItem.prototype, {
    onCustomGroupSelected(fieldName) {
        this.props.onAddCustomGroup(fieldName);
    }
});
