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

define('io.ox/multifactor/views/smsProvider', [
    'io.ox/multifactor/api',
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/core/boot',
    'io.ox/multifactor/views/constants',
    'io.ox/backbone/mini-views/help',
    'less!io.ox/multifactor/style'
], function (api, views, ext, mini, ModalView, gt, constants, HelpLink) {

    'use strict';

    var POINT = 'multifactor/views/smsProvider',
        INDEX = 0;

    var dialog;
    var def;

    function open(challenge, authInfo) {
        dialog = openModalDialog(challenge, authInfo);
        def = authInfo.def;
        return dialog;
    }

    function openModalDialog(challenge, authInfo) {

        return new ModalView({
            async: true,
            point: POINT,
            title: authInfo.reAuth ? constants.ReAuthenticationTitle : constants.AuthenticationTitle,
            enter: 'OK',
            className: constants.AuthDialogClass,
            model: new Backbone.Model({ provider: authInfo.providerName,
                deviceId: authInfo.device.id,
                challenge: challenge,
                error: authInfo.error
            })
        })
        .build(function () {
        })
        .addCancelButton()
        .addButton({ label: constants.OKButton, action: 'OK' })
        .addAlternativeButton({ label: constants.LostButton, action: 'lost', className: authInfo.device.backup ? 'hidden' : 'btn-default' })
        .on('OK', function () {
            var response = $('#verification').val().replace(/\s/g, '');
            if (response && response !== '') {
                var resp = {
                    response: response,
                    id: authInfo.device.id,
                    provider: authInfo.providerName
                };
                def.resolve(resp);
            } else {
                def.reject();
            }
            if (dialog) dialog.close();
        })
        .on('cancel', function () {
            def.reject();
        })
        .on('open', function () {
            _.defer(function () {
                $('#verification').focus();
            });
        })
        .on('lost', function () {
            dialog.close();
            require(['io.ox/multifactor/lost'], function (lost) {
                lost(authInfo);
            });
        })
        .open();
    }

    // Input should only be 0-9
    function inputChanged(e) {
        $(e.target).toggleClass('mfInputError', e.target.value.match(/[0-9\s]*/)[0] !== e.target.value);
    }


    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'help',
            render: function () {
                var help = new HelpLink({
                    base: 'help',
                    iconClass: 'mfHelp fa-question-circle fa',
                    href: 'ox.appsuite.user.sect.multifactor.sms.html',
                    tabindex: '-1',
                    metrics: false  // For now, metrics not possible before full authentication done
                }).render().$el;
                this.$header.append(help);
            }
        },
        {
            index: INDEX += 100,
            id: 'header',
            render: function (baton) {
                var newCode = baton.model.get('error') && !baton.model.get('error').repeat;
                var newDiv = '';
                if (newCode) {
                    newDiv = $('<dev class="newSMS">').append(gt('New code sent.') + ' ');
                }
                var label = $('<label for="verification">').append(
                    newCode ? gt('A new code was sent to your SMS device.  Please enter the code.') :
                        gt('You secured your account with 2-Step Verification.  Please enter the verification code we sent to the phone *****%s.',
                            baton.model.get('challenge').phoneNumberTail))
                .append('<br>');
                this.$body.append(
                    newDiv,
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
                var selection = $('<div class="multifactorAuthDiv">')
                .append(input);
                this.$body.append(selection);
            }
        },
        {
            index: INDEX += 100,
            id: 'error',
            render: function (baton) {
                var error = baton.model.get('error');
                if (error && error.text) {
                    var div = $('<div class="multifactorError">').append(error.text);
                    this.$body.append(div);
                }
            }
        }

    );

    return {
        open: open
    };

});
