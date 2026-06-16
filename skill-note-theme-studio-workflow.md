# Skill Note: Theme Studio Module Workflow
> Path: From Start-up to Hero 🚀

## 1. Setup & Environment
- [ ] Install Odoo 18 development environment
- [ ] Configure PyCharm run/debug for Odoo
- [ ] Create new custom module folder: `theme_studio`
- [ ] Initialize manifest (`__manifest__.py`) with dependencies: `web`, `website`

## 2. Module Workflow
### Step A: Theme Panel
- Create QWeb template for **Theme Studio panel**
- Add toggle for **Dark Mode**
- Add **color palette overlay** above Main Color
- Add **favicon upload + preview**

### Step B: JavaScript Integration
- Extend `UserMenu` to open Theme Studio
- Add functions:
  - `open_theme_panel()`
  - `apply_palette(paletteName)`
  - `toggle_dark_mode(ev)`
  - `save_theme_settings()`

### Step C: Backend Controller
- Route `/theme_studio/apply_palette`
- Route `/theme_studio/save_settings`
- Route `/theme_studio/save_favicon`
- Store values in `ir.config_parameter`

### Step D: SCSS/CSS Styling
- Define `.o_dark_mode` styles:
  - List view
  - Kanban view
  - Calendar view
  - Pivot view
  - Activity buttons
- Add palette variables (Default, Modern, Minimal, Corporate)

## 3. Testing Workflow
- [ ] Toggle Dark Mode → verify instant preview
- [ ] Save settings → reload page with persisted mode
- [ ] Upload favicon → preview + apply
- [ ] Switch palettes → verify color changes across UI

## 4. Learning Path (Skill Growth)
- Beginner: Create manifest + simple QWeb template
- Intermediate: Add JS logic + RPC routes
- Advanced: Build dynamic SCSS themes + persistent settings
- Hero: Package module → install/uninstall like Odoo apps

## 5. Next Steps
- Document each fix in Obsidian daily notes
- Link notes with `#theme-studio` tag
- Use Dataview to query progress:
  ```dataview
  table status, date
  from #theme-studio
  sort date desc
  ```
