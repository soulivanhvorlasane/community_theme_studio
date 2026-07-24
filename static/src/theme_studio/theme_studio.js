import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";

export class ThemeStudioPanel extends Component {
    setup() {
        this.ts = useService("theme_studio");
        this.tsState = useState(this.ts.state);
        this.notification = useService("notification");
        this.state = useState({ activeTab: 'style', isPaletteOpen: false });

        // 3-color palettes: c1=primary, c2=secondary, c3=text
        this.palettes = [
            { id: 1,  c1: '#0ea5e9', c2: '#0284c7', c3: '#ffffff' },
            { id: 2,  c1: '#3b82f6', c2: '#2563eb', c3: '#ffffff' },
            { id: 3,  c1: '#8b5cf6', c2: '#7c3aed', c3: '#ffffff' },
            { id: 4,  c1: '#6366f1', c2: '#4f46e5', c3: '#ffffff' },
            { id: 5,  c1: '#6b21a8', c2: '#7e22ce', c3: '#ffffff' },
            { id: 6,  c1: '#db2777', c2: '#be185d', c3: '#ffffff' },
            { id: 7,  c1: '#f43f5e', c2: '#e11d48', c3: '#ffffff' },
            { id: 8,  c1: '#064e3b', c2: '#047857', c3: '#ffffff' },
            { id: 9,  c1: '#047857', c2: '#059669', c3: '#ffffff' },
            { id: 10, c1: '#ea580c', c2: '#d97706', c3: '#ffffff' },
            { id: 11, c1: '#16a34a', c2: '#15803d', c3: '#ffffff' },
            { id: 12, c1: '#991b1b', c2: '#b91c1c', c3: '#ffffff' },
            { id: 13, c1: '#f97316', c2: '#fb923c', c3: '#1e293b' },
            { id: 14, c1: '#eab308', c2: '#fbbf24', c3: '#1e293b' },
            { id: 15, c1: '#831843', c2: '#9d174d', c3: '#ffffff' },
            { id: 16, c1: '#b91c1c', c2: '#dc2626', c3: '#ffffff' },
            { id: 17, c1: '#0f766e', c2: '#0d9488', c3: '#ffffff' },
            { id: 18, c1: '#ca8a04', c2: '#a16207', c3: '#ffffff' },
            { id: 19, c1: '#881337', c2: '#9f1239', c3: '#ffffff' },
            { id: 20, c1: '#000000', c2: '#374151', c3: '#ffffff' },
        ];

        // Preset swatches for the Theme tab (3 colors shown)
        this.presets = [
            // Odoo Brand
            { id: 'community',  label: 'Community',  primary: '#875a7b', secondary: '#00a09d', text: '#ffffff' },
            { id: 'enterprise', label: 'Enterprise', primary: '#2563eb', secondary: '#1d4ed8', text: '#ffffff' },
            // Nature
            { id: 'ocean',      label: 'Ocean',      primary: '#0ea5e9', secondary: '#0284c7', text: '#ffffff' },
            { id: 'forest',     label: 'Forest',     primary: '#16a34a', secondary: '#15803d', text: '#ffffff' },
            { id: 'sunset',     label: 'Sunset',     primary: '#f97316', secondary: '#ea580c', text: '#ffffff' },
            { id: 'lavender',   label: 'Lavender',   primary: '#7c3aed', secondary: '#6d28d9', text: '#ffffff' },
            { id: 'cherry',     label: 'Cherry',     primary: '#e11d48', secondary: '#be123c', text: '#ffffff' },
            // Dark / Tech
            { id: 'cyberpunk',  label: 'Cyberpunk',  primary: '#d946ef', secondary: '#a21caf', text: '#ffffff' },
            { id: 'midnight',   label: 'Midnight',   primary: '#1e3a5f', secondary: '#2563eb', text: '#ffffff' },
            { id: 'carbon',     label: 'Carbon',     primary: '#18181b', secondary: '#3f3f46', text: '#ffffff' },
            { id: 'snow',       label: 'Snow',       primary: '#f8fafc', secondary: '#cbd5e1', text: '#1e293b' },
            { id: 'minimal',    label: 'Minimal',    primary: '#1f2937', secondary: '#4b5563', text: '#ffffff' },
            // Modern
            { id: 'glass',      label: 'Glass',      primary: '#0f172a', secondary: '#6366f1', text: '#e2e8f0' },
            { id: 'neon',       label: 'Neon',       primary: '#0a0a0a', secondary: '#22d3ee', text: '#a5f3fc' },
            { id: 'pastel',     label: 'Pastel',     primary: '#fbbf24', secondary: '#f472b6', text: '#1e293b' },
            { id: 'desert',     label: 'Desert',     primary: '#d97706', secondary: '#b45309', text: '#ffffff' },
            { id: 'tropical',   label: 'Tropical',   primary: '#059669', secondary: '#0d9488', text: '#ffffff' },
            { id: 'sakura',     label: 'Sakura',     primary: '#ec4899', secondary: '#f9a8d4', text: '#1e293b' },
            { id: 'autumn',     label: 'Autumn',     primary: '#c2410c', secondary: '#a16207', text: '#ffffff' },
            { id: 'winter',     label: 'Winter',     primary: '#1e40af', secondary: '#7dd3fc', text: '#ffffff' },
            { id: 'spring',     label: 'Spring',     primary: '#65a30d', secondary: '#84cc16', text: '#1e293b' },
        ];
    }

    setTab(tabName) {
        this.state.activeTab = tabName;
    }

    togglePalette(ev) {
        if (ev) {
            ev.stopPropagation();
        }
        this.state.isPaletteOpen = !this.state.isPaletteOpen;
    }

    onPaletteSelect(palette) {
        this.state.isPaletteOpen = false;
        this.tsState.primaryColor = palette.c1;
        this.tsState.secondaryColor = palette.c2;
        this.tsState.textColor = palette.c3;
        this.ts.applyLiveCss();
        this._syncDomInputs();
        this.notification.add("Applied palette!", { type: "success" });
    }

    async onSave() {
        await this.ts.saveConfig();
        this.notification.add("Theme settings saved successfully!", { type: "success" });
    }

    onClose() {
        this.ts.toggle(false);
    }

    onReset() {
        this.ts.primaryColor = "#0ea5e9";
        this.ts.secondaryColor = "#017e84";
        this.ts.textColor = "#ffffff";
        this.ts.bgImage = false;
        this.ts.darkMode = false;
        this.ts.glassmorphism = false;
        this.ts.overlayOpacity = 0;
        this._syncDomInputs();
    }

    // ── Color handlers (Style tab) ──
    onPrimaryColorChange(ev) {
        this.ts.primaryColor = ev.target.value;
    }

    onSecondaryColorChange(ev) {
        this.ts.secondaryColor = ev.target.value;
    }

    onTextColorChange(ev) {
        this.ts.textColor = ev.target.value;
    }

    // ── Color handlers (Theme tab) ──
    onPrimaryChange(ev) {
        this.ts.primaryColor = ev.target.value;
    }

    onSecondaryChange(ev) {
        this.ts.secondaryColor = ev.target.value;
    }

    // ── File uploads ──
    onImageUpload(ev) {
        const file = ev.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.tsState.bgImage = e.target.result.split(',')[1];
                this.ts.applyLiveCss();
            };
            reader.readAsDataURL(file);
        }
    }

    onFaviconUpload(ev) {
        const file = ev.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.tsState.favicon = e.target.result.split(',')[1];
                this.ts.applyLiveCss();
            };
            reader.readAsDataURL(file);
        }
    }
    
    onClearImage() {
        this.ts.bgImage = false;
    }

    // ── Toggle handlers ──
    onDarkModeChange(ev) {
        this.ts.darkMode = ev.target.checked;
        this.ts.applyLiveCss();
    }

    onGlassmorphismChange(ev) {
        this.ts.glassmorphism = ev.target.checked;
        this.ts.applyLiveCss();
    }

    onOverlayOpacityChange(ev) {
        this.ts.overlayOpacity = parseFloat(ev.target.value);
        this.ts.applyLiveCss();
    }

    // ── Preset click ──
    onPresetClick(presetName) {
        this.ts.applyPreset(presetName);
        this._syncDomInputs();
    }

    /**
     * Force-sync all DOM inputs after a bulk state change (preset, palette, reset).
     * Browser color inputs, checkboxes, and range sliders ignore HTML attribute
     * changes once the user has interacted — we must set DOM properties directly.
     */
    _syncDomInputs() {
        requestAnimationFrame(() => {
            const panel = document.querySelector('.o_theme_studio_panel');
            if (!panel) return;

            // Style tab: 3 color inputs (class: ts-color-input)
            const styleInputs = panel.querySelectorAll('.ts-color-input');
            if (styleInputs[0]) styleInputs[0].value = this.tsState.primaryColor;
            if (styleInputs[1]) styleInputs[1].value = this.tsState.secondaryColor;
            if (styleInputs[2]) styleInputs[2].value = this.tsState.textColor;

            // Theme tab: 2 color pickers (class: ts-color-picker)
            const themeInputs = panel.querySelectorAll('.ts-color-picker');
            if (themeInputs[0]) themeInputs[0].value = this.tsState.primaryColor;
            if (themeInputs[1]) themeInputs[1].value = this.tsState.secondaryColor;

            // Checkboxes: dark mode & glassmorphism
            const checkboxes = panel.querySelectorAll('.form-check-input[type="checkbox"]');
            if (checkboxes[0]) checkboxes[0].checked = this.tsState.darkMode;
            if (checkboxes[1]) checkboxes[1].checked = this.tsState.glassmorphism;

            // Range: overlay opacity
            const ranges = panel.querySelectorAll('input[type="range"]');
            if (ranges[0]) ranges[0].value = this.tsState.overlayOpacity;
        });
    }
}

ThemeStudioPanel.template = "community_theme_studio.ThemeStudioPanel";

registry.category("main_components").add("ThemeStudioPanel", {
    Component: ThemeStudioPanel,
});
