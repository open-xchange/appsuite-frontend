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

define('io.ox/multifactor/settings/views/deleteMultifactorView', [
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

    var POINT = 'multifactor/settings/deleteMultifactor',
        INDEX = 0;

    var def, dialog;

    function open(device) {
        dialog = openModalDialog(device);
        def = new $.Deferred();
        return def;
    }

    function openModalDialog(device) {

        return new ModalView({
            async: true,
            point: POINT,
            title: gt('Delete Multifactor Device'),
            width: 640,
            enter: 'cancel',
            model: new Backbone.Model({ 'device': device,
                'id': $(device).attr('data-deviceId'),
                'name': $(device).attr('data-deviceName'),
                'provider': $(device).attr('data-provider') })
        })
        .build(function () {
        })
        .addAlternativeButton({ label: gt('Delete'), action: 'delete' })
        .on('delete', function () {
            var dialog = this;
            doDelete(this.model).done(function () {
                dialog.close();
                def.resolve();
            })
            .fail(function (e) {
                dialog.idle();
                if (e && e.length > 1) yell('error', e);
                def.reject();
            });
        })
        .addButton({ label: gt('Cancel'), action: 'cancel' })
        .open();
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function (baton) {
                //#.  Devices are named.  This is the text for the deleting a multifactor device
                var label = $('<label>').text(gt('This will delete the device named %s.', baton.model.get('name')))
                .append('<br>');
                this.$body.append(
                    label
                );
            }
        }

    );

    function doDelete(model) {
        var def = $.Deferred();
        api.deleteDevice(model.get('provider'), model.get('id')).then(def.resolve, function () {
            yell('error', gt('Unable to delete'));
            def.reject();
            dialog.close();
        });
        return def;
    }

    return {
        open: open,
        doDelete: doDelete
    };

});
