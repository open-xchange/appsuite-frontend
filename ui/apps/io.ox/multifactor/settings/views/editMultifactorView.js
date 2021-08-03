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

define('io.ox/multifactor/settings/views/editMultifactorView', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/core/yell',
    'io.ox/multifactor/api',
    'io.ox/multifactor/auth',
    'gettext!io.ox/core/boot'
], function (views, ext, mini, ModalView, yell, api, auth, gt) {

    'use strict';

    var POINT = 'multifactor/settings/editMultifactor',
        INDEX = 0;

    var def;

    function open(device) {
        openModalDialog(device);
        def = new $.Deferred();
        return def;
    }

    function openModalDialog(device) {

        return new ModalView({
            async: true,
            point: POINT,
            title: gt('Edit Multifactor Device'),
            width: 640,
            enter: 'ok',
            model: new Backbone.Model({ 'device': device,
                'id': $(device).attr('data-deviceId'),
                'name': $(device).attr('data-deviceName'),
                'provider': $(device).attr('data-provider') })
        })
        .build(function () {
        })
        .addCancelButton()
        .addButton({ label: gt('Save'), action: 'ok' })
        .on('ok', function () {
            var dialog = this;
            doEdit(this.model, $('#newName').val()).done(function () {
                dialog.close();
                def.resolve();
            })
            .fail(function (e) {
                dialog.idle();
                if (e && e.length > 1) yell('error', e);
                def.reject();
            });
        })
        .open();
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function (baton) {
                var currentName = baton.model.get('name');
                var label = $('<label for="newName">').text(
                    currentName ? gt('This will edit the name for device (%s)', currentName) : gt('This will assign a name to the device'))
                .append('<br>');
                this.$body.append(
                    label
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'newName',
            render: function (baton) {
                var input = $('<input type="text" class="form-control mfInput" id="newName">');
                var selection = $('<div class="multifactorRename">')
                .append(input);
                input.val(baton.model.get('name'));
                this.$body.append(selection);
                window.setTimeout(function () {
                    input.focus();
                }, 100);
            }
        }

    );

    function doEdit(model, newName) {
        var def = $.Deferred();
        if (!newName) return def.reject();

        api.editDevice(model.get('provider'), model.get('id'), newName).then(def.resolve, function (data) {
            yell('error', gt('Unable to edit name.') + (data && data.error ? (' ' + data.error) : ''));
            def.reject();
        });
        return def;
    }

    return {
        open: open,
        doEdit: doEdit
    };

});
