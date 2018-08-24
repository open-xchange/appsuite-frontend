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

define('io.ox/multifactor/settings/views/webAuthnRegistrationView', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/multifactor/api',
    'io.ox/multifactor/lib/base64',
    'gettext!io.ox/core/boot'
], function (views, ext, mini, ModalView, api, base64, gt) {

    'use strict';

    var POINT = 'multifactor/settings/views/webAuthnRegistrationView',
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
            title: gt('Enroll Device'),
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

    function createOptions(data) {
        data.user.id = base64.toByteArray(data.user.id);
        var options = {
            rp: data.rp,
            user: data.user,
            id: data.user.id,
            challenge: base64.toByteArray(data.challenge),
            pubKeyCredParams: data.pubKeyCredParams,
            excludeCredentials: data.excludeCredentials,
            attestation: data.attestation === 'nonepreference' ? 'none' : data.attestation,
            authenticatorSelection: data.authenticatorSelection
        };
        console.log(options);
        return options;
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function (baton) {
                var label = $('<label>').append('Please touch/activate your device')
                .append('<br>');
                var data = baton.model.get('challenge');

                navigator.credentials.create({
                    publicKey: createOptions(data.publicKeyCredentialOptions)
                }).then(function (attestation) {
                    completeRegistration(baton.model.get('device'), attestation, data);
                }, function (error) {
                    require(['io.ox/core/notifications'], function (notify) {
                        notify.yell('error', gt('Failed to register device. ') + error);
                    });
                    dialog.close();
                    def.reject();
                });
                this.$body.append(
                    label
                );
            }
        }

    );

    function completeRegistration(device, attestation, data) {
        var publicKeyCredential = {
            requestId: data.requestId, // request Id
            rawId: base64.toBase64(attestation.rawId), // Key Id
            attestation: base64.toBase64(attestation.response.attestationObject),
            clientDataJSON: base64.toBase64(attestation.response.clientDataJSON)
        };
        api.finishRegistration('WEB-AUTH', device.id, '', publicKeyCredential).then(function (data) {
            if (data.value === 'REGISTRATION_SUCCESSFUL') {
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
