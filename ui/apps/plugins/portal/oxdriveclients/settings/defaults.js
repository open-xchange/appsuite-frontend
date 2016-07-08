/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quat@open-xchange.com>
 */

define('plugins/portal/oxdriveclients/settings/defaults', function () {

    'use strict';

    return {
        linkTo: {
            'Android': 'https://play.google.com/store/apps/details?id=com.openexchange.drive.vanilla',
            'iOS': 'https://itunes.apple.com/us/app/ox-drive/id798570177?l=de&ls=1&mt=8',
            'Mac OS': 'https://itunes.apple.com/us/app/ox-drive/id818195014?l=de&ls=1&mt=12',
            'Windows': '/updater/installer/oxupdater-install.exe'
        },
        // list all languages for which are localized shop images available. All other will fall back to EN
        // images are located under apps/plugins/portal/oxdriveclients/img
        l10nImages: ['de', 'en', 'es', 'fr', 'it', 'nl'],
        // defaults to OX Drive with our logo
        productName: 'OX Drive',
        // App Icon as 144x144px png in base64 encoding as ready to use CSS url: url(data:image/png;base64data)
        // This might be customized by a backend settings overwriting this default, just in case a custom client will be advertised
        appIconAsBase64: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAYAAADnRuK4AAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAABCRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDx0aWZmOkNvbXByZXNzaW9uPjU8L3RpZmY6Q29tcHJlc3Npb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjE0NDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+MTQ0PC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAg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)'
    };

});
