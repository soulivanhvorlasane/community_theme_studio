/** @odoo-module **/
import { registry } from "@web/core/registry";

export function themeStudioMenuItem(env) {
    return {
        type: "item",
        id: "theme_studio",
        description: "Theme setting",
        callback: () => {
            console.log("Theme setting menu clicked!");
            if (env.services.notification) {
                env.services.notification.add("Theme Studio menu clicked!", { type: "info" });
            }
            if (env.services.theme_studio) {
                env.services.theme_studio.toggle(true);
            } else {
                console.error("theme_studio service not found on env!");
            }
        },
        sequence: 55,
    };
}

registry.category("user_menuitems").add("theme_studio", themeStudioMenuItem);
