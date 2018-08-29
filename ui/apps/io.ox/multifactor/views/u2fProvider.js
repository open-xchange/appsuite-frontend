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

define('io.ox/multifactor/views/u2fProvider', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/multifactor/api',
    'gettext!io.ox/core/boot',
    'io.ox/multifactor/views/constants',
    'io.ox/multifactor/lib/u2f-api'
], function (views, ext, mini, ModalView, api, gt, constants) {

    'use strict';

    var POINT = 'multifactor/views/u2fProvider',
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
            title: constants.AuthenticationTitle,
            width: 640,
            enter: 'OK',
            model: new Backbone.Model({ provider: provider,
                deviceId: device.id,
                challenge: challenge,
                error: error,
                device: device
            })
        })
        .build(function () {
        })
        .addCancelButton()
        .addAlternativeButton({ label: constants.LostButton, action: 'lost', className: device.backupDevice ? 'hidden' : 'btn-default' })
        .on('cancel', function () {
            def.reject();
        })
        .on('open', function () {
            doAuthentication(provider, device, challenge);
        })
        .on('lost', function () {
            dialog.close();
            dialog = null;
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
            render: function (baton) {
                var label;
                if (window.u2f) {
                    label = $('<p>').append(
                        baton.model.get('device').name ? gt('Please activate your authentication device named %s', baton.model.get('device').name) :
                            gt('Please activate your authentication device'))
                        .append('<br>');
                } else {
                    label = $('<p>').append(gt('This browser is not compatible with your configured authentication device.  Please use Chrome browser, or Firefox with U2F enabled.'));
                }
                this.$body.append(
                    label
                );
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

        var appId = data.challengeResponse.signRequests[0].appId;
        var challenge = data.challengeResponse.signRequests[0].challenge;

        window.u2f.sign(appId, challenge, data.challengeResponse.signRequests,
            function (response) {
                if (response.errorCode) {
                    var error, recoverable;
                    switch (response.errorCode) {
                        case 2:
                            error = gt('Bad parameters for signing.  Possibly wrong URL domain for this key.');
                            recoverable = false;
                            break;
                        case 3:
                            error = gt('Configuration not supported');
                            recoverable = false;
                            break;
                        case 4:
                            error = gt('This device is not eligible for this request.  Wrong hardware key?');
                            recoverable = true;
                            break;
                        case 5:
                            error = gt('Timeout');
                            recoverable = false;
                            break;
                        default:
                            error = gt('Error authenticating.  Please reload browser and try again.');
                            recoverable = false;
                            break;
                    }
                    if (dialog) {
                        require(['io.ox/core/notifications'], function (notify) {
                            notify.yell('error', error);
                        });
                        if (recoverable) {
                            doAuthentication(provider, device, data);
                        } else {
                            window.setTimeout(function () {
                                dialog.close();
                                def.reject();
                            }, 5000);
                        }
                    }

                    return;
                }
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
