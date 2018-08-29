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
        dialog = openModalDialog(provider, resp.device);
        def = _def;
        return dialog;
    }

    function openModalDialog(provider, device) {

        return new ModalView({
            async: true,
            point: POINT,
            title: gt('Confirm Code'),
            width: 640,
            enter: 'OK',
            model: new Backbone.Model({ device: device })
        })
        .build(function () {
        })
        .addCancelButton()
        .addButton({ label: gt('OK'), action: 'OK' })
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
                var label = $('<label>').append('To verify proper setup, please enter the code just sent to the device')
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
                var input = $('<input type="text" id="verification">')
                    .keyup(inputChanged);
                var selection = $('<div class="multifactorSelector">')
                .append(input);
                this.$body.append(selection);
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
