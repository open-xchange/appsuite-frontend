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

define('io.ox/multifactor/views/recoveryDeviceView', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/multifactor/factorRenderer',
    'gettext!multifactor'
], function (views, ext, mini, ModalView, renderer, gt) {

    'use strict';

    var POINT = 'multifactor/views/recoveryDeviceView',
        INDEX = 0;

    var dialog;

    function open(devices) {
        dialog = openModalDialog(devices);
        return dialog;
    }

    function openModalDialog(devices) {

        return new ModalView({
            async: true,
            point: POINT,
            title: gt('Recovery Device '),
            width: 640,
            model: new Backbone.Model({ 'devices': devices })
        })
        .build(function () {
        })
        .addButton()
        .on('cancel', function () {
        })
        .addButton({ label: gt('Delete'), action: 'delete' })
        .on('delete', function () {
            var device = devices;
            if (_.isArray(devices)) {
                device = devices[0];
            }
            var model = new Backbone.Model({ 'device': device,
                'id': device.id,
                'name': device.name,
                'provider': device.provider.name });
            this.close();
            require(['io.ox/multifactor/settings/views/deleteMultifactorView'], function (view) {
                view.doDelete(model);
            });
        })
        .open();
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function () {
                var label = $('<label>').append(gt('Backup Device'))
                .append('<br>');
                this.$body.append(
                    label
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'selection',
            render: function (baton) {
                var selection = $('<div class="multifactorSelector">')
                .append(renderer.render(baton.model.get('devices', true), true));
                this.$body.append(selection);
            }
        }

    );

    return {
        open: open
    };

});
