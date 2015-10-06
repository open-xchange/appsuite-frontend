/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/actions/properties', [
    'io.ox/core/folder/api',
    'io.ox/core/capabilities',
    'io.ox/core/tk/dialogs',
    'settings!io.ox/caldav',
    'gettext!io.ox/core'
], function (api, capabilities, dialogs, caldavConfig, gt) {

    'use strict';

    function ucfirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function group(label, value) {
        return $('<div class="form-group">').append(
            // label
            $('<label class="control-label">').text(label),
            // value
            $('<input type="text" class="form-control">')
                .prop('readonly', true)
                .val(value)
        );
    }

    return function folderProperties(id) {

        var model = api.pool.getModel(id),
            module = model.get('module');

        new dialogs.ModalDialog()
            .header(
                $('<h4>').text(gt('Properties') + ': ' + model.get('title'))
            )
            .build(function () {

                var node = this.getContentNode().append(
                    group(
                        gt('Folder type'), ucfirst(module)
                    ),
                    group(
                        //#. number of items in a folder
                        module === 'mail' ? gt('Number of messages') : gt('Number of items'), model.get('total')
                    )
                );
                // show CalDAV URL for calendar and task folders
                // users requires "caldav" capability
                if ((module === 'calendar' || module === 'tasks') && capabilities.has('caldav')) {
                    node.append(
                        group(gt('CalDAV URL'), _.noI18n(
                            caldavConfig.get('url')
                                .replace('[hostname]', location.host)
                                .replace('[folderId]', id)
                        ))
                    );
                }
            })
            .addPrimaryButton('ok', gt('Close'))
            .show();
    };
});
