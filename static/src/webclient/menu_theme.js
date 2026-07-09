/** @odoo-module **/
/**
 * menu_theme.js – Runtime palette binding for dynamic menu bar styling.
 *
 * Registers as an Odoo service that depends on the `theme_studio` service.
 * Every time `applyLiveCss()` fires (e.g. when the user picks a new color in
 * Theme Studio), we read the primary and secondary colors and push them into
 * two CSS custom properties on :root:
 *
 *   --o-menu-primary   → used by .o_main_navbar & .dropdown-menu backgrounds
 *   --o-menu-secondary → used by hover states on navbar items & dropdown items
 *
 * The SCSS file (menu_theme.scss) uses these variables as its color source,
 * so no page reload is needed when the user changes the theme.
 */

import { registry } from "@web/core/registry";

function applyMenuColors(primaryColor, secondaryColor) {
    const root = document.documentElement;
    if (primaryColor) {
        root.style.setProperty("--o-menu-primary", primaryColor);
    }
    if (secondaryColor) {
        root.style.setProperty("--o-menu-secondary", secondaryColor);
    }
}

export const menuThemeService = {
    dependencies: ["theme_studio"],

    start(env, { theme_studio }) {
        // Apply immediately on boot with whatever colors are already loaded
        applyMenuColors(theme_studio.primaryColor, theme_studio.secondaryColor);

        // Intercept every future call to applyLiveCss so we stay in sync
        const originalApplyLiveCss = theme_studio.applyLiveCss.bind(theme_studio);

        theme_studio.applyLiveCss = function (...args) {
            originalApplyLiveCss(...args);
            applyMenuColors(this.primaryColor, this.secondaryColor);
        };
    },
};

registry.category("services").add("menu_theme_service", menuThemeService);
