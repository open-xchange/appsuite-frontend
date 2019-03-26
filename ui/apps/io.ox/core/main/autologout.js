/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/main/autologout', [
    'io.ox/core/main/logout',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (logout, settings, gt) {

    (function () {

        // check only in this interval to optimize script performance
        var CHECKINTERVAL = 10,
            // threshold for warning dialog in sconds
            WARNINGSTART = 30,
            // init logout interval
            interval = 0,
            // main timeout reference
            timeout = null,
            // checker timeout reference
            checker = null,
            // remember timeout init
            timeoutStart,
            // init warning dialog
            dialog = null,
            changed = false;

        var getTimeLeft = function () {
            return Math.ceil((timeoutStart + interval - _.now()) / 1000);
        };

        var getInterval = function () {
            return parseInt(settings.get('autoLogout', 0), 10);
        };

        var doLogout = function (options) {
            if (ox.tabHandlingEnabled && dialog) { dialog.close(); }
            logout(options);
        };

        // clear current timeout and reset activity status
        var resetTimeout = function (silent) {
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                doLogout({ autologout: true });
            }, interval);
            timeoutStart = _.now();
            changed = false;
            if (ox.tabHandlingEnabled) {
                if (silent) { timeoutStart = _.now() + 1000; }
                if (!silent) { ox.trigger('autologout:resetTimeout'); }
            }

        };

        // check activity status
        var check = function () {
            if (changed && dialog === null) {
                resetTimeout();
            } else {
                var timeLeft = getTimeLeft();

                if (timeLeft <= WARNINGSTART && dialog === null) {
                    // show warning dialog
                    require(['io.ox/backbone/views/modal'], function (ModalDialog) {

                        var countdown = timeLeft,
                            getString = function (sec) {
                                return gt.format(
                                    gt.ngettext(
                                        'You will be automatically signed out in %1$d second',
                                        'You will be automatically signed out in %1$d seconds', sec
                                    ), sec
                                );
                            },
                            node = $('<span>').text(getString(countdown)),
                            countdownTimer = setInterval(function () {
                                if (countdown <= 0) {
                                    //make sure, this does not run again in a second
                                    clearInterval(countdownTimer);
                                    doLogout({ autologout: true });
                                } else {
                                    countdown--;
                                    node.text(getString(countdown));
                                }
                            }, 1000);

                        clearTimeout(timeout);
                        if (dialog) {
                            ox.off('logout:failed', dialog.logoutFailed);
                            dialog.close();
                        }

                        dialog = new ModalDialog({
                            async: true,
                            title: gt('Automatic sign out'),
                            backdrop: true
                        })
                        .build(function () {
                            this.$body.append(node);
                            this.$el.addClass('auto-logout-dialog');
                        })
                        .addCancelButton()
                        .addButton({ action: 'retry', label: gt('Retry'), className: 'btn-default' })
                        .addButton({ action: 'force', label: gt('Sign out now') })
                        .open();

                        dialog.on('close', function () {
                            resetTimeout();
                            clearInterval(countdownTimer);
                            dialog = null;
                            ox.handleLogoutError = false;
                        });
                        dialog.on('force', function () {
                            resetTimeout();
                            clearInterval(countdownTimer);
                            if (dialog.$el.hasClass('logout-failed')) {
                                dialog.pause();
                                var sure = new ModalDialog({
                                    async: true,
                                    title: gt('Are you sure?'),
                                    backdrop: true
                                })
                                .build(function () {
                                    this.$body.append($('<div class="alert alert-danger">').text(gt('Forcing logout may cause data loss.')));
                                })
                                .addCancelButton()
                                .addButton({ action: 'force', label: gt('Force sign out') })
                                .open();

                                sure.on('cancel', function () {
                                    dialog.resume();
                                });
                                sure.on('force', function () {
                                    doLogout({ force: true });
                                    dialog.close();
                                    this.close();
                                });
                            } else {
                                doLogout();
                            }
                        });
                        dialog.on('retry', function () {
                            resetTimeout();
                            clearInterval(countdownTimer);
                            doLogout();
                        });

                        dialog.logoutFailed = function (error) {
                            if (!dialog) return;
                            // property to prevent yells from poping up (bad for screenreaders)
                            // the error is part of the dialog here
                            ox.handleLogoutError = true;

                            dialog.idle();
                            dialog.$el.toggleClass('logout-failed', true);
                            dialog.$el.find('[data-action="force"]').text(gt('Force sign out'));
                            dialog.$body.empty().append(
                                $('<div class="alert alert-danger">').append(
                                    $('<div>').text(gt('Logout failed.')),
                                    $('<div>').text(error[0])
                                )
                            );
                        };

                        ox.on('logout:failed', dialog.logoutFailed);
                    });
                }
            }
        };

        var change = function () {
            changed = true;
        };

        var start = function () {

            interval = getInterval();
            if (interval > 0 && timeout === null) {

                // bind mouse, keyboard and touch events to monitor user activity
                $(document).on('mousedown mousemove scroll touchstart touchmove keydown', change);
                // start timeout
                resetTimeout();
                // check every x seconds to reduce setTimeout operations
                checker = setInterval(check, 1000 * CHECKINTERVAL);
            }

        };

        var stop = function () {
            if (checker && timeout) {
                clearTimeout(timeout);
                clearInterval(checker);
                timeout = checker = null;
                $(document).off('mousedown mousemove scroll touchstart touchmove keydown', change);
            }
        };

        var restart = function () {
            stop();
            start();
        };

        var debug = function () {
            CHECKINTERVAL = 1;
            WARNINGSTART = 10;
            getInterval = function () { return 12000; };
            restart();
        };

        if (ox.tabHandlingEnabled) {
            require(['io.ox/core/api/tab'], function (TabApi) {

                function propagateResetTimeout() {
                    TabApi.TabCommunication.propagateToAllExceptWindow('propagateResetAutoLogoutTimeout', TabApi.TabHandling.windowName, {});
                }

                function localTabResetTimeout() {
                    // call silent to prevent propagation to other tabs (be careful with endless-loop here)
                    resetTimeout(true);

                    // resetTimeout doesn't cancel the logout when the dialog is open
                    if (dialog) {
                        dialog.close();
                    }
                }

                function propagateSettingsAutoLogout(val) {
                    TabApi.TabCommunication.propagateToAllExceptWindow('propagateSettingsAutoLogout', TabApi.TabHandling.windowName, { val: val });
                }

                function localTabSetAutoLogout(propagateData) {
                    // call settings.set 'silent' to prevent propagation to other tabs (be careful with endless-loop here)
                    settings.off('change:autoLogout', propagateSettingsAutoLogout);
                    settings.set('autoLogout', parseInt(propagateData.val, 10));
                    settings.on('change:autoLogout', propagateSettingsAutoLogout);
                }

                ox.on('autologout:resetTimeout', propagateResetTimeout);
                settings.on('change:autoLogout', propagateSettingsAutoLogout);
                TabApi.TabCommunication.events.listenTo(TabApi.TabCommunication.events, 'propagateResetAutoLogoutTimeout', localTabResetTimeout);
                TabApi.TabCommunication.events.listenTo(TabApi.TabCommunication.events, 'propagateSettingsAutoLogout', localTabSetAutoLogout);

            });
        }

        ox.autoLogout = {
            start: start,
            stop: stop,
            restart: restart,
            debug: debug,
            logout: logout.bind(null, { autologout: true })
        };

        settings.on('change:autoLogout', function (val) {
            if (parseInt(val, 10) === 0) return ox.autoLogout.stop();
            ox.autoLogout.start();
        });

        start();

    }());
});
