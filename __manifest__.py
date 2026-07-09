# -*- coding: utf-8 -*-
{
    'name': 'Community Theme Studio',
    'version': '1.0',
    'category': 'Theme/Backend',
    'summary': 'Dynamic backend theme customization',
    'description': """
        A dynamic theme studio for the Odoo community backend.
        Allows users to change primary colors, secondary colors, and background images in real-time.
    """,
    'author': 'Your Name',
    'depends': ['web', 'base'],
    'data': [
        'views/webclient_templates.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'community_theme_studio/static/src/theme_studio/**/*',
            'community_theme_studio/static/src/webclient/**/*',
        ],
        'web.assets_frontend': [
            'community_theme_studio/static/src/webclient/dropdown_theme.scss',
            'community_theme_studio/static/src/webclient/popup_theme.scss',
            'community_theme_studio/static/src/webclient/navbar_dropdown.scss',
            'community_theme_studio/static/src/webclient/dropdown_selection.scss',
            'community_theme_studio/static/src/webclient/dropdown_header.scss',
            'community_theme_studio/static/src/webclient/dropdown_select.scss',
            'community_theme_studio/static/src/webclient/search_dropdown.scss',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
