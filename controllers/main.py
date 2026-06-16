# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request, Response
import json
import base64

class ThemeStudioController(http.Controller):

    @http.route('/theme_studio/get_config', type='json', auth='user')
    def get_config(self):
        icp = request.env['ir.config_parameter'].sudo()
        return {
            'primary_color': icp.get_param('theme_studio.primary_color', '#714B67'),
            'secondary_color': icp.get_param('theme_studio.secondary_color', '#8f8f8f'),
            'bg_image': icp.get_param('theme_studio.bg_image', False),
            'dark_mode': icp.get_param('theme_studio.dark_mode', 'False') == 'True',
            'glassmorphism': icp.get_param('theme_studio.glassmorphism', 'False') == 'True',
            'overlay_opacity': float(icp.get_param('theme_studio.overlay_opacity', '0')),
            'text_color': icp.get_param('theme_studio.text_color', '#212529'),
            'text_status_color': icp.get_param('theme_studio.text_status_color', '#ffffff'),
            'status_color': icp.get_param('theme_studio.status_color', '#17a2b8'),
            'favicon': icp.get_param('theme_studio.favicon', False),
        }

    @http.route('/theme_studio/save_config', type='json', auth='user')
    def save_config(self, primary_color, secondary_color, bg_image=False, dark_mode=False, glassmorphism=False, overlay_opacity=0, text_color='#212529', text_status_color='#ffffff', status_color='#17a2b8', favicon=False):
        if not request.env.user.has_group('base.group_system'):
            return {'error': 'Access Denied'}
            
        icp = request.env['ir.config_parameter'].sudo()
        icp.set_param('theme_studio.primary_color', primary_color)
        icp.set_param('theme_studio.secondary_color', secondary_color)
        icp.set_param('theme_studio.dark_mode', str(dark_mode))
        icp.set_param('theme_studio.glassmorphism', str(glassmorphism))
        icp.set_param('theme_studio.overlay_opacity', str(overlay_opacity))
        icp.set_param('theme_studio.text_color', text_color)
        icp.set_param('theme_studio.text_status_color', text_status_color)
        icp.set_param('theme_studio.status_color', status_color)
        if bg_image is not False:
            icp.set_param('theme_studio.bg_image', bg_image)
        if favicon is not False:
            icp.set_param('theme_studio.favicon', favicon)
            
        return {'success': True}

    @http.route('/theme_studio/style.css', type='http', auth='public', cors='*')
    def style_css(self, **kw):
        icp = request.env['ir.config_parameter'].sudo()
        primary = icp.get_param('theme_studio.primary_color', '#714B67')
        secondary = icp.get_param('theme_studio.secondary_color', '#8f8f8f')
        text_color = icp.get_param('theme_studio.text_color', '#212529')
        text_status_color = icp.get_param('theme_studio.text_status_color', '#ffffff')
        status_color = icp.get_param('theme_studio.status_color', '#17a2b8')
        bg_image_b64 = icp.get_param('theme_studio.bg_image', '')

        # Function to convert hex to rgb string for Bootstrap variables
        def hex_to_rgb(hex_color):
            hex_color = hex_color.lstrip('#')
            if len(hex_color) == 6:
                return f"{int(hex_color[0:2], 16)}, {int(hex_color[2:4], 16)}, {int(hex_color[4:6], 16)}"
            return "113, 75, 103"
            
        glassmorphism = icp.get_param('theme_studio.glassmorphism', 'False') == 'True'
        overlay_opacity = float(icp.get_param('theme_studio.overlay_opacity', '0'))
        
        primary_rgb = hex_to_rgb(primary)
        secondary_rgb = hex_to_rgb(secondary)

        css = f"""
:root {{
    --bs-primary: {primary} !important;
    --bs-primary-rgb: {primary_rgb} !important;
    --bs-secondary: {secondary} !important;
    --bs-secondary-rgb: {secondary_rgb} !important;
    --o-brand-primary: {primary} !important;
    --o-brand-odoo: {primary} !important;
    --bs-body-color: {text_color} !important;
    --ts-status-color: {status_color} !important;
    --ts-text-status-color: {text_status_color} !important;
}}
"""

        if glassmorphism:
            css += f"""
.o_main_navbar {{
    background-color: rgba({primary_rgb}, 0.7) !important;
    backdrop-filter: blur(10px) !important;
    border-color: transparent !important;
}}
.o_theme_studio_panel {{
    background-color: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(15px) !important;
}}
[data-bs-theme="dark"] .o_theme_studio_panel {{
    background-color: rgba(33, 37, 41, 0.8) !important;
}}
"""
        else:
            css += f"""
.o_main_navbar {{
    background-color: var(--bs-primary) !important;
    border-color: var(--bs-primary) !important;
}}
"""

        css += f"""
.btn-primary {{
    background-color: var(--bs-primary) !important;
    border-color: var(--bs-primary) !important;
}}

.text-primary {{
    color: var(--bs-primary) !important;
}}

.bg-primary {{
    background-color: var(--bs-primary) !important;
}}

.badge.text-bg-success, .badge.text-bg-info, .badge.text-bg-warning, .badge.text-bg-danger {{
    background-color: var(--ts-status-color) !important;
    color: var(--ts-text-status-color) !important;
}}
"""
        if bg_image_b64:
            css += f"""
.o_web_client, .oe_website_login_container {{
    background-image: linear-gradient(rgba(0,0,0,{overlay_opacity}), rgba(0,0,0,{overlay_opacity})), url('data:image/png;base64,{bg_image_b64}') !important;
    background-size: cover !important;
    background-position: center !important;
    background-attachment: fixed !important;
}}
/* Make inner views slightly transparent to see the background */
.o_content, .o_view_controller {{
    background-color: rgba(255, 255, 255, 0.9) !important;
}}
[data-bs-theme="dark"] .o_content, [data-bs-theme="dark"] .o_view_controller {{
    background-color: rgba(33, 37, 41, 0.9) !important;
}}
"""
        return Response(css, mimetype='text/css')
