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

define('io.ox/multifactor/settings/views/smsRegistrationView', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/multifactor/api',
    'gettext!io.ox/core/boot'
], function (views, ext, mini, ModalView, api, gt) {

    'use strict';

    var POINT = 'multifactor/settings/views/smsRegistrationView',
        INDEX = 0;

    var dialog;
    var def;

    function open(provider, resp, _def) {
        dialog = openModalDialog(provider, resp);
        def = _def;
        return dialog;
    }

    function openModalDialog(provider, device) {

        return new ModalView({
            async: true,
            point: POINT,
            title: gt('Confirm Code'),
            enter: 'OK',
            model: new Backbone.Model({ device: device })
        })
        .build(function () {
        })
        .addCancelButton()
        .addButton({ label: gt('Ok'), action: 'OK' })
        .on('OK', function () {
            var response = $('#verification').val().replace(/\s/g, '');
            if (response && response !== '') {
                finalize(provider, device, response);
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
                var label = $('<label for="verification">').append(gt('Please enter the validation code we just sent to your device.'))
                .append('<br>');
                this.$body.append(
                    label
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'selection',
            render: function () {
                var input = $('<input type="text" class="form-control mfInput" id="verification">')
                    .keyup(inputChanged);
                var selection = $('<div class="multifactorSelector">')
                .append(input);
                this.$body.append(selection);
                window.setTimeout(function () {
                    input.focus();
                }, 100);
            }
        }

    );

    // Input should only be 0-9
    function inputChanged(e) {
        $(e.target).toggleClass('mfInputError', e.target.value.match(/[0-9\s]*/)[0] !== e.target.value);
    }

    // Display error message
    function showError(error) {
        require(['io.ox/core/notifications'], function (notify) {
            notify.yell('error', error);
        });
    }

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
            showError(gt('Bad input or server error. Please try again.') + ' ' + (data ? data.error : ''));
            dialog.close();
            def.reject();
        });
    }

    return {
        open: open
    };

});
