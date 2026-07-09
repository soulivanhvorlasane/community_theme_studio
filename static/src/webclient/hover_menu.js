/** @odoo-module **/

import { registry } from "@web/core/registry";

export const hoverMenuService = {
    dependencies: ["theme_studio"],
    start(env, { theme_studio }) {
        // Save a reference to the original applyLiveCss function
        const originalApplyLiveCss = theme_studio.applyLiveCss;
        
        // Patch the instance method directly
        theme_studio.applyLiveCss = function () {
            // Call original to update all the standard CSS and variables
            originalApplyLiveCss.apply(this, arguments);
            
            // Apply the dynamic hover menu background based on the primary color
            document.documentElement.style.setProperty('--hover-menu-bg', this.primaryColor);
        };
    }
};

registry.category("services").add("hover_menu_service", hoverMenuService);
