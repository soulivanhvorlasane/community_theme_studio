/** @odoo-module **/

import { CustomGroupByItem } from "@web/search/custom_group_by_item/custom_group_by_item";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";

CustomGroupByItem.components = {
    ...(CustomGroupByItem.components || {}),
    Dropdown,
    DropdownItem,
};
