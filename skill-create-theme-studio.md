# Skill: Create an Odoo 18 Real-Time Theme Studio

This document captures the architectural knowledge and implementation steps required to build a real-time, reactive Theme Studio customization engine in Odoo 18 using Owl, SCSS, and QWeb.

## Core Concepts

1. **Owl Reactivity (`@web/core/utils/hooks`)**
   Instead of relying on heavy page reloads, use Owl's `reactive()` state to manage theme settings globally. Binding XML inputs via `t-model` to this reactive state ensures instant feedback.
2. **Dynamic CSS Variables (`document.documentElement.style.setProperty`)**
   Odoo 18 and Bootstrap 5 heavily rely on CSS variables (e.g., `--bs-primary`, `--bs-body-color`). By modifying these variables in Javascript dynamically, the entire Odoo UI repaints instantly without server communication.
3. **Persistent Backend Storage (`ir.config_parameter`)**
   Save the state to Odoo's `ir.config_parameter` table via a Python HTTP controller (`@http.route`) so that styles persist across sessions.

## File Architecture

A complete Theme Studio module requires the following structure:

### 1. `controllers/main.py`
Exposes two JSON endpoints:
- `/theme_studio/get_config`: Reads from `request.env['ir.config_parameter'].sudo().get_param()`.
- `/theme_studio/save_config`: Writes changes back to `ir.config_parameter`. Note that `sudo()` is usually required or specific access rights must be enforced (e.g., `base.group_system`).

### 2. `static/src/theme_studio/theme_studio_service.js`
The heart of the application. An Owl Service registered to `@web/core/registry`:
- Maintains the `reactive` state object (`primaryColor`, `bgImage`, `darkMode`, etc.).
- Contains the `applyLiveCss()` function which dynamically injects CSS and updates root CSS variables.
- On module start, calls `/theme_studio/get_config` to preload the saved state.

### 3. `static/src/theme_studio/theme_studio.xml` & `theme_studio.js`
The User Interface for the right-side sliding panel.
- Uses standard Bootstrap 5 and custom SCSS for a dark, glassmorphism aesthetic.
- Form inputs utilize `t-model="tsState.primaryColor"` for 2-way data binding.
- File uploads (Background Image, Favicon) use JavaScript's `FileReader` to read files as DataURLs (`base64`) for instant preview and CSS injection.

### 4. `static/src/webclient/user_menu_theme_studio.js`
Extends the Odoo Profile Menu (top right corner).
- Imports `@web/webclient/user_menu/user_menu_items` registry.
- Adds a new menu item that calls the `themeStudioService.toggle()` method when clicked.

### 5. `static/src/theme_studio/theme_studio.scss`
- Styles the Theme Studio panel itself with `position: fixed; right: 0; z-index: 2000; transform: translateX(100%); transition: transform 0.3s ease;`
- Includes native Bootstrap 5 Dark Mode overrides. While `root.setAttribute('data-bs-theme', 'dark')` does 90% of the work in Odoo 18, specific views (List, Kanban, Calendar, Pivot) often need manual dark mode styling via a `body.o_dark_mode` CSS wrapper.

## Essential Code Snippets

### Instant Base64 Image Upload
```javascript
onImageUpload(ev) {
    const file = ev.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Split out the mime type to store raw base64
            this.tsState.bgImage = e.target.result.split(',')[1];
        };
        reader.readAsDataURL(file);
    }
}
```

### Dynamic Favicon Injection
```javascript
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
```

### Bootstrap 5 Dark Mode Toggle
```javascript
if (state.darkMode) {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    document.body.classList.add('o_dark_mode'); // For custom view overrides
} else {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    document.body.classList.remove('o_dark_mode');
}
```
