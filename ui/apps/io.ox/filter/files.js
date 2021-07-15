/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/filter/files', [
    'io.ox/core/extensions',
    'settings!io.ox/files'
], function (ext, fileSettings) {

    'use strict';

    ext.point('io.ox/files/filter').extend({
        id: 'dot_files',
        isEnabled: function () {
            return fileSettings.get('showHidden', false) !== true;
        },
        isVisible: function (file) {
            var title = (file || {}).title || '';
            return title.indexOf('.') !== 0;
        }
    });
});
