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

define('io.ox/multifactor/settings/views/addDevice', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/core/yell',
    'io.ox/multifactor/api',
    'io.ox/multifactor/views/constants',
    'gettext!io.ox/core/boot',
    'less!io.ox/multifactor/style'
], function (views, ext, mini, ModalView, yell, api, constants, gt) {

    'use strict';

    var POINT = 'multifactor/settings/addDevice/',
        INDEX = 0;

    var def;
    var dialog;
    var sms_regex = /[0-9\s\-+]*/;

    function open(provider, _def, backup) {
        dialog = openModalDialog(provider, backup);
        def = _def;
    }

    function openModalDialog(provider, backup) {

        var extension;
        // Set extension point
        switch (provider) {
            case constants.SMS:
                extension = POINT + 'SMS';
                break;
            default:
                startRegistration(provider, '', backup);
                return;
        }

        return new ModalView({
            async: true,
            point: extension,
            title: gt('Add Multifactor Device'),
            enter: 'OK',
            model: new Backbone.Model({ provider: provider, backup: backup })
        })
        .build(function () {
        })
        .addCancelButton()
        .addButton({ label: gt('OK'), action: 'OK' })
        .on('cancel', function () {
            def.reject();
        })
        .on('OK', function () {
            var name = $('#deviceName').length ? $('#deviceName').val() : '';
            dialog.busy();
            if (startRegistration(provider, name, backup, this.model)) {
                dialog.close();
            }
        })
        .on('open', function () {
            _.defer(function () {
                if ($('#deviceName')) $('#deviceName').focus();
                if ($('#deviceNumber')) $('#deviceNumber').focus();
            });
        })
        .open();
    }

    // Input should only be 0-9 for SMS
    function inputChanged(e) {
        $(e.target).toggleClass('mfInputError', e.target.value.match(sms_regex)[0] !== e.target.value);
    }

    ext.point(POINT + 'SMS').extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function () {
                var label = $('<label for="deviceNumber">').append(gt('Please enter the phone number for the device.'));
                this.$body.append(
                    label
                ).append('<br>');
            }
        },
        {
            index: INDEX += 100,
            id: 'localInput',
            render: function (baton) {
                var div = $('<div class="countryCodes">');
                require(['io.ox/onboarding/clients/codes'], function (codes) {
                    var select = new mini.SelectView({
                        name: 'code',
                        model: baton.model,
                        list: codes.get()
                    });
                    var input = select.render().$el
                        .removeClass('form-control')
                        .addClass('select form-control countryCodes')
                        .attr('title', 'Country Codes')
                        .attr('list', 'addresses');
                    var lang = navigator.languages ? navigator.languages[0] : navigator.language;
                    if (lang.indexOf('-') > 0) lang = lang.substring(lang.indexOf('-') + 1);
                    if (codes.hash[lang]) {
                        input.val(codes.hash[lang].code).trigger('change');
                    }
                    div.append(input);
                });
                this.$body.append(div);
            }
        },
        {
            index: INDEX += 100,
            id: 'numberInput',
            render: function () {
                var input = $('<input type="text" id="deviceNumber" class="form-control mfInput">')
                .on('keyup', inputChanged);
                var selection = $('<div class="deviceNumber">')
                .append(input);
                this.$body.append(selection);
            }
        }
    );

    // Find and open the correct view for this provider
    function openView(provider, resp) {
        //if (resp && (resp.value === 'REGISTRATION_STARTED' || resp.value === 'REGISTRATION_SUCCESSFUL')) {
        if (resp && resp.challenge) {
            var view;
            switch (provider) {
                case constants.SMS:
                    view = 'io.ox/multifactor/settings/views/smsRegistrationView';
                    break;
                case constants.U2F:
                    view = 'io.ox/multifactor/settings/views/u2fRegistrationView';
                    break;
                case 'WEB-AUTH':
                    view = 'io.ox/multifactor/settings/views/webAuthnRegistrationView';
                    break;
                case 'YUBIKEY':
                    view = 'io.ox/multifactor/settings/views/yubikeyRegistrationView';
                    break;
                case constants.TOTP:
                    view = 'io.ox/multifactor/settings/views/totpRegistrationView';
                    break;
                case constants.BACKUP:
                    view = 'io.ox/multifactor/settings/views/backupStringRegistrationView';
                    break;
                default:
                    var baton = new ext.Baton({ data: { provider: provider, resp: resp, def: def } });
                    var points = ext.point('io.ox/multifactor/addDevice/' + provider).invoke('view', this, baton);
                    if (!points.any()) def.reject();  // If no extension points, fail
            }
            if (view) {
                require([view], function (regView) {
                    regView.open(provider, resp, def);
                });
            }
        } else {
            //#. Catch all error when trying to set up a new 2step device
            showError(gt('Something went wrong.  Please try again later.'));
        }
    }

    function showError(msg) {
        require(['io.ox/core/notifications'], function (notify) {
            notify.yell('error', msg);
        });
    }

    function validate(number) {
        if (number.match(sms_regex)[0] !== number) {
            showError(gt('Please only use numeric characters for phone number'));
            return false;
        }
        return true;
    }

    function startRegistration(provider, name, backup, model) {
        var additParams = {};
        switch (provider) {
            case constants.SMS:
                additParams.phoneNumber = model.get('code') + $('#deviceNumber').val();
                if (!validate(additParams.phoneNumber)) {
                    dialog.idle();
                    return false;
                }
                break;
            default:
        }
        api.beginRegistration(provider, name, backup, additParams).then(function (resp) {
            openView(provider, resp);
            dialog.close();
            return true;
        }, function (error) {
            console.log(error);
            showError(error);
            return false;
        });
    }

    return {
        start: open
    };

});

