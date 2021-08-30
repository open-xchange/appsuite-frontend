/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
            if (typeof folder === 'undefined') return false;
            var blacklist = settings.get('folder/blacklist', {});
            var blacklistedFolder = blacklist[String(folder.data ? folder.data.id : folder.id)];
            return typeof blacklistedFolder === 'undefined' || blacklistedFolder === false;
        }
    });

    ext.point('io.ox/folder/filter').extend({
        id: 'dot_folders',
        isEnabled: function () {
            return fileSettings.get('showHidden', false) !== true;
        },
        isVisible: function (folder) {
            // filter only in drive app
            if (folder.module && folder.module !== 'infostore') return true;
            var title = (folder.data ? folder.data.title : folder.title) || '';
            return title.indexOf('.') !== 0;
        }
    });
});
