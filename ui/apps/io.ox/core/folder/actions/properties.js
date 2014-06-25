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

define('io.ox/core/folder/actions/properties',
    ['io.ox/core/api/folder',
     'io.ox/core/capabilities',
     'gettext!io.ox/core'], function (api, capabilities, gt) {

    'use strict';

    return function folderProperties(id) {

        api.get({ folder: id }).done(function (folder) {
            require(['io.ox/core/tk/dialogs', 'settings!io.ox/caldav'], function (dialogs, caldavConfig) {
                var title = gt('Properties'),
                dialog = new dialogs.ModalDialog()
                .header(
                    api.getBreadcrumb(folder.id, { prefix: title }).css({ margin: '0' })
                )
                .build(function () {
                    function ucfirst(str) {
                        return str.charAt(0).toUpperCase() + str.slice(1);
                    }
                    var node = this.getContentNode().append(
                        $('<div class="form-group">').append(
                            $('<label class="control-label">')
                                .text(gt('Folder type')),
                            $('<input class="form-control">', { type: 'text' })
                                .prop('readonly', true)
                                .val(ucfirst(folder.module))
                        )
                    );
                    // show CalDAV URL for calendar folders
                    // users requires "caldav" capability
                    if (folder.module === 'calendar' && capabilities.has('caldav')) {
                        node.append(
                            $('<div class="form-group">').append(
                                $('<label class="control-label">')
                                    .text(gt('CalDAV URL')),
                                $('<input class="form-control">', { type: 'text' })
                                    .prop('readonly', true)
                                    .val(
                                        _.noI18n(caldavConfig.get('url')
                                            .replace('[hostname]', location.host)
                                            .replace('[folderId]', id)
                                    )
                                )
                            )
                        );
                    }
                })
                .addPrimaryButton('ok', gt('Close'))
                .show().done(function () { dialog = null; });
            });
        });
    };
});
