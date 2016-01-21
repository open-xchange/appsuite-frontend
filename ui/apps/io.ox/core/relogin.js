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
    'io.ox/core/notifications',
    'io.ox/core/capabilities',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/core',
    'settings!io.ox/core'
], function (session, notifications, capabilities, dialogs, gt, settings) {

    'use strict';

    var queue = [], pending = false;

    function getReason(error) {
        return error && error.code === 'SES-0205' ?
            gt('Your IP address has changed') :
            gt('Your session is expired');
    }

    function getLocation() {
        var location = capabilities.has('guest') ?
            settings.get('customLocations/guestLogout') || ox.serverConfig.guestLogoutLocation :
            settings.get('customLocations/logout') || ox.serverConfig.logoutLocation;
        return (location || ox.logoutLocation || '').replace('[hostname]', window.location.hostname);
    }

    function redirect() {
        _.url.redirect(getLocation());
    }

    function relogin(request, deferred, error) {

        if (!ox.online) return;
        if (!settings.get('features/reloginPopup', true)) return;

        // don't ask anonymous users
        if (ox.user === 'anonymous') {

            return new dialogs.ModalDialog({ easyOut: false, width: 400 })
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
                    redirect();
                })
                .show();
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
                    redirect();
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

    ox.off('relogin:required', ox.relogin);
    ox.on('relogin:required', relogin);

    return relogin;
});
