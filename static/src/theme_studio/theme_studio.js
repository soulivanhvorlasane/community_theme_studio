import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";

export class ThemeStudioPanel extends Component {
    setup() {
        this.ts = useService("theme_studio");
        this.tsState = useState(this.ts.state);
        this.notification = useService("notification");
        this.state = useState({ activeTab: 'style', isPaletteOpen: false });

        this.palettes = [
            { id: 1, c1: '#0ea5e9', c2: '#ffffff', c3: '#d4d4d8' },
            { id: 2, c1: '#3b82f6', c2: '#ffffff', c3: '#f472b6' },
            { id: 3, c1: '#8b5cf6', c2: '#ffffff', c3: '#86efac' },
            { id: 4, c1: '#6366f1', c2: '#ffffff', c3: '#f9a8d4' },
            { id: 5, c1: '#6b21a8', c2: '#ffffff', c3: '#fde047' },
            { id: 6, c1: '#db2777', c2: '#ffffff', c3: '#93c5fd' },
            { id: 7, c1: '#f43f5e', c2: '#ffffff', c3: '#fdba74' },
            { id: 8, c1: '#064e3b', c2: '#ffffff', c3: '#d97706' },
            { id: 9, c1: '#047857', c2: '#ffffff', c3: '#0f766e' },
            { id: 10, c1: '#ea580c', c2: '#ffffff', c3: '#b45309' },
            { id: 11, c1: '#166534', c2: '#ffffff', c3: '#65a30d' },
            { id: 12, c1: '#991b1b', c2: '#ffffff', c3: '#1f2937' },
            { id: 13, c1: '#f97316', c2: '#ffffff', c3: '#64748b' },
            { id: 14, c1: '#eab308', c2: '#ffffff', c3: '#111827' },
            { id: 15, c1: '#831843', c2: '#ffffff', c3: '#b45309' },
            { id: 16, c1: '#b91c1c', c2: '#ffffff', c3: '#4ade80' },
            { id: 17, c1: '#0f766e', c2: '#ffffff', c3: '#0891b2' },
            { id: 18, c1: '#ca8a04', c2: '#ffffff', c3: '#374151' },
            { id: 19, c1: '#881337', c2: '#ffffff', c3: '#ef4444' },
            { id: 20, c1: '#000000', c2: '#ffffff', c3: '#6b7280' },
        ];

        this.presets = [
            // Odoo Brand
            { id: 'community',  label: 'Community',  primary: '#875a7b', secondary: '#00a09d' },
            { id: 'enterprise', label: 'Enterprise', primary: '#1a1c2c', secondary: '#e9a21b' },
            // Nature
            { id: 'ocean',    label: 'Ocean',    primary: '#0ea5e9', secondary: '#0284c7' },
            { id: 'forest',   label: 'Forest',   primary: '#16a34a', secondary: '#15803d' },
            { id: 'sunset',   label: 'Sunset',   primary: '#f97316', secondary: '#ea580c' },
            { id: 'lavender', label: 'Lavender', primary: '#7c3aed', secondary: '#6d28d9' },
            { id: 'cherry',   label: 'Cherry',   primary: '#e11d48', secondary: '#be123c' },
            // Dark / Tech
            { id: 'cyberpunk', label: 'Cyberpunk', primary: '#d946ef', secondary: '#a21caf' },
            { id: 'midnight',  label: 'Midnight',  primary: '#1e3a5f', secondary: '#2563eb' },
            { id: 'carbon',    label: 'Carbon',    primary: '#18181b', secondary: '#3f3f46' },
            { id: 'slate',     label: 'Slate',     primary: '#334155', secondary: '#475569' },
            { id: 'hacker',    label: 'Hacker',    primary: '#052e16', secondary: '#16a34a' },
            // Minimal / Light
            { id: 'minimal',  label: 'Minimal',  primary: '#1f2937', secondary: '#4b5563' },
            { id: 'snow',     label: 'Snow',     primary: '#f8fafc', secondary: '#cbd5e1' },
            { id: 'sand',     label: 'Sand',     primary: '#d97706', secondary: '#b45309' },
            { id: 'rose',     label: 'Rose',     primary: '#f43f5e', secondary: '#e11d48' },
            // Brand-inspired
            { id: 'odoo',   label: 'Odoo',   primary: '#714b67', secondary: '#017e84' },
            { id: 'indigo', label: 'Indigo', primary: '#4338ca', secondary: '#6366f1' },
            { id: 'teal',   label: 'Teal',   primary: '#0d9488', secondary: '#0f766e' },
            { id: 'coral',  label: 'Coral',  primary: '#f43f5e', secondary: '#fb923c' },
            { id: 'plum',   label: 'Plum',   primary: '#9333ea', secondary: '#7e22ce' },
            { id: 'azure',  label: 'Azure',  primary: '#0369a1', secondary: '#0ea5e9' },
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
        console.log("Selected palette:", palette);
        this.state.isPaletteOpen = false;
        
        // In the future, this will apply the colors to the backend configs.
        // For now, we'll demonstrate reactivity by changing the main color picker value.
        this.tsState.primaryColor = palette.c1;
        this.tsState.secondaryColor = palette.c3;
        
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
        this.ts.primaryColor = "#714B67";
        this.ts.secondaryColor = "#8f8f8f";
        this.ts.bgImage = false;
        this.ts.darkMode = false;
        this.ts.glassmorphism = false;
        this.ts.overlayOpacity = 0;
    }

    onPrimaryChange(ev) {
        this.ts.primaryColor = ev.target.value;
    }

    onSecondaryChange(ev) {
        this.ts.secondaryColor = ev.target.value;
    }

    onImageUpload(ev) {
        const file = ev.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.tsState.bgImage = e.target.result.split(',')[1];
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
            };
            reader.readAsDataURL(file);
        }
    }
    
    onClearImage() {
        this.ts.bgImage = false;
    }

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

    onPresetClick(presetName) {
        this.ts.applyPreset(presetName);
    }
}

ThemeStudioPanel.template = "community_theme_studio.ThemeStudioPanel";

registry.category("main_components").add("ThemeStudioPanel", {
    Component: ThemeStudioPanel,
});
