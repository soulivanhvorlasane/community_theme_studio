import { registry } from "@web/core/registry";
import { reactive } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { rpc } from "@web/core/network/rpc";

export const themeStudioService = {
    start(env) {
        const state = reactive({ 
            isOpen: false,
            primaryColor: "#714B67",
            secondaryColor: "#8f8f8f",
            bgImage: false,
            favicon: false,
            darkMode: false,
            glassmorphism: false,
            overlayOpacity: 0,
            activePreset: null,   // tracks which preset is currently active
            
            // New Style dummy variables
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
                state.primaryColor = config.primary_color || '#ea580c';
                state.secondaryColor = config.secondary_color || '#32354a';
                state.textColor = config.text_color || '#212529';
                state.textStatusColor = config.text_status_color || '#ffffff';
                state.statusColor = config.status_color || '#17a2b8';
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
                text_status_color: state.textStatusColor,
                status_color: state.statusColor,
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

        function applyLiveCss() {
            // Update CSS variables instantly
            const root = document.documentElement;
            root.style.setProperty('--bs-primary', state.primaryColor);
            root.style.setProperty('--bs-primary-rgb', hexToRgb(state.primaryColor));
            root.style.setProperty('--bs-secondary', state.secondaryColor);
            root.style.setProperty('--bs-secondary-rgb', hexToRgb(state.secondaryColor));
            root.style.setProperty('--o-brand-primary', state.primaryColor);
            root.style.setProperty('--o-brand-odoo', state.primaryColor);
            root.style.setProperty('--bs-body-color', state.textColor);
            root.style.setProperty('--ts-status-color', state.statusColor);
            root.style.setProperty('--ts-text-status-color', state.textStatusColor);

            // ----------------------------------------------------------------
            // Auto-contrast: compute text color from navbar bg (primary) AND
            // hover text from hover bg (secondary) INDEPENDENTLY.
            // ITU-R BT.601 perceived luminance, threshold 186 (~73% of 255).
            // This ensures every preset—including Coral's bright-orange hover—
            // gets the right text color automatically.
            // ----------------------------------------------------------------
            const lum    = perceivedLuminance(state.primaryColor);
            const secLum = perceivedLuminance(state.secondaryColor);
            const isLightNavbar = lum    > 186;  // only Snow triggers this today
            const isLightHover  = secLum > 186;  // e.g. Snow secondary #cbd5e1

            const menuTextColor = isLightNavbar ? '#1e293b' : '#ffffff';
            const menuHoverBg   = state.secondaryColor;
            const menuHoverText = isLightHover  ? '#1e293b' : '#ffffff';

            root.style.setProperty('--o-menu-text',       menuTextColor);
            root.style.setProperty('--o-menu-hover-text', menuHoverText);
            root.style.setProperty('--o-menu-hover-bg',   menuHoverBg);

            // Body classes for SCSS scoping + CSS [data-preset] targeting
            document.body.classList.toggle('preset-snow',         state.activePreset === 'snow');
            document.body.classList.toggle('preset-light-navbar', isLightNavbar);
            document.body.setAttribute('data-preset', state.activePreset || '');

            if (state.darkMode) {
                root.setAttribute('data-bs-theme', 'dark');
                document.body.classList.add('o_dark_mode');
            } else {
                root.setAttribute('data-bs-theme', 'light');
                document.body.classList.remove('o_dark_mode');
            }

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
            
            if (state.glassmorphism) {
                css += `
                    .o_main_navbar {
                        background-color: rgba(${hexToRgb(state.primaryColor)}, 0.7) !important;
                        backdrop-filter: blur(10px) !important;
                        border-color: transparent !important;
                    }
                `;
            } else {
                css += `
                    .o_main_navbar {
                        background-color: var(--bs-primary) !important;
                        border-color: var(--bs-primary) !important;
                    }
                `;
            }

            if (state.bgImage) {
                css += `
                    .o_web_client, .oe_website_login_container {
                        background-image: linear-gradient(rgba(0,0,0,${state.overlayOpacity}), rgba(0,0,0,${state.overlayOpacity})), url('data:image/png;base64,${state.bgImage}') !important;
                        background-size: cover !important;
                        background-position: center !important;
                        background-attachment: fixed !important;
                    }
                    /* Make inner views slightly transparent to see the background */
                    .o_content, .o_view_controller {
                        background-color: rgba(255, 255, 255, 0.9) !important;
                    }
                    [data-bs-theme="dark"] .o_content, [data-bs-theme="dark"] .o_view_controller {
                        background-color: rgba(33, 37, 41, 0.9) !important;
                    }
                `;
            }
            
            css += `
                .badge.text-bg-success, .badge.text-bg-info, .badge.text-bg-warning, .badge.text-bg-danger {
                    background-color: var(--ts-status-color) !important;
                    color: var(--ts-text-status-color) !important;
                }
            `;

            // ----------------------------------------------------------------
            // Per-preset auto-contrast: navbar + dropdown text.
            // Rebuilt on every color/preset change → always accurate.
            // isLightNavbar / menuTextColor / menuHoverText computed above.
            // ----------------------------------------------------------------
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
                .o-dropdown--menu,
                .dropdown-menu {
                    background-color: ${state.primaryColor} !important;
                    border: ${isLightNavbar ? '1px solid rgba(0,0,0,0.10)' : 'none'} !important;
                    box-shadow: 0 4px 16px rgba(0,0,0,${isLightNavbar ? '0.10' : '0.30'}) !important;
                    transition: background-color 0.3s ease;
                }
                .o-dropdown--menu .o-dropdown-item,
                .o-dropdown--menu .dropdown-item,
                .dropdown-menu .dropdown-item,
                .dropdown-menu .dropdown-header {
                    color: ${menuTextColor} !important;
                    transition: background-color 0.3s ease, color 0.3s ease;
                }
                .o-dropdown--menu .o-dropdown-item:hover,
                .o-dropdown--menu .o-dropdown-item:focus,
                .o-dropdown--menu .dropdown-item:hover,
                .o-dropdown--menu .dropdown-item:focus,
                .dropdown-menu .dropdown-item:hover,
                .dropdown-menu .dropdown-item:focus {
                    background-color: ${menuHoverBg} !important;
                    color: ${menuHoverText} !important;
                }
            `;

            // Light navbar: subtle bottom border so it separates from content
            if (isLightNavbar) {
                css += `.o_main_navbar { border-bottom: 1px solid rgba(0,0,0,0.08) !important; }`;
            }

            liveStyle.textContent = css;

            // ----------------------------------------------------------------
            // Dark-mode preset accent injection.
            // dark_mode.scss uses rgba(var(--bs-primary-rgb), …) for accents,
            // but some elements need the exact hex value for bg/border so we
            // inject those here, rebuilt on every preset / dark-mode toggle.
            // ----------------------------------------------------------------
            let darkStyle = document.getElementById('theme_studio_dark');
            if (!darkStyle) {
                darkStyle = document.createElement('style');
                darkStyle.id = 'theme_studio_dark';
                document.head.appendChild(darkStyle);
            }

            if (state.darkMode) {
                const p  = state.primaryColor;
                const s  = state.secondaryColor;
                const pRgb = hexToRgb(p);
                const sRgb = hexToRgb(s);

                darkStyle.textContent = `
                    /* ── dark_mode preset accent overrides ── */

                    /* Calendar events: primary colour background */
                    body.o_dark_mode .fc-event,
                    body.o_dark_mode .o_calendar_event,
                    body.o_dark_mode .o_event {
                        background-color: ${p} !important;
                        border-color: ${p} !important;
                        color: #ffffff !important;
                    }
                    body.o_dark_mode .fc-event:hover,
                    body.o_dark_mode .o_calendar_event:hover {
                        filter: brightness(1.15) !important;
                    }

                    /* Kanban column header underline: primary accent */
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
                        color: #ffffff !important;
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
                        color: #ffffff !important;
                    }

                    /* Schedule activity hover → primary tint */
                    body.o_dark_mode .o_activity_schedule_btn:hover,
                    body.o_dark_mode .o_schedule_activity:hover {
                        background-color: rgba(${pRgb}, 0.22) !important;
                        border-color: ${p} !important;
                    }
                `;
            } else {
                // Clear dark overrides when dark mode is off
                darkStyle.textContent = '';
            }

        }

        function applyPreset(preset) {
            const presets = {
                // --- Odoo Brand ---
                // Community: classic Odoo Community purple + teal accent
                'community':  { primary: '#875a7b', secondary: '#00a09d', dark: false, glass: false, opacity: 0 },
                // Enterprise: deep navy + gold — premium feel with glass navbar
                'enterprise': { primary: '#1a1c2c', secondary: '#e9a21b', dark: true,  glass: true,  opacity: 0.2 },
                // --- Nature ---
                'ocean':      { primary: '#0ea5e9', secondary: '#0284c7', dark: true,  glass: true,  opacity: 0.4 },
                'forest':     { primary: '#16a34a', secondary: '#15803d', dark: true,  glass: true,  opacity: 0.5 },
                'sunset':     { primary: '#f97316', secondary: '#ea580c', dark: false, glass: false, opacity: 0 },
                'lavender':   { primary: '#7c3aed', secondary: '#6d28d9', dark: true,  glass: true,  opacity: 0.3 },
                'cherry':     { primary: '#e11d48', secondary: '#be123c', dark: true,  glass: false, opacity: 0 },
                // --- Dark / Tech ---
                'cyberpunk':  { primary: '#d946ef', secondary: '#a21caf', dark: true,  glass: true,  opacity: 0.6 },
                'midnight':   { primary: '#1e3a5f', secondary: '#2563eb', dark: true,  glass: true,  opacity: 0.5 },
                'carbon':     { primary: '#18181b', secondary: '#3f3f46', dark: true,  glass: false, opacity: 0 },
                'slate':      { primary: '#334155', secondary: '#475569', dark: true,  glass: false, opacity: 0 },
                'hacker':     { primary: '#052e16', secondary: '#16a34a', dark: true,  glass: true,  opacity: 0.7 },
                // --- Minimal / Light ---
                'minimal':    { primary: '#1f2937', secondary: '#4b5563', dark: false, glass: false, opacity: 0 },
                'snow':       { primary: '#f8fafc', secondary: '#cbd5e1', dark: false, glass: false, opacity: 0 },
                'sand':       { primary: '#d97706', secondary: '#b45309', dark: false, glass: false, opacity: 0 },
                'rose':       { primary: '#f43f5e', secondary: '#e11d48', dark: false, glass: false, opacity: 0 },
                // --- Brand-inspired ---
                'odoo':       { primary: '#714b67', secondary: '#017e84', dark: false, glass: false, opacity: 0 },
                'indigo':     { primary: '#4338ca', secondary: '#6366f1', dark: true,  glass: true,  opacity: 0.4 },
                'teal':       { primary: '#0d9488', secondary: '#0f766e', dark: true,  glass: false, opacity: 0 },
                'coral':      { primary: '#f43f5e', secondary: '#fb923c', dark: false, glass: false, opacity: 0 },
                'plum':       { primary: '#9333ea', secondary: '#7e22ce', dark: true,  glass: true,  opacity: 0.3 },
                'azure':      { primary: '#0369a1', secondary: '#0ea5e9', dark: true,  glass: true,  opacity: 0.4 },
            };
            if (presets[preset]) {
                state.activePreset = preset;           // ← track before applyLiveCss
                state.primaryColor = presets[preset].primary;
                state.secondaryColor = presets[preset].secondary;
                state.darkMode = presets[preset].dark;
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
