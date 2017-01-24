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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/actions/properties', [
    'io.ox/core/folder/api',
    'io.ox/core/capabilities',
    'io.ox/core/tk/dialogs',
    'settings!io.ox/contacts',
    'settings!io.ox/caldav',
    'gettext!io.ox/core'
], function (api, capabilities, dialogs, contactsSettings, caldavConfig, gt) {

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
            module = model.get('module'),
            total = model.get('total');

        // fix count in global address book if the admin is hidden
        if (String(id) === '6' && !contactsSettings.get('showAdmin', false)) total--;

        new dialogs.ModalDialog()
            .header(
                $('<h4>').text(gt('Properties') + ': ' + model.get('title'))
            )
            .build(function () {

                var node = this.getContentNode().append(
                    group(
                        gt('Folder type'), ucfirst(module)
                    ),
                    model.supports('count_total') ?
                    group(
                        module === 'mail' ?
                            //#. number of messages in a folder (mail only)
                            gt('Number of messages') :
                            //#. number of items in a folder
                            gt('Number of items'),
                        total
                    ) : ''
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
