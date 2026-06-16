# Prompt: Create the Community Theme Studio for Odoo 18

*Use the following prompt to instruct an AI coding assistant to generate the entire Community Theme Studio module from scratch.*

***

**Goal:** Create a powerful, modern, real-time UI customization engine for Odoo 18 Community Edition called "Community Theme Studio". The module must allow users to visually customize their Odoo workspace in real-time without reloading the page.

**Technical Requirements:**
1. **Module Foundation:** Create a standard Odoo 18 module named `community_theme_studio` with a `__manifest__.py` depending on `web` and `base`. Include assets in `web.assets_backend`.
2. **Backend Persistence:** Use a Python HTTP Controller (`controllers/main.py`) with two JSON routes: `/theme_studio/get_config` and `/theme_studio/save_config`. These routes should read and write configuration state to Odoo's native `ir.config_parameter` table.
3. **Owl Service (`theme_studio_service.js`):** Create an Owl service that maintains a `reactive()` state object containing `primaryColor`, `secondaryColor`, `bgImage`, `favicon`, `darkMode`, `glassmorphism`, and `overlayOpacity`. 
   - This service must load the state from the backend on startup.
   - It must include an `applyLiveCss()` function that dynamically modifies CSS variables (e.g., `--bs-primary`) via `document.documentElement.style.setProperty`, injects base64 backgrounds, and dynamically alters `<html data-bs-theme="dark">` for native dark mode.
4. **User Menu Extension (`user_menu_theme_studio.js`):** Extend Odoo's top-right profile menu (`@web/webclient/user_menu/user_menu_items`) to add a "Theme Studio" button that toggles the panel.
5. **UI Panel (`theme_studio.xml` & `theme_studio.js`):** Build a right-side sliding panel using Owl and Bootstrap 5. 
   - Utilize `t-model` for two-way data binding on the color pickers and toggles to ensure immediate real-time CSS updates.
   - For Background Image and Favicon file inputs, use Javascript's `FileReader` to encode the uploaded files as `base64` DataURLs and inject them instantly into the DOM before saving.
   - Include a "Presets" section with buttons to instantly apply pre-defined themes (e.g., Ocean, Cyberpunk, Minimal).
6. **Styling (`theme_studio.scss`):** 
   - Style the sliding panel with a modern, dark glassmorphism aesthetic.
   - Add explicit Dark Mode overrides (`body.o_dark_mode`) for major Odoo views (`.o_list_view`, `.o_kanban_record`, `.o_calendar_view`, `.o_pivot_view`, `.o_control_panel`) to ensure they perfectly inherit dark styles when the user toggles Dark Mode on.

**Output:** Please generate all necessary Python, XML, SCSS, and JavaScript files to fully implement this module. Ensure all code is cleanly written, commented, and fully compatible with the Odoo 18 Owl framework.
