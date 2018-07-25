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
    'gettext!multifactor',
    'less!io.ox/multifactor/style'
], function (views, ext, mini, ModalView, yell, api, gt) {

    'use strict';

    var POINT = 'multifactor/settings/addDevice/',
        INDEX = 0;

    var def;
    var dialog;

    function open(provider, _def, backup) {
        dialog = openModalDialog(provider, backup);
        def = _def;
    }

    function openModalDialog(provider, backup) {

        var extension;
        // Set extension point
        switch (provider) {
            case 'BACKUP_STRING':
                startRegistration(provider, '', backup);
                return;
            case 'SMS':
                extension = POINT + 'SMS';
                break;
            default:
                extension = POINT + 'common';
                break;
        }

        return new ModalView({
            async: true,
            point: extension,
            title: gt('Add Multifactor Device'),
            width: 640,
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
            startRegistration(provider, name, backup, this.model);
            dialog.close();
        })
        .on('open', function () {
            $('#deviceName').focus();
        })
        .open();
    }

    ext.point(POINT + 'common').extend(
        {
            index: INDEX += 100,
            id: 'header',
            render: function () {
                var label = $('<label>').append(gt('Please choose a name for this device.  It can be anything you like, but should be specific to the device you are adding, and something you will easily recognize.'))
                .append('<br>');
                this.$body.append(
                    label
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'nameInput',
            render: function () {
                var input = $('<input type="text" id="deviceName">');
                var selection = $('<div class="deviceName">')
                .append(input);
                this.$body.append(selection);
            }
        }
    );

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
                var input = $('<input type="text" id="deviceNumber" class="form-control">');
                var selection = $('<div class="deviceNumber">')
                .append(input);
                this.$body.append(selection);
            }
        }
    );

    // Find and open the correct view for this provider
    function openView(provider, resp) {
        if (resp && resp.value === 'REGISTRATION_STARTED') {
            var view;
            switch (provider) {
                case 'SMS':
                    view = 'io.ox/multifactor/settings/views/smsRegistrationView';
                    break;
                case 'EXAMPLE-MFA':
                    view = 'io.ox/multifactor/settings/views/exampleRegistrationView';
                    break;
                case 'U2F':
                    view = 'io.ox/multifactor/settings/views/u2fRegistrationView';
                    break;
                case 'YUBIKEY':
                    view = 'io.ox/multifactor/settings/views/yubikeyRegistrationView';
                    break;
                case 'TOTP':
                    view = 'io.ox/multifactor/settings/views/totpRegistrationView';
                    break;
                case 'BACKUP_STRING':
                    view = 'io.ox/multifactor/settings/views/backupStringRegistrationView';
                    break;
                default:
                    def.reject();
            }
            if (view) {
                require([view], function (regView) {
                    regView.open(provider, resp, def);
                });
            }
        }
    }

    function startRegistration(provider, name, backup, model) {
        var additParams = {};
        switch (provider) {
            case 'SMS':
                additParams.phoneNumber = model.get('code') + $('#deviceNumber').val();
                break;
            default:
        }
        if (backup) {
            additParams.backup = true;
        }
        api.beginRegistration(provider, name, additParams).then(function (resp) {
            openView(provider, resp);
        });
    }

    return {
        start: open
    };

});

