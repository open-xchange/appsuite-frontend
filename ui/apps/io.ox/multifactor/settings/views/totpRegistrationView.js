/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/multifactor/settings/views/totpRegistrationView', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/multifactor/api',
    'gettext!io.ox/core/boot',
    'io.ox/backbone/mini-views/copy-to-clipboard'
], function (views, ext, mini, ModalView, api, gt, CopyToClipboard) {

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
            enter: 'OK',
            focus: '#verification',
            model: new Backbone.Model({ device: result })
        })
        .build(function () {
        })
        .addCancelButton()
        .addButton({ label: gt('Ok'), action: 'OK' })
        .on('OK', function () {
            var response = $('#verification').val().replace(/\s/g, ''); // get value removing any padding
            if (response && response !== '') {
                finalize(provider, result, response);
            } else {
                def.reject();
            }
        })
        .on('cancel', function () {
            def.reject();
        })
        .open();
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function () {
                var label = $('<label for="qrcode">').append(gt('Scan the QR code with your authenticator.'))
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
                var params = baton.model.get('device').challenge;
                var image = params.base64Image;
                var qr = $('<img id="qrcode" src="data:image/png;base64, ' + image + '">');
                imageDiv.append(qr);
                if (params.url && !_.device('small')) {
                    var url = $('<input id="qrUrl" style="position:absolute; left: -1000px;">').val(params.url);  // Hidden param for copying to clipboard
                    var button = new CopyToClipboard({ targetId: '#qrUrl' }).render().$el;
                    var hideButton = $('<span class="input-group-btn multifactor-copy">').append(button);
                    imageDiv.append(url).append(hideButton);  // Hidden copy button.  Click when QR code clicked
                    qr.attr('title', gt('Click to copy URL to clipboard'))
                        .click(function () {
                            button.click();
                            window.setTimeout(function () {
                                $('.tooltip').hide();  // Hide tooltip after few seconds
                            }, 3000);
                        });
                }
                this.$body.append(
                    imageDiv
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'code',
            render: function (baton) {
                var label = $('<label for="code">').append(gt('If scanning does not work, you may be able to enter the following setup code.'));
                var code = $('<span id="code" class="totpShared selectable-text">').append(
                    formatSharedSecret(baton.model.get('device').challenge.sharedSecret));
                this.$body.append(label).append(code);
            }
        },
        {
            index: INDEX += 100,
            id: 'Prompt',
            render: function () {
                var label = $('<label for="verification">').append(gt('Once complete, please enter an authentication code to verify everything is configured properly.'));
                this.$body.append(label);
            }
        },
        {
            index: INDEX += 100,
            id: 'verification',
            render: function () {
                var input = $('<input type="text" class="form-control mfInput" id="verification">')
                    .keyup(inputChanged);
                var selection = $('<div class="verificationDiv">')
                .append(input);
                this.$body.append(selection);
            }
        }
    );

    // Input should only be 0-9
    function inputChanged(e) {
        $(e.target).toggleClass('mfInputError', e.target.value.match(/[0-9\s]*/)[0] !== e.target.value);
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
        var resp = {
            secret_code: response
        };

        api.finishRegistration(provider, device.deviceId, resp).then(function (data) {
            if (data && data.enabled) {  // Good response.  Done
                dialog.close();
                def.resolve();
                return;
            }
            var error;
            if (data && data.error) {  // Bad code
                error = gt('Bad input or server error. Please try again.') + ' ' + data.error;
            }
            showError(error);
            dialog.idle();
            $('#verification').focus();
            return;
        }, function (data) {
            if (data && data.code === 'MFA-0021') {
                showError(gt('Bad verification code. Please try again'));
                dialog.idle();
                $('#verification').focus();
                return;
            }
            showError(gt('Bad input or server error. Please try again.') + ' ' + data.error);
            dialog.close();
            def.reject();
            console.error(data);
        });
    }

    return {
        open: open
    };

});
