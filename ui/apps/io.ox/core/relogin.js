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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/relogin', [
    'io.ox/core/extensions',
    'io.ox/core/session',
    'io.ox/core/notifications',
    'io.ox/core/capabilities',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/core',
    'settings!io.ox/core'
], function (ext, session, notifications, capabilities, ModalDialog, gt, settings) {

    'use strict';

    ext.point('io.ox/core/relogin').extend({
        draw: function () {
            this.append(
                gt('Your session is expired'), $.txt('.'), $('<br>'),
                $('<small>').text(gt('Please sign in again to continue'))
            );
        }
    });

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

    ext.point('io.ox/core/boot/login').replace({
        id: 'default',
        relogin: function () {
            gotoLoginLocation();
        }
    });

    function showSessionLostDialog(error) {
        new ModalDialog({ width: 400, async: true, title: getReason(error) })
            .build(function () {
                this.$el.addClass('relogin');
                this.$body.append(
                    $('<div>').text(gt('You have to sign in again'))
                );
            })
            .addButton({ action: 'ok', label: gt('Ok') })
            .on('ok', function () {
                ox.trigger('relogin:cancel');
                require(['io.ox/core/extPatterns/stage']).then(function (Stage) {
                    Stage.run('io.ox/core/boot/login', {}, { methodName: 'relogin' });
                });
            })
            .on('open', function () {
                $('html').addClass('relogin-required');
                $('#io-ox-core').addClass('blur');
            })
            .open();
    }

    function relogin(request, deferred, error) {

        if (!ox.online) return;

        // don't ask anonymous users
        if (capabilities.has('guest && anonymous')) {
            showSessionLostDialog(error);
            return;
        }

        if (!pending) {

            var $blocker = $('#background-loader');
            $blocker.css('z-index', 0);

            // enqueue last request
            queue = (request && deferred) ? [{ request: request, deferred: deferred }] : [];

            // set flag
            pending = true;

            new ModalDialog({ async: true, width: '400px', enter: 'relogin', backdrop: true, focus: 'input', title: getReason(error) })
                .build(function () {
                    var guid = _.uniqueId('form-control-label-');
                    this.$el.addClass('relogin');
                    this.$header.append(
                        $('<div>').text(gt('Please sign in again to continue'))
                    );
                    this.$body.append(
                        $('<label>').attr('for', guid).text(gt('Password')),
                        $('<input type="password" name="relogin-password" class="form-control">').attr('id', guid)
                    );
                })
                .addButton({ className: 'btn-default', label: gt('Cancel'), placement: 'left' })
                .addButton({ action: 'relogin', label: gt('Sign in') })
                .on('cancel close', function () {
                    ox.trigger('relogin:cancel');
                    gotoLogoutLocation();
                    $blocker.css('z-index', '');
                })
                .on('relogin', function () {
                    var self = this.busy();
                    // relogin
                    session.login({
                        name: ox.user,
                        password: this.$body.find('input').val(),
                        rampup: false,
                        store: ox.secretCookie
                    }).then(
                        function success() {
                            notifications.yell('close');
                            self.$body.find('input').val('');
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
                            $blocker.css('z-index', '');
                            $('html').removeClass('relogin-required');
                            $('#io-ox-core').removeClass('blur');
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
                            self.$body.find('input').focus().select();
                            ox.trigger('relogin:fail', e);
                        }
                    );
                })
                .on('open', function () {
                    $('html').addClass('relogin-required');
                    $('#io-ox-core').addClass('blur');
                })
                .open();

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

    // default should be false if oidc or saml login are enabled
    // this prevents password dialog being shown if admin did not configure it explicitly but enabled saml or oidc workflows
    if (settings.get('features/reloginPopup', !ox.serverConfig.oidcLogin && !ox.serverConfig.samlLogin)) {
        ox.on('relogin:required', relogin);
    } else {
        ox.on('relogin:required', onSessionLost);
    }

    return relogin;
});
