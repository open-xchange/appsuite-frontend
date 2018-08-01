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

define('io.ox/multifactor/settings/views/u2fRegistrationView', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/multifactor/api',
    'gettext!io.ox/core/boot'
], function (views, ext, mini, ModalView, api, gt) {

    'use strict';

    var POINT = 'multifactor/settings/views/u2fRegistrationView',
        INDEX = 0;

    var dialog;
    var def;

    function open(provider, resp, _def) {
        dialog = openModalDialog(provider, resp);
        def = _def;
        return dialog;
    }

    function openModalDialog(provider, resp) {

        return new ModalView({
            async: true,
            point: POINT,
            title: gt('Confirm Code'),
            width: 640,
            enter: 'OK',
            model: new Backbone.Model({ device: resp.device, challenge: resp.resultParameters })
        })
        .build(function () {
        })
        .addCancelButton()
        .on('cancel', function () {
            def.reject();
        })
        .open();
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function (baton) {
                var label = $('<label>').append('Please touch/activate your device')
                .append('<br>');
                var data = baton.model.get('challenge');
                var RegistrationData = {
                    'challenge': data.registerRequests[0].challenge,
                    'appId': data.registerRequests[0].appId,
                    'version': data.registerRequests[0].version
                };

                window.u2f.register(data.registerRequests[0].appId, [RegistrationData], [],
                    function (data) {
                        if (data.errorCode) {
                            return;
                        }
                        finishRegistration(baton.model.get('device'), data);
                    });

                this.$body.append(
                    label
                );
            }
        }

    );


    function finishRegistration(device, reg) {
        var params = {
            registrationData: reg.registrationData,
            clientData: reg.clientData
        };
        api.finishRegistration('U2F', device.id, '', params).then(function (data) {
            if (data.value === 'REGISTRATION_SUCCESSFULL') {
                dialog.close();
                def.resolve();
                return;
            }
            require(['io.ox/core/notifications'], function (notify) {
                notify.yell('error', gt('Failed to register device'));
            });
            dialog.close();
            def.reject();
        }, function (error) {
            def.reject();
            require(['io.ox/core/notifications'], function (notify) {
                notify.yell('error', gt('Failed to register device'));
                console.error(error);
            });
        });
    }

    return {
        open: open
    };

});
