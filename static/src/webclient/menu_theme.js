/** @odoo-module **/
/**
 * menu_theme.js – Runtime palette binding for dynamic menu bar styling.
 *
 * This service reads the active Theme Studio palette and pushes two CSS
 * custom properties onto :root every time the user changes the theme:
 *
 *   --o-menu-primary   → navbar background + dropdown background
 *   --o-menu-secondary → navbar item hover + dropdown item hover
 *
 * menu_theme.scss consumes these variables so all colors update instantly
 * without any page reload.
 */

import { registry } from "@web/core/registry";

/**
 * Push palette colors into CSS custom properties.
 * @param {string|null} primaryColor
 * @param {string|null} secondaryColor
 */
function applyMenuPalette(primaryColor, secondaryColor) {
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
        // --- Apply immediately on boot ---
        applyMenuPalette(theme_studio.primaryColor, theme_studio.secondaryColor);

        // --- Intercept applyLiveCss to stay in sync on every Theme Studio change ---
        const _original = theme_studio.applyLiveCss.bind(theme_studio);

        theme_studio.applyLiveCss = function (...args) {
            _original(...args);
            // After Odoo rebuilds its own CSS vars, push ours
            applyMenuPalette(this.primaryColor, this.secondaryColor);
        };
    },
};

registry.category("services").add("menu_theme_service", menuThemeService);
