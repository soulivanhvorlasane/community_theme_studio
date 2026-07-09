/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { themeStudioService } from "../theme_studio/theme_studio_service";

patch(themeStudioService, {
    start(env) {
        // Call the original start method
        const service = super.start(env);
        
        // Save a reference to the original applyLiveCss function
        const originalApplyLiveCss = service.applyLiveCss;
        
        // Patch the applyLiveCss function
        service.applyLiveCss = function () {
            // Call original to update all the standard CSS and variables
            originalApplyLiveCss.call(this);
            
            // Apply the dynamic hover menu background based on the primary color
            document.documentElement.style.setProperty('--hover-menu-bg', this.primaryColor);
        };
        
        return service;
    }
});
