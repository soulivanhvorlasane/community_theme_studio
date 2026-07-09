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
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
