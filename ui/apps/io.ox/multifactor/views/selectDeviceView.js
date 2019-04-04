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

define('io.ox/multifactor/views/selectDeviceView', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/multifactor/factorRenderer',
    'io.ox/multifactor/deviceAuthenticator',
    'gettext!io.ox/core/boot',
    'io.ox/multifactor/views/constants'
], function (views, ext, mini, ModalView, renderer, deviceAuthenticator, gt, constants) {

    'use strict';

    var POINT = 'multifactor/views/selectDeviceView',
        INDEX = 0;

    var dialog;
    var def;

    function open(device, authInfo) {
        // Some devices don't need to be individually selected, like U2f
        device = groupDevices(device);
        def = authInfo.def;
        if (device.length === 1) { // If only one after grouping, proceed to auth
            return deviceAuthenticator.getAuth(authInfo);
        }
        dialog = openModalDialog(device, authInfo);
        return dialog;
    }

    function openModalDialog(devices, authInfo) {

        return new ModalView({
            async: true,
            point: POINT,
            title: authInfo.reAuth ? constants.ReAuthenticationTitle : constants.SelectDeviceTitle,
            width: 500,
            className: constants.AuthDialogClass,
            model: new Backbone.Model({ 'devices': devices, authInfo: authInfo })
        })
        .build(function () {
        })
        .addButton()
        .addAlternativeButton({ label: constants.LostButton, action: 'lost', className: 'btn-default' })
        .on('cancel', function () {
            def.reject();
        })
        .on('lost', function () {
            dialog.close();
            dialog = null;
            require(['io.ox/multifactor/lost'], function (lost) {
                lost(authInfo);
            });
        })
        .open();
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function () {
                var label = $('<label>').append(gt('Please select a device to use for additional authentication'))
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
                .append(renderer.renderList(baton.model.get('devices')));
                selection.find('.multifactordevice')
                .on('click', function (e) {
                    e.preventDefault();
                    var device = {
                        id: $(this).attr('data-deviceid')
                    };
                    var authInfo = baton.model.get('authInfo');
                    authInfo.providerName = $(this).attr('data-provider');
                    authInfo.device = device;
                    deviceAuthenticator.getAuth(authInfo);
                    dialog.close();
                });
                this.$body.append(selection);
            }
        },
        {
            index: INDEX += 100,
            id: 'error',
            render: function (baton) {
                var error = baton.model.get('authInfo').error;
                if (error && error.text) {
                    var div = $('<div class="multifactorError">').append(error.text);
                    this.$body.append(div);
                }
            }
        }

    );

    var groupItems = ['U2F', 'WEB-AUTH'];
    var grouped = {};

    function groupDevices(devices) {
        var newList = [];
        devices.forEach(function (device) {
            if (groupItems.includes(device.providerName)) {
                if (!grouped[device.providerName]) {
                    newList.push(device);
                    grouped[device.providerName] = true;
                }
            } else {
                newList.push(device);
            }
        });
        grouped = {}; // reset
        return newList;
    }

    return {
        open: open
    };

});
