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
 * @author Greg Hill <greg.hill@open-xchange.com>
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
        if (!newName) {
            def.reject();
            return;
        }
        var def = $.Deferred();
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
