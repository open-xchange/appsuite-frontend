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

define('io.ox/multifactor/settings/views/totpRegistrationView', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/multifactor/api',
    'gettext!io.ox/core/boot'
], function (views, ext, mini, ModalView, api, gt) {

    'use strict';

    var POINT = 'multifactor/settings/views/totpRegistrationView',
        INDEX = 0;

    var dialog;
    var def;

    function open(provider, result, _def) {
        dialog = openModalDialog(provider, result);
        def = _def;
        return dialog;
    }

    function openModalDialog(provider, result) {

        return new ModalView({
            async: true,
            point: POINT,
            title: gt('Authenticator Registration'),
            width: 640,
            enter: 'OK',
            model: new Backbone.Model({ device: result.device, result: result })
        })
        .build(function () {
        })
        .addCancelButton()
        .addButton({ label: gt('OK'), action: 'OK' })
        .on('OK', function () {
            var response = $('#verification').val();
            if (response && response !== '') {
                finalize(provider, result.device, response);
            } else {
                def.reject();
            }
        })
        .on('cancel', function () {
            def.reject();
        })
        .on('open', function () {
            $('#verification').focus();
        })
        .open();
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function () {
                var label = $('<p>').append('Please enter this code into your authenticator, or scan the QR code')
                .append('<br>');
                this.$body.append(
                    label
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'code',
            render: function (baton) {
                console.log(baton);
                var label = $('<span class="totpShared">').append(
                    formatSharedSecret(baton.model.get('result').resultParameters.sharedSecret))
                .append('<br>');
                this.$body.append(
                    label
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'qr',
            render: function (baton) {
                var imageDiv = $('<div class="qrDiv">');
                var image = baton.model.get('result').resultParameters.base64QrCode;
                var qr = $('<img id="qrcode" src="data:image/png;base64, ' + image + '">');
                this.$body.append(
                    imageDiv.append(qr)
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'Prompt',
            render: function () {
                var label = $('<label for="verification">').append(gt('Please enter the code displayed in the authenticator to verify everything is configured properly.'));
                this.$body.append(label);
            }
        },
        {
            index: INDEX += 100,
            id: 'verification',
            render: function () {
                var input = $('<input type="text" id="verification">')
                    .keydown(inputChanged);
                var selection = $('<div class="verificationDiav">')
                .append(input);
                this.$body.append(selection);
            }
        }
    );

    // Input should only be 0-9
    function inputChanged(e) {
        if (!/[0-9]/.test(e.key)) {
            if (e.which === 13 || e.which === 8 || e.which === 37 || e.which === 39 || e.which === 46) {  // OK Enter, backspace, arrows, del
                return true;
            }
            e.preventDefault();
            console.log('Prevented key input: ' + e.key);
            return false;
        }
        return true;
    }

    // Format the shared secret for easier display
    function formatSharedSecret(secret) {
        if (!secret) return '';
        return secret.trim().replace(/(\w{4})/g, '$1 ').replace(/(^\s+|\s+$)/, '');
    }

    // Display error message
    function showError(error) {
        require(['io.ox/core/notifications'], function (notify) {
            notify.yell('error', error);
        });
    }

    // Complete registration with confirmation code
    function finalize(provider, device, response) {
        api.finishRegistration(provider, device.id, response).then(function (data) {
            if (data && data.value === 'REGISTRATION_SUCCESSFUL') {  // Good response.  Done
                dialog.close();
                def.resolve();
                return;
            }
            var error;
            if (data && data.value === 'REGISTRATION_DENIED') {  // Bad code
                error = gt('Entry is not correct.  Please try again');
            } else {
                error = gt('Bad input or server error.  Please try again.');
            }
            showError(error);
            dialog.idle();
            $('#verification').focus();
            return;
        }, function () {
            showError(gt('Bad input or server error.  Please try again.'));
            dialog.close();
            def.reject();
        });
    }

    return {
        open: open
    };

});
