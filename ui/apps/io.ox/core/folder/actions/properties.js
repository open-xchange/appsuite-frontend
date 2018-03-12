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
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'io.ox/core/capabilities',
    'io.ox/backbone/views/modal',
    'settings!io.ox/contacts',
    'settings!io.ox/caldav',
    'gettext!io.ox/core'
], function (ext, api, capabilities, ModalDialog, contactsSettings, caldavConfig, gt) {

    'use strict';

    function group(label, value) {
        var guid = _.uniqueId('form-control-label-');
        return $('<div class="form-group">').append(
            // label
            $('<label class="control-label">').attr('for', guid).text(label),
            // value
            $('<input type="text" class="form-control">')
                .attr('id', guid)
                .prop('readonly', true)
                .val(value)
        );
    }

    // ext.point('io.ox/core/folder/actions/properties').extend({
    //     id: 'type',
    //     index: 100,
    //     render: (function () {
    //         function ucfirst(str) {
    //             return str.charAt(0).toUpperCase() + str.slice(1);
    //         }
    //         return function () {
    //             var module = this.model.get('module');
    //             this.$body.append(
    //                 group(
    //                     gt('Folder type'), ucfirst(module)
    //                 )
    //             );
    //         };
    //     }())
    // });

    // ext.point('io.ox/core/folder/actions/properties').extend({
    //     id: 'count',
    //     index: 200,
    //     render: function () {
    //         if (!this.model.supports('count_total')) return;

    //         var total = this.model.get('total'),
    //             module = this.model.get('module');
    //         // fix count in global address book if the admin is hidden
    //         if (String(this.model.get('id')) === '6' && !contactsSettings.get('showAdmin', false)) total--;
    //         this.$body.append(
    //             group(
    //                 module === 'mail' ?
    //                     //#. number of messages in a folder (mail only)
    //                     gt('Number of messages') :
    //                     //#. number of items in a folder
    //                     gt('Number of items'),
    //                 total
    //             )
    //         );
    //     }
    // });

    ext.point('io.ox/core/folder/actions/properties').extend({
        id: 'caldav-url',
        index: 300,
        render: function () {
            if (!capabilities.has('caldav')) return;
            var module = this.model.get('module');
            // show CalDAV URL for calendar and task folders (tasks only supports private folders)
            // users requires "caldav" capability
            if (module !== 'calendar' && (module !== 'tasks' || this.model.is('private'))) return;
            this.$body.append(
                group(gt('CalDAV URL'),
                    caldavConfig.get('url')
                        .replace('[hostname]', location.host)
                        .replace('[folderId]', this.model.get('id'))
                )
            );
        }
    });

    return function folderProperties(id) {

        var model = api.pool.getModel(id);

        new ModalDialog({
            title: gt('Properties') + ': ' + model.get('title'),
            point: 'io.ox/core/folder/actions/properties',
            model: model,
            width: 500
        })
        .addButton({ label: gt('Close'), action: 'close' })
        .open();
    };
});
