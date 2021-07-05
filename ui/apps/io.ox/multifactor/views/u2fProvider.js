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

define('io.ox/multifactor/views/u2fProvider', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/multifactor/api',
    'gettext!io.ox/core/boot',
    'io.ox/multifactor/views/constants',
    'io.ox/backbone/mini-views/helplink',
    'io.ox/core/notifications'
], function (views, ext, mini, ModalView, api, gt, constants, HelpLink, notify) {

    'use strict';

    var POINT = 'multifactor/views/u2fProvider',
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
                error: authInfo.error,
                device: authInfo.device
            })
        })
        .build(function () {
        })
        .addCancelButton()
        .addAlternativeButton({ label: constants.LostButton, action: 'lost', className: authInfo.device.backup ? 'hidden' : 'btn-default' })
        .on('cancel', function () {
            def.reject();
        })
        .on('open', function () {
            doAuthentication(authInfo.providerName, authInfo.device, challenge);
        })
        .on('lost', function () {
            dialog.close();
            dialog = null;
            require(['io.ox/multifactor/lost'], function (lost) {
                lost(authInfo);
            });
        })
        .open();
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'help',
            render: function () {
                var help = new HelpLink({
                    base: 'help',
                    iconClass: 'mfHelp fa-question-circle fa',
                    href: 'ox.appsuite.user.sect.security.multifactor.securitykey.html',
                    tabindex: '-1',
                    simple: !ox.ui.createApp,  // If ui not fully loaded, simple help only
                    metrics: ox.ui.createApp !== undefined
                }).render().$el;
                this.$header.append(help);
            }
        },
        {
            index: INDEX += 100,
            id: 'header',
            render: function () {
                var label;
                if (window.u2f) {
                    label = $('<label>').append(
                        gt('You secured your account with 2-Step Verification. Please use your authentication token to complete verification.'));
                } else {
                    label = $('<p>').append(gt('This browser is not compatible with your configured authentication device. Please use Chrome browser, or Firefox with U2F enabled.'));
                }
                this.$body.append(label);
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

    function doAuthentication(provider, device, data) {

        var appId = data.signRequests[0].appId;
        var challenge = data.signRequests[0].challenge;

        window.u2f.sign(appId, challenge, data.signRequests,
            function (response) {
                if (response.errorCode) {
                    var error, recoverable;
                    switch (response.errorCode) {
                        case 2:
                            //#. Error message when trying to use a USB Keyfob to verify identity, maybe wrong website
                            error = gt('Bad parameters for authenticating with this key. Possibly wrong URL domain for this key.');
                            recoverable = false;
                            break;
                        case 3:
                            //#. Error message when trying to use a USB Keyfob to verify identity.  Some configuration is wrong
                            error = gt('Configuration not supported');
                            recoverable = false;
                            break;
                        case 4:
                            //#. Error message when trying to use a USB Keyfob to verify identity.  Probably wrong key
                            error = gt('This device is not eligible for this request. Wrong hardware key?');
                            recoverable = false;
                            break;
                        case 5:
                            error = gt('Timeout');
                            recoverable = true;
                            break;
                        default:
                            //#. Error message when trying to use a USB Keyfob to verify identity  Error with authenticating
                            error = gt('Error authenticating. Please reload browser and try again.');
                            recoverable = false;
                            break;
                    }
                    if (dialog) {
                        notify.yell('error', error);
                        if (recoverable) {
                            doAuthentication(provider, device, data);
                        } else {
                            window.setTimeout(function () {
                                if (dialog) {  // might be closed with user selecting lost
                                    dialog.close();
                                    def.reject();
                                }
                            }, 5000);
                        }
                    }

                    return;
                }
                // Success
                notify.yell.close();  // Remove any previous notification alerts/errors
                var resp = {
                    parameters: response,
                    id: device.id,
                    provider: provider
                };
                dialog.close();
                def.resolve(resp);
            });
    }

    return {
        open: open
    };

});
