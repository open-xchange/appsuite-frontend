/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/relogin',
    ['io.ox/core/session',
     'io.ox/core/notifications',
     'gettext!io.ox/core',
     'settings!io.ox/core'
    ], function (session, notifications, gt, settings) {

    'use strict';

    var queue = [], pending = false;

    function fnKeyPress(e) {
        if (e.which === 13) {
            e.data.popup.invoke(e.data.action);
        }
    }

    function relogin(e, request, deferred) {

        if (!ox.online) return;

        if (!pending) {

            // enqueue last request
            queue = (request && deferred) ? [{ request: request, deferred: deferred }] : [];

            // set flag
            pending = true;

            require(['io.ox/core/tk/dialogs'], function (dialogs) {

                new dialogs.ModalDialog({ easyOut: false, async: true, width: 400 })
                    .build(function () {
                        this.getHeader().append(
                            $('<h4>').text(gt('Your session is expired')),
                            $('<div>').text(gt('Please sign in again to continue'))
                        );
                        this.getContentNode().append(
                            $('<label>').text(gt('Password')),
                            $('<input type="password" name"relogin-password" class="input-xlarge">')
                            .on('keypress', { popup: this, action: 'relogin' }, fnKeyPress)
                        );
                    })
                    .addPrimaryButton('relogin', gt('Relogin'))
                    .addAlternativeButton('cancel', gt('Cancel'))
                    .on('cancel', function () {
                        ox.trigger('relogin:cancel');
                        var location = settings.get('customLocations/logout');
                        _.url.redirect(location || ox.logoutLocation);
                    })
                    .on('relogin', function () {
                        var self = this.busy();
                        // relogin
                        session.login(ox.user, this.getContentNode().find('input').val(), ox.secretCookie).then(
                            function success() {
                                notifications.yell('close');
                                self.getContentNode().find('input').val('');
                                self.close();
                                // process queue
                                var i = 0, item, http = require('io.ox/core/http');
                                for (; (item = queue[i]); i++) {
                                    http.retry(item.request)
                                        .done(item.deferred.resolve)
                                        .fail(item.deferred.fail);
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
                                    headline: gt('Failed to relogin'),
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
            });
        } else {
            // enqueue last request
            if (request && deferred) {
                queue.push({ request: request, deferred: deferred });
            }
        }
    }

    ox.on('relogin:required', relogin);

    return relogin;
});
