/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/relogin', [
    'io.ox/core/session',
    'io.ox/core/util',
    'io.ox/core/notifications',
    'io.ox/core/capabilities',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/core',
    'settings!io.ox/core'
], function (session, util, notifications, capabilities, dialogs, gt, settings) {

    'use strict';

    var queue = [], pending = false;

    function getReason(error) {
        return error && error.code === 'SES-0205' ?
            gt('Your IP address has changed') :
            gt('Your session is expired');
    }

    function getLoginLocation() {
        var location = capabilities.has('guest') ?
            settings.get('customLocations/guestLogin') || ox.serverConfig.guestLoginLocation :
            settings.get('customLocations/login') || ox.serverConfig.loginLocation;
        return _.url.vars(location || ox.loginLocation || '');
    }

    function getLogoutLocation() {
        var location = capabilities.has('guest') ?
            settings.get('customLocations/guestLogout') || ox.serverConfig.guestLogoutLocation :
            settings.get('customLocations/logout') || ox.serverConfig.logoutLocation;
        return _.url.vars(location || ox.logoutLocation || '');
    }

    function gotoLoginLocation() {
        _.url.redirect(getLoginLocation());
    }

    function gotoLogoutLocation() {
        _.url.redirect(getLogoutLocation());
    }

    function showSessionLostDialog(error) {
        new dialogs.ModalDialog({ easyOut: false, width: 400 })
            .build(function () {
                this.getPopup().addClass('relogin');
                this.getContentNode().append(
                    $('<h4>').text(getReason(error)),
                    $('<div>').text(gt('You have to sign in again'))
                );
            })
            .addPrimaryButton('ok', gt('Ok'))
            .on('ok', function () {
                ox.trigger('relogin:cancel');
                gotoLoginLocation();
            })
            .show();
    }

    function relogin(request, deferred, error) {

        if (!ox.online) return;

        // don't ask anonymous users
        if (ox.user === 'anonymous') {
            showSessionLostDialog(error);
            return;
        }

        if (!pending) {

            // enqueue last request
            queue = (request && deferred) ? [{ request: request, deferred: deferred }] : [];

            // set flag
            pending = true;

            new dialogs.ModalDialog({ easyOut: false, async: true, width: 400, enter: 'relogin' })
                .build(function () {
                    this.getPopup().addClass('relogin');
                    this.getHeader().append(
                        $('<h4>').text(getReason(error)),
                        $('<div>').text(gt('Please sign in again to continue'))
                    );
                    this.getContentNode().append(
                        $('<label>').text(gt('Password')),
                        $('<input type="password" name="relogin-password" class="form-control">')
                    );
                })
                .addPrimaryButton('relogin', gt('Sign in'))
                .addAlternativeButton('cancel', gt('Cancel'))
                .on('cancel', function () {
                    ox.trigger('relogin:cancel');
                    gotoLogoutLocation();
                })
                .on('relogin', function () {
                    var self = this.busy();
                    // relogin
                    session.login({
                        name: ox.user,
                        password: this.getContentNode().find('input').val(),
                        rampup: false,
                        store: ox.secretCookie
                    }).then(
                        function success() {
                            notifications.yell('close');
                            self.getContentNode().find('input').val('');
                            self.close();
                            // process queue
                            var i = 0, item, http = require('io.ox/core/http');
                            for (; (item = queue[i]); i++) {
                                if (!item.request.noRetry) {
                                    http.retry(item.request)
                                        .done(item.deferred.resolve)
                                        .fail(item.deferred.fail);
                                }
                            }
                            // set flag
                            pending = false;
                            ox.trigger('relogin:success');
                        },
                        function fail(e) {
                            // eloquentify standard error message ;-)
                            if (e.code === 'LGI-0006') {
                                e.error = gt('Please enter correct password');
                            }
                            notifications.yell({
                                headline: gt('Failed to sign in'),
                                type: 'error',
                                message: e.error
                            });
                            self.idle();
                            self.getContentNode().find('input').focus().select();
                            ox.trigger('relogin:fail', e);
                        }
                    );
                })
                .show(function () {
                    this.find('input').focus();
                });

        } else if (request && deferred) {
            // enqueue last request
            queue.push({ request: request, deferred: deferred });
        }
    }

    function onSessionLost(request, deferred, error) {
        ox.off('relogin:required', onSessionLost);
        showSessionLostDialog(error);
    }

    ox.off('relogin:required', ox.relogin);

    if (settings.get('features/reloginPopup', true)) {
        ox.on('relogin:required', relogin);
    } else {
        ox.on('relogin:required', onSessionLost);
    }

    return relogin;
});
