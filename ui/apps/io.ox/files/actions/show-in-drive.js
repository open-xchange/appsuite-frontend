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
 * @author Kristof Kamin <kristof.kamin@open-xchange.com>
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
