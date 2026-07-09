import { registry } from "@web/core/registry";
import { reactive } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { rpc } from "@web/core/network/rpc";

export const themeStudioService = {
    start(env) {
        const state = reactive({ 
            isOpen: false,
            // ── 3-Color Palette ──
            primaryColor: "#714B67",    // navbar bg, dropdown bg, active states, badges
            secondaryColor: "#017e84", // hover bg, highlights, buttons, accents
            textColor: "#ffffff",       // labels, menu items, status text (auto-contrast)
            bgImage: false,
            favicon: false,
            darkMode: false,
            glassmorphism: false,
            overlayOpacity: 0,
            activePreset: null,

            // Style tab variables
            pFontSize: 1,
            pSpacing: 0,
            pFontFamily: "System Fonts",
            navHeight: 46,
            navFontSize: 1,
            navMarginH: 0,
            navPaddingH: 0.63,
            navBorderRad: 0,
            formSpacing: 4,
        });

        async function loadConfig() {
            try {
                const config = await rpc("/theme_studio/get_config", {});
                state.primaryColor = config.primary_color || '#714B67';
                state.secondaryColor = config.secondary_color || '#017e84';
                state.textColor = config.text_color || '#ffffff';
                state.bgImage = config.bg_image || false;
                state.favicon = config.favicon || false;
                state.darkMode = config.dark_mode;
                state.glassmorphism = config.glassmorphism;
                state.overlayOpacity = config.overlay_opacity;
                applyLiveCss();
            } catch (error) {
                console.error("Theme Studio failed to load config", error);
                applyLiveCss();
            }
        }
        
        async function saveConfig() {
            await rpc('/theme_studio/save_config', {
                primary_color: state.primaryColor,
                secondary_color: state.secondaryColor,
                text_color: state.textColor,
                dark_mode: state.darkMode,
                glassmorphism: state.glassmorphism,
                overlay_opacity: state.overlayOpacity,
                bg_image: state.bgImage,
                favicon: state.favicon
            });
        }

        function toggle(force) {
            if (typeof force === 'boolean') {
                state.isOpen = force;
            } else {
                state.isOpen = !state.isOpen;
            }
        }

        function hexToRgb(hex) {
            hex = hex.replace('#', '');
            if (hex.length === 3) {
                hex = hex.split('').map(char => char + char).join('');
            }
            if (hex.length !== 6) return "113, 75, 103";
            return `${parseInt(hex.substring(0, 2), 16)}, ${parseInt(hex.substring(2, 4), 16)}, ${parseInt(hex.substring(4, 6), 16)}`;
        }

        /**
         * Compute perceived luminance (0–255) of a hex color.
         * Uses the standard relative luminance formula so we can decide
         * whether the navbar needs light or dark text.
         * @param {string} hex  e.g. '#f8fafc'
         * @returns {number} 0 (black) – 255 (white)
         */
        function perceivedLuminance(hex) {
            const rgb = hex.replace('#', '');
            const r = parseInt(rgb.substring(0, 2), 16);
            const g = parseInt(rgb.substring(2, 4), 16);
            const b = parseInt(rgb.substring(4, 6), 16);
            // Standard luminance weighting (ITU-R BT.601)
            return 0.299 * r + 0.587 * g + 0.114 * b;
        }

        /**
         * Auto-contrast: returns white or dark text based on background luminance.
         */
        function autoContrastText(bgHex) {
            return perceivedLuminance(bgHex) > 186 ? '#1e293b' : '#ffffff';
        }

        function applyLiveCss() {
            const root = document.documentElement;
            const p = state.primaryColor;
            const s = state.secondaryColor;
            const t = state.textColor;
            const pRgb = hexToRgb(p);
            const sRgb = hexToRgb(s);

            // ── CSS Custom Properties ──
            root.style.setProperty('--bs-primary', p);
            root.style.setProperty('--bs-primary-rgb', pRgb);
            root.style.setProperty('--bs-secondary', s);
            root.style.setProperty('--bs-secondary-rgb', sRgb);
            root.style.setProperty('--o-brand-primary', p);
            root.style.setProperty('--o-brand-odoo', p);
            root.style.setProperty('--ts-text-color', t);

            // ── Auto-contrast ──
            const isLightNavbar = state.darkMode ? false : perceivedLuminance(p) > 186;
            const isLightHover  = state.darkMode ? false : perceivedLuminance(s) > 186;

            // Menu text: use preset's text color, but in dark mode always white
            const menuTextColor = state.darkMode ? '#ffffff' : (isLightNavbar ? '#1e293b' : t);
            const menuHoverBg   = state.darkMode ? '#2e3150' : s;
            const menuHoverText = state.darkMode ? '#ffffff' : (isLightHover ? '#1e293b' : t);
            // Badge text: auto-contrast against primary bg
            const badgeText = autoContrastText(p);

            root.style.setProperty('--o-menu-text',       menuTextColor);
            root.style.setProperty('--o-menu-hover-text', menuHoverText);
            root.style.setProperty('--o-menu-hover-bg',   menuHoverBg);
            root.style.setProperty('--bs-body-color',     state.darkMode ? '#e2e4f0' : '#212529');

            // Body classes for SCSS scoping
            document.body.classList.toggle('preset-snow',         state.activePreset === 'snow');
            document.body.classList.toggle('preset-light-navbar', isLightNavbar);
            document.body.setAttribute('data-preset', state.activePreset || '');

            if (state.darkMode) {
                root.setAttribute('data-bs-theme', 'dark');
                document.body.classList.add('o_dark_mode');
                document.cookie = "color_scheme=dark; path=/; max-age=31536000";
            } else {
                root.setAttribute('data-bs-theme', 'light');
                document.body.classList.remove('o_dark_mode');
                document.cookie = "color_scheme=light; path=/; max-age=31536000";
            }

            // Force Chart.js to update if it's loaded
            if (window.Chart && window.Chart.defaults) {
                const textColor = state.darkMode ? '#e4e4e4' : '#111827';
                const gridColor = state.darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
                
                window.Chart.defaults.color = textColor;
                if (window.Chart.defaults.scale && window.Chart.defaults.scale.grid) {
                    window.Chart.defaults.scale.grid.color = gridColor;
                }
                if (window.Chart.defaults.plugins && window.Chart.defaults.plugins.legend && window.Chart.defaults.plugins.legend.labels) {
                    window.Chart.defaults.plugins.legend.labels.color = textColor;
                }
                
                // Update all existing charts
                for (let id in window.Chart.instances) {
                    let chart = window.Chart.instances[id];
                    if (chart.options && chart.options.scales) {
                        for (let scale in chart.options.scales) {
                            if (chart.options.scales[scale].ticks) chart.options.scales[scale].ticks.color = textColor;
                            if (chart.options.scales[scale].grid) chart.options.scales[scale].grid.color = gridColor;
                        }
                    }
                    if (chart.options && chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
                        chart.options.plugins.legend.labels.color = textColor;
                    }
                    chart.update();
                }
                
                // Dispatch resize event to force Odoo's graph renderer to adapt
                window.dispatchEvent(new Event('resize'));
            }

            // Favicon
            if (state.favicon) {
                let faviconLink = document.querySelector("link[rel~='icon']");
                if (!faviconLink) {
                    faviconLink = document.createElement('link');
                    faviconLink.rel = 'shortcut icon';
                    document.head.appendChild(faviconLink);
                }
                faviconLink.type = 'image/x-icon';
                faviconLink.href = 'data:image/x-icon;base64,' + state.favicon;
            }

            // ── Injected <style> block ──
            let liveStyle = document.getElementById('theme_studio_live');
            if (!liveStyle) {
                liveStyle = document.createElement('style');
                liveStyle.id = 'theme_studio_live';
                document.head.appendChild(liveStyle);
            }
            
            let css = `
                .o_main_navbar .o_menu_sections,
                .o_main_navbar .o_menu_systray,
                .o_main_navbar .o_menu_brand,
                .o_main_navbar .o_menu_sections > * {
                    background-color: transparent !important;
                }
            `;
            
            // ── Navbar background ──
            if (state.darkMode) {
                if (state.glassmorphism) {
                    css += `
                        .o_main_navbar {
                            background-color: rgba(22, 24, 32, 0.85) !important;
                            backdrop-filter: blur(10px) !important;
                            border-bottom: 2px solid ${p} !important;
                        }
                    `;
                } else {
                    css += `
                        .o_main_navbar {
                            background-color: #1a1c2e !important;
                            border-bottom: 2px solid ${p} !important;
                        }
                    `;
                }
            } else if (state.glassmorphism) {
                css += `
                    .o_main_navbar {
                        background-color: rgba(${pRgb}, 0.7) !important;
                        backdrop-filter: blur(10px) !important;
                        border-color: transparent !important;
                    }
                `;
            } else {
                css += `
                    .o_main_navbar {
                        background-color: ${p} !important;
                        border-color: ${p} !important;
                    }
                `;
            }

            // ── Calendar CSS ──
            const calendarCSS = `
                /* Date Picker Dropdown (.o_datetime_picker) */
                .o_datetime_picker .o_datetime_picker_header {
                    background-color: ${p} !important;
                    color: ${menuHoverText} !important;
                    border-radius: 8px 8px 0 0;
                }
                .o_datetime_picker .o_datetime_picker_header .btn, 
                .o_datetime_picker .o_datetime_picker_header .o_datetime_button {
                    color: ${menuHoverText} !important;
                }
                .o_datetime_picker .o_datetime_picker_header .btn:hover,
                .o_datetime_picker .o_datetime_picker_header .o_datetime_button:hover {
                    background-color: rgba(255, 255, 255, 0.2) !important;
                }
                .o_datetime_picker .o_date_item_cell {
                    border: 1px solid rgba(128, 128, 128, 0.1) !important;
                    border-radius: 6px !important;
                    transition: all 0.3s ease;
                }
                .o_datetime_picker .o_date_item_cell:hover:not(.o_out_of_range) {
                    background-color: rgba(${sRgb}, 0.15) !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .o_datetime_picker .o_selected:not(.o_select_start):not(.o_select_end) {
                    background-color: rgba(${sRgb}, 0.3) !important;
                }
                .o_datetime_picker .o_highlighted:before,
                .o_datetime_picker .o_select_start:before,
                .o_datetime_picker .o_select_end:before {
                    background-color: ${s} !important;
                    box-shadow: 0 2px 8px rgba(${sRgb}, 0.4) !important;
                    border: none !important;
                }
                .o_datetime_picker .o_select_start,
                .o_datetime_picker .o_select_end,
                .o_datetime_picker .o_highlighted {
                    color: ${menuHoverText} !important;
                }
                .o_datetime_picker .o_current:not(.o_select_start):not(.o_select_end):not(.o_highlighted):before {
                    box-shadow: inset 0 0 0 2px ${s} !important;
                    background-color: transparent !important;
                }

                /* Main App Calendar View */
                .o_calendar_view .fc-header-toolbar {
                    background-color: ${p} !important;
                    color: ${menuHoverText} !important;
                    padding: 10px;
                    border-radius: 8px;
                }
                .o_calendar_view .fc-header-toolbar .fc-button {
                    background-color: rgba(255, 255, 255, 0.2) !important;
                    color: inherit !important;
                    border: none !important;
                }
                .o_calendar_view .fc-header-toolbar .fc-button:hover {
                    background-color: rgba(255, 255, 255, 0.3) !important;
                }
                .o_calendar_view .fc-day-today {
                    background-color: rgba(${sRgb}, 0.05) !important;
                    box-shadow: inset 0 0 0 2px ${s} !important;
                }
                .o_calendar_view .fc-event {
                    background-color: ${s} !important;
                    border-color: ${s} !important;
                    color: ${menuHoverText} !important;
                }
                .o_calendar_view .fc-event .fc-bg {
                    background-color: transparent !important;
                }
            `;
            css += calendarCSS;

            // ── Background image ──
            if (state.bgImage) {
                css += `
                    .o_web_client, .oe_website_login_container {
                        background-image: linear-gradient(rgba(0,0,0,${state.overlayOpacity}), rgba(0,0,0,${state.overlayOpacity})), url('data:image/png;base64,${state.bgImage}') !important;
                        background-size: cover !important;
                        background-position: center !important;
                        background-attachment: fixed !important;
                    }
                    .o_content, .o_view_controller {
                        background-color: rgba(255, 255, 255, 0.9) !important;
                    }
                    [data-bs-theme="dark"] .o_content, [data-bs-theme="dark"] .o_view_controller {
                        background-color: rgba(33, 37, 41, 0.9) !important;
                    }
                `;
            }
            
            // ── Badges: Primary bg + auto-contrast text ──
            css += `
                .badge.text-bg-success, .badge.text-bg-info, .badge.text-bg-warning, .badge.text-bg-danger {
                    background-color: ${p} !important;
                    color: ${badgeText} !important;
                }
            `;

            // ── Navbar text + dropdown (auto-contrast) ──
            css += `
                .o_main_navbar {
                    color: ${menuTextColor} !important;
                    transition: background-color 0.3s ease, color 0.3s ease;
                    --NavBar-entry-color: ${menuTextColor};
                    --NavBar-entry-color--active: ${menuTextColor};
                    --NavBar-entry-backgroundColor--hover: ${menuHoverBg};
                    --NavBar-entry-backgroundColor--focus: ${menuHoverBg};
                    --NavBar-entry-backgroundColor--active: ${menuHoverBg};
                }
                .o_main_navbar .o_menu_sections .o_nav_entry,
                .o_main_navbar .o_menu_sections .dropdown-toggle,
                .o_main_navbar .o_menu_brand,
                .o_main_navbar .o_menu_toggle,
                .o_main_navbar .o_menu_systray .o-dropdown > .o-dropdown--toggler {
                    color: ${menuTextColor} !important;
                    transition: background-color 0.3s ease, color 0.3s ease;
                }
                .o_main_navbar .o_menu_sections .o_nav_entry:hover,
                .o_main_navbar .o_menu_sections .o_nav_entry:focus,
                .o_main_navbar .o_menu_sections .dropdown-toggle:hover,
                .o_main_navbar .o_menu_sections .dropdown-toggle:focus,
                .o_main_navbar .o_menu_brand:hover,
                .o_main_navbar .o_menu_toggle:hover {
                    background-color: ${menuHoverBg} !important;
                    color: ${menuHoverText} !important;
                }
            `;

            // Dropdown & Popup CSS (injected via JS to guarantee immediate application bypassing SCSS cache)
            const popupCSS = `
                /* Base Dropdowns */
                .o_main_navbar .o-dropdown--menu,
                .o_main_navbar .dropdown-menu,
                .o-dropdown--menu,
                .dropdown-menu,
                .o_control_panel .dropdown-menu,
                .o_search_bar_menu,
                .o_dropdown_menu,
                .o-autocomplete--dropdown-menu,
                .o_popup_panel,
                .o_dialog .modal-content,
                .o_dialog .modal-header {
                    background-color: ${p} !important;
                    border: 1px solid rgba(0,0,0,0.1) !important;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
                    color: ${menuTextColor} !important;
                }
                /* Hover, Active & Focus States */
                .o_main_navbar .dropdown-item:hover,
                .o-dropdown--menu .dropdown-item:hover,
                .dropdown-menu .dropdown-item:hover,
                .o_control_panel .dropdown-menu .dropdown-item:hover,
                .o_search_bar_menu .dropdown-item:hover,
                .o_popup_panel .dropdown-item:hover,
                .o_popup_panel li:hover,
                .o_main_navbar .dropdown-item.active,
                .o_main_navbar .dropdown-item.selected,
                .o-dropdown--menu .dropdown-item.active,
                .dropdown-menu .dropdown-item.active,
                .o_dropdown_menu .dropdown-item.active,
                .o_dropdown_menu li.selected,
                .o_control_panel .dropdown-menu .dropdown-item.active,
                .o_search_bar_menu .dropdown-item.active,
                .o_popup_panel .dropdown-item.active,
                .o_popup_panel li.selected,
                .o_main_navbar .dropdown-item:focus,
                .o-dropdown--menu .dropdown-item:focus,
                .dropdown-menu .dropdown-item:focus,
                .o_dropdown_menu .dropdown-item:focus,
                .o_control_panel .dropdown-menu .dropdown-item:focus,
                .o_search_bar_menu .dropdown-item:focus,
                .o_popup_panel .dropdown-item:focus,
                .o_menu_item.o_accordion_toggle.dropdown-item.focus,
                .o_menu_item.dropdown-item.focus,
                select.o_add_custom_group_menu:focus,
                select.o_add_custom_group_menu.focus,
                .o_control_panel .dropdown-menu select:focus,
                .o_control_panel .dropdown-menu select.focus,
                .o_search_bar_menu select:focus,
                .o_search_bar_menu select.focus {
                    background-color: ${s} !important;
                    color: ${menuHoverText} !important;
                }
                
                /* Searchview Toggler Overrides */
                button.o_searchview_dropdown_toggler.btn.show,
                button.o_searchview_dropdown_toggler.btn:active,
                button.o_searchview_dropdown_toggler.btn:focus,
                .o_search_options button.dropdown-toggle.show,
                .o_search_options button.dropdown-toggle:active,
                .o_search_options button.dropdown-toggle:focus {
                    background-color: ${s} !important;
                    color: ${menuHoverText} !important;
                    border-color: ${s} !important;
                    box-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.1) !important;
                }
                /* Native Select inside search panels (fallback) */
                .o_control_panel .dropdown-menu select,
                .o_search_bar_menu select,
                select.o_add_custom_group_menu {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                    color: ${menuTextColor} !important;
                }
                .o_control_panel .dropdown-menu select option,
                .o_search_bar_menu select option,
                select.o_add_custom_group_menu option {
                    background-color: ${p} !important;
                    color: ${menuTextColor} !important;
                }
                .o_control_panel .dropdown-menu select option:checked,
                .o_search_bar_menu select option:checked,
                select.o_add_custom_group_menu option:checked,
                .o_control_panel .dropdown-menu select option:hover,
                .o_search_bar_menu select option:hover,
                select.o_add_custom_group_menu option:hover,
                .o_control_panel .dropdown-menu select:focus option:checked,
                .o_search_bar_menu select:focus option:checked,
                select.o_add_custom_group_menu:focus option:checked {
                    background-color: ${s} !important;
                    color: ${menuHoverText} !important;
                }
            `;

            css += popupCSS;

            // Light navbar: subtle bottom border
            if (isLightNavbar) {
                css += `.o_main_navbar { border-bottom: 1px solid rgba(0,0,0,0.08) !important; }`;
            }

            // ── Buttons: Secondary color for primary action buttons ──
            css += `
                .btn-primary {
                    background-color: ${s} !important;
                    border-color: ${s} !important;
                    color: ${autoContrastText(s)} !important;
                    transition: background-color 0.3s ease, border-color 0.3s ease;
                }
                .btn-primary:hover, .btn-primary:focus {
                    filter: brightness(0.9) !important;
                }
            `;

            liveStyle.textContent = css;

            // ── Dark-mode accent injection ──
            let darkStyle = document.getElementById('theme_studio_dark');
            if (!darkStyle) {
                darkStyle = document.createElement('style');
                darkStyle.id = 'theme_studio_dark';
                document.head.appendChild(darkStyle);
            }

            if (state.darkMode) {
                darkStyle.textContent = `
                    /* ── Dark mode preset accent overrides ── */

                    /* Calendar events: primary bg */
                    body.o_dark_mode .fc-event,
                    body.o_dark_mode .o_calendar_event,
                    body.o_dark_mode .o_event {
                        background-color: ${p} !important;
                        border-color: ${p} !important;
                        color: ${badgeText} !important;
                    }
                    body.o_dark_mode .fc-event:hover,
                    body.o_dark_mode .o_calendar_event:hover {
                        filter: brightness(1.15) !important;
                    }

                    /* Kanban column header: primary accent */
                    body.o_dark_mode .o_kanban_header_title {
                        border-bottom: 2px solid ${p} !important;
                    }
                    /* Kanban card hover: secondary border */
                    body.o_dark_mode .o_kanban_record:hover {
                        border-color: ${s} !important;
                        background-color: rgba(${sRgb}, 0.12) !important;
                    }

                    /* List: selected row → primary accent */
                    body.o_dark_mode .o_list_view .o_selected_row,
                    body.o_dark_mode .o_list_view .table-active {
                        background-color: rgba(${pRgb}, 0.22) !important;
                    }
                    /* List: row hover → secondary tint */
                    body.o_dark_mode .o_list_view tbody tr:hover,
                    body.o_dark_mode .o_list_view .o_data_row:hover {
                        background-color: rgba(${sRgb}, 0.15) !important;
                    }

                    /* Pivot: total cells → primary tint */
                    body.o_dark_mode .o_pivot .o_pivot_cell_value.o_bold,
                    body.o_dark_mode .o_pivot td.o_bold {
                        background-color: rgba(${pRgb}, 0.18) !important;
                    }
                    /* Pivot: header hover → secondary tint */
                    body.o_dark_mode .o_pivot thead th:hover {
                        background-color: rgba(${sRgb}, 0.22) !important;
                    }

                    /* Activity: done state → primary accent */
                    body.o_dark_mode .o_activity_button.o_activity_done,
                    body.o_dark_mode .o_activity_button.today {
                        background-color: rgba(${pRgb}, 0.22) !important;
                        border-color: ${p} !important;
                        color: ${p} !important;
                    }
                    /* Activity: hover → secondary */
                    body.o_dark_mode .o_activity_button:hover,
                    body.o_dark_mode .o_activity .o_activity_icon:hover {
                        background-color: ${s} !important;
                        border-color: ${s} !important;
                        color: ${autoContrastText(s)} !important;
                    }

                    /* Calendar: today highlight → primary tint */
                    body.o_dark_mode .fc-day-today,
                    body.o_dark_mode .fc-daygrid-day.fc-day-today {
                        background-color: rgba(${pRgb}, 0.12) !important;
                        border-left: 3px solid ${p} !important;
                    }

                    /* Form notebook active tab → primary accent */
                    body.o_dark_mode .o_form_view .o_notebook .nav-link.active {
                        border-bottom-color: ${p} !important;
                    }

                    /* Status bar current state → primary */
                    body.o_dark_mode .o_form_view .o_statusbar_status .btn.o_arrow_button_current {
                        color: ${p} !important;
                    }

                    /* Control panel buttons hover → secondary */
                    body.o_dark_mode .o_control_panel_actions .btn:hover,
                    body.o_dark_mode .o_control_panel_breadcrumbs .btn:hover {
                        background-color: ${s} !important;
                        border-color: ${s} !important;
                        color: ${autoContrastText(s)} !important;
                    }

                    /* Schedule activity hover → primary tint */
                    body.o_dark_mode .o_activity_schedule_btn:hover,
                    body.o_dark_mode .o_schedule_activity:hover {
                        background-color: rgba(${pRgb}, 0.22) !important;
                        border-color: ${p} !important;
                    }

                    /* Badges in dark mode */
                    body.o_dark_mode .badge.text-bg-success,
                    body.o_dark_mode .badge.text-bg-info,
                    body.o_dark_mode .badge.text-bg-warning,
                    body.o_dark_mode .badge.text-bg-danger {
                        background-color: ${p} !important;
                        color: ${badgeText} !important;
                    }
                `;
            } else {
                darkStyle.textContent = '';
            }
        }

        // ── Presets: 3-color definitions ──
        // Each preset: { primary, secondary, text, glass, opacity }
        // darkMode is always set to false when applying a preset.
        function applyPreset(preset) {
            const presets = {
                // --- Odoo Brand ---
                'community':  { primary: '#875a7b', secondary: '#00a09d', text: '#ffffff', glass: false, opacity: 0 },
                'enterprise': { primary: '#2563eb', secondary: '#1d4ed8', text: '#ffffff', glass: false, opacity: 0 },
                // --- Nature ---
                'ocean':      { primary: '#0ea5e9', secondary: '#0284c7', text: '#ffffff', glass: false, opacity: 0 },
                'forest':     { primary: '#16a34a', secondary: '#15803d', text: '#ffffff', glass: false, opacity: 0 },
                'sunset':     { primary: '#f97316', secondary: '#ea580c', text: '#ffffff', glass: false, opacity: 0 },
                'lavender':   { primary: '#7c3aed', secondary: '#6d28d9', text: '#ffffff', glass: false, opacity: 0 },
                'cherry':     { primary: '#e11d48', secondary: '#be123c', text: '#ffffff', glass: false, opacity: 0 },
                // --- Dark / Tech ---
                'cyberpunk':  { primary: '#d946ef', secondary: '#a21caf', text: '#ffffff', glass: false, opacity: 0 },
                'midnight':   { primary: '#1e3a5f', secondary: '#2563eb', text: '#ffffff', glass: false, opacity: 0 },
                'carbon':     { primary: '#18181b', secondary: '#3f3f46', text: '#ffffff', glass: false, opacity: 0 },
                'snow':       { primary: '#f8fafc', secondary: '#cbd5e1', text: '#1e293b', glass: false, opacity: 0 },
                'minimal':    { primary: '#1f2937', secondary: '#4b5563', text: '#ffffff', glass: false, opacity: 0 },
                // --- Modern ---
                'glass':      { primary: '#0f172a', secondary: '#6366f1', text: '#e2e8f0', glass: true,  opacity: 0.3 },
                'neon':       { primary: '#0a0a0a', secondary: '#22d3ee', text: '#a5f3fc', glass: false, opacity: 0 },
                'pastel':     { primary: '#fbbf24', secondary: '#f472b6', text: '#1e293b', glass: false, opacity: 0 },
                'desert':     { primary: '#d97706', secondary: '#b45309', text: '#ffffff', glass: false, opacity: 0 },
                'tropical':   { primary: '#059669', secondary: '#0d9488', text: '#ffffff', glass: false, opacity: 0 },
                'sakura':     { primary: '#ec4899', secondary: '#f9a8d4', text: '#1e293b', glass: false, opacity: 0 },
                'autumn':     { primary: '#c2410c', secondary: '#a16207', text: '#ffffff', glass: false, opacity: 0 },
                'winter':     { primary: '#1e40af', secondary: '#7dd3fc', text: '#ffffff', glass: false, opacity: 0 },
                'spring':     { primary: '#65a30d', secondary: '#84cc16', text: '#1e293b', glass: false, opacity: 0 },
            };
            if (presets[preset]) {
                state.activePreset = preset;
                state.primaryColor = presets[preset].primary;
                state.secondaryColor = presets[preset].secondary;
                state.textColor = presets[preset].text;
                state.darkMode = false;
                state.glassmorphism = presets[preset].glass;
                state.overlayOpacity = presets[preset].opacity;
                applyLiveCss();
            }
        }

        loadConfig();

        return {
            state,
            
            get isOpen() { return state.isOpen; },
            get primaryColor() { return state.primaryColor; },
            get secondaryColor() { return state.secondaryColor; },
            get textColor() { return state.textColor; },
            get bgImage() { return state.bgImage; },
            get favicon() { return state.favicon; },
            get darkMode() { return state.darkMode; },
            get glassmorphism() { return state.glassmorphism; },
            get overlayOpacity() { return state.overlayOpacity; },
            
            get pFontSize() { return state.pFontSize; },
            get pSpacing() { return state.pSpacing; },
            get pFontFamily() { return state.pFontFamily; },
            get navHeight() { return state.navHeight; },
            get navFontSize() { return state.navFontSize; },
            get navMarginH() { return state.navMarginH; },
            get navPaddingH() { return state.navPaddingH; },
            get navBorderRad() { return state.navBorderRad; },
            get formSpacing() { return state.formSpacing; },
            
            set primaryColor(val) { state.primaryColor = val; applyLiveCss(); },
            set secondaryColor(val) { state.secondaryColor = val; applyLiveCss(); },
            set textColor(val) { state.textColor = val; applyLiveCss(); },
            set bgImage(val) { state.bgImage = val; applyLiveCss(); },
            set favicon(val) { state.favicon = val; applyLiveCss(); },
            set darkMode(val) { state.darkMode = val; applyLiveCss(); },
            set glassmorphism(val) { state.glassmorphism = val; applyLiveCss(); },
            set overlayOpacity(val) { state.overlayOpacity = val; applyLiveCss(); },
            
            set pFontSize(val) { state.pFontSize = val; },
            set pSpacing(val) { state.pSpacing = val; },
            set pFontFamily(val) { state.pFontFamily = val; },
            set navHeight(val) { state.navHeight = val; },
            set navFontSize(val) { state.navFontSize = val; },
            set navMarginH(val) { state.navMarginH = val; },
            set navPaddingH(val) { state.navPaddingH = val; },
            set navBorderRad(val) { state.navBorderRad = val; },
            set formSpacing(val) { state.formSpacing = val; },
            
            toggle,
            saveConfig,
            applyLiveCss,
            applyPreset,
        };
    },
};

registry.category("services").add("theme_studio", themeStudioService);
