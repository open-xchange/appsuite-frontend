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

define('io.ox/multifactor/views/webAuthProvider', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/multifactor/api',
    'io.ox/multifactor/lib/base64',
    'gettext!io.ox/core/boot'
], function (views, ext, mini, ModalView, api, base64, gt) {

    'use strict';

    var POINT = 'multifactor/views/webAuthProvider',
        INDEX = 0;

    var dialog;
    var def;

    function open(provider, device, challenge, _def, error) {
        dialog = openModalDialog(provider, device, challenge, error);
        def = _def;
        return dialog;
    }

    function openModalDialog(provider, device, challenge, error) {

        return new ModalView({
            async: true,
            point: POINT,
            title: gt('Authenticate'),
            width: 640,
            enter: 'OK',
            model: new Backbone.Model({ provider: provider,
                deviceId: device.id,
                challenge: challenge,
                error: error
            })
        })
        .build(function () {
        })
        .addCancelButton()
        .addAlternativeButton({ label: gt('Device Lost'), action: 'lost', className: device.backupDevice ? 'hidden' : 'btn-default' })
        .on('cancel', function () {
            def.reject();
        })
        .on('open', function () {
            doAuthentication(provider, device, challenge);
        })
        .on('lost', function () {
            dialog.close();
            require(['io.ox/multifactor/lost'], function (lost) {
                lost(def);
            });
        })
        .open();
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function () {
                var label = $('<label for="verification">').append('Please touch your authentication device')
                .append('<br>');
                this.$body.append(
                    label
                );
            }
        }

    );

    function doAuthentication(provider, device, data) {
        var challenge = data.challengeResponse;
        challenge.publicKeyCredentialRequestOptions.challenge = base64.toByteArray(challenge.publicKeyCredentialRequestOptions.challenge);
        challenge.publicKeyCredentialRequestOptions.allowCredentials.map(function (credential) {
            credential.id = base64.toByteArray(credential.id);
        });
        navigator.credentials.get({
            publicKey: challenge.publicKeyCredentialRequestOptions
        }).then(function (response) {
            finishRegistration(provider, device, response, challenge.id);
        }, function (failure) {
            require(['io.ox/core/notifications'], function (notify) {
                notify.yell('error', gt('Failed to authenticate. ') + failure);
            });
            $('#io-ox-core').show(); // may be hidden in login
            dialog.close();
            window.setTimeout(function () {
                def.reject();
            }, 5000);
        });
    }

    function finishRegistration(provider, device, response, requestId) {
        dialog.close();
        var finishJson = {
            requestId: requestId,
            id: response.id,
            response: {
                authenticatorData: base64.toBase64(response.response.authenticatorData),
                clientDataJSON: base64.toBase64(response.response.clientDataJSON),
                signature: base64.toBase64(response.response.signature)
            }
        };
        var resp = {
            response: finishJson,
            id: device.id,
            provider: provider
        };
        def.resolve(resp);
    }

    return {
        open: open
    };

});
