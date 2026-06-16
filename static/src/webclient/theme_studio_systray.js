import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

export class ThemeStudioSystray extends Component {
    setup() {
        this.ts = useService("theme_studio");
    }

    onClick() {
        this.ts.toggle();
    }
}

ThemeStudioSystray.template = "community_theme_studio.ThemeStudioSystray";

export const systrayItem = {
    Component: ThemeStudioSystray,
};

registry.category("systray").add("ThemeStudio", systrayItem, { sequence: 10 });
