/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/filter/folder', [
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'settings!io.ox/files'
], function (ext, settings, fileSettings) {

    'use strict';

    ext.point('io.ox/folder/filter').extend({
        id: 'folder_blacklist',
        isVisible: function (folder) {
            var blacklist = settings.get('folder/blacklist', {});
            var blacklistedFolder = blacklist[String(folder.data ? folder.data.id : folder.id)];
            return folder !== undefined && (blacklistedFolder === undefined || blacklistedFolder === false);
        }
    });

    ext.point('io.ox/folder/filter').extend({
        id: 'dot_folders',
        isEnabled: function () {
            return fileSettings.get('showHidden', false) !== true;
        },
        isVisible: function (folder) {
            var title = (folder.data ? folder.data.title : folder.title) || '';
            return title.indexOf('.') !== 0;
        }
    });
});
