/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/multifactor/views/totpProvider', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/core/boot',
    'io.ox/multifactor/views/constants',
    'io.ox/backbone/mini-views/helplink'
], function (views, ext, mini, ModalView, gt, constants, HelpLink) {

    'use strict';

    var POINT = 'multifactor/views/totpProvider',
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
            var response = $('#authentication').val().replace(/\s/g, '');
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
            dialog.close();
        })
        .on('cancel', function () {
            def.reject();
        })
        .on('open', function () {
            _.defer(function () {
                $('#authentication').focus();
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
                    href: 'ox.appsuite.user.sect.security.multifactor.authenticator.html ',
                    tabindex: '-1',
                    simple: !ox.ui.createApp,  // If ui not fully loaded, simple help only
                    metrics: ox.ui.createApp !== undefined
                }).render().$el;
                this.$header.append(help);
            }
        },
        {
            index: INDEX += 100,
            id: 'help',
            render: function () {
                var label = $('<p style="multifactor-help">')
                .append(gt('You secured your account with 2-Step Verification. Please enter the verification code from the Authenticator App.'))
                .append('<br>');
                this.$body.append(
                    label
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'header',
            render: function () {
                var label = $('<label for="authentication">').append('Authentication Code:')
                .append('<br>');
                this.$body.append(label);
            }
        },
        {
            index: INDEX += 100,
            id: 'selection',
            render: function () {
                var input = $('<input type="text" class="form-control mfInput" id="authentication">')
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
                    var label = $('<label class="multifactorError">').append(error.text);
                    this.$body.append(label);
                }
            }
        }

    );

    return {
        open: open
    };

});
