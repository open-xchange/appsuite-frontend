/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/files/actions/show-in-drive', [
    'io.ox/files/api',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/extensions'
], function (FilesAPI, actionsUtil, ext) {

    'use strict';

    return function (options) {
        var parameters = options || {};
        FilesAPI.get(_.pick(parameters, 'folder_id', 'id')).done(function (fileDesc) {
            var app = ox.ui.apps.get('io.ox/files');
            var fileModel = new FilesAPI.Model(fileDesc);
            ox.launch('io.ox/files/main', { folder: fileModel.get('folder_id') }).done(function () {
                actionsUtil.invoke('io.ox/files/actions/show-in-folder', ext.Baton({
                    models: [fileModel],
                    app: app,
                    alwaysChange: true,
                    portal: true
                }));
            });
        });
    };
});
