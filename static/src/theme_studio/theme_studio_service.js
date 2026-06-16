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
            
            liveStyle.textContent = css;
        }

        function applyPreset(preset) {
            const presets = {
                'ocean': { primary: '#0ea5e9', secondary: '#38bdf8', dark: true, glass: true, opacity: 0.4 },
                'forest': { primary: '#16a34a', secondary: '#4ade80', dark: true, glass: true, opacity: 0.5 },
                'cyberpunk': { primary: '#e11d48', secondary: '#f43f5e', dark: true, glass: true, opacity: 0.6 },
                'minimal': { primary: '#1f2937', secondary: '#4b5563', dark: false, glass: false, opacity: 0 },
            };
            if (presets[preset]) {
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
