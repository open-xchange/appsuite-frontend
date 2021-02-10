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
            changed = false,
            // tab handling: only the leader can propagate to other tabs
            leader = false,
            // tab handling: pause the logout timer
            pause = false;

        var getTimeLeft = function () {
            return Math.ceil((timeoutStart + interval - _.now()) / 1000);
        };

        var getInterval = function () {
            return parseInt(settings.get('autoLogout', 0), 10);
        };

        // clear current timeout and reset activity status
        var resetTimeout = function () {
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                logout({ autologout: true });
            }, interval);
            timeoutStart = _.now();
            changed = false;
        };

        var isAutoLogoutRunning = function () {
            return timeout !== null && checker !== null;
        };

        var propagatePause = $.noop;

        // check activity status
        var check = function () {
            if (ox.tabHandlingEnabled && pause) { propagatePause(); }

            if (changed && dialog === null) {
                resetTimeout();
            } else {
                var timeLeft = getTimeLeft();

                if (timeLeft <= WARNINGSTART && dialog === null) {
                    // show warning dialog
                    require(['io.ox/backbone/views/modal'], function (ModalDialog) {

                        var countdown = timeLeft,
                            getString = function (sec) {
                                return gt.ngettext(
                                    'You will be automatically signed out in %1$d second',
                                    'You will be automatically signed out in %1$d seconds',
                                    sec, sec
                                );
                            },
                            node = $('<span>').text(getString(countdown)),
                            countdownTimer = setInterval(function () {
                                if (countdown <= 0) {
                                    //make sure, this does not run again in a second
                                    clearInterval(countdownTimer);
                                    logout({ autologout: true });
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
                                    logout({ force: true });
                                    dialog.close();
                                    this.close();
                                });
                            } else {
                                logout();
                            }
                        });
                        dialog.on('retry', function () {
                            resetTimeout();
                            clearInterval(countdownTimer);
                            logout();
                        });

                        dialog.logoutFailed = function (error) {
                            if (!dialog) return;
                            // property to prevent yells from poping up (bad for screenreaders)
                            // the error is part of the dialog here
                            ox.handleLogoutError = true;

                            // work with strings or error objects
                            var errorText = error[0] && error[0].error ? error[0].error : error[0];

                            dialog.idle();
                            dialog.$el.toggleClass('logout-failed', true);
                            dialog.$el.find('[data-action="force"]').text(gt('Force sign out'));
                            dialog.$body.empty().append(
                                $('<div class="alert alert-danger">').append(
                                    $('<div>').text(gt('Logout failed.')),
                                    (_.isString(errorText) ? $('<div>').text(errorText) : '')
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

                if (ox.tabHandlingEnabled) { interval = 0; }

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

        ox.autoLogout = {
            start: start,
            stop: stop,
            restart: restart,
            debug: debug,
            logout: logout.bind(null, { autologout: true })
        };

        if (ox.tabHandlingEnabled) {
            require(['io.ox/core/api/tab'], function (tabApi) {

                function propagateLeaderChanged() {
                    tabApi.propagate('propagateLeaderChanged', { exceptWindow: tabApi.getWindowName() });
                }

                function propagateResetTimeout() {
                    tabApi.propagate('propagateResetAutoLogoutTimeout', { exceptWindow: tabApi.getWindowName() });
                }

                function propagateSettingsAutoLogout(val) {
                    tabApi.propagate('propagateSettingsAutoLogout', { val: val, exceptWindow: tabApi.getWindowName() });
                }

                // overwrite propagatePause for tabHandling
                propagatePause = function propagatePause() {
                    tabApi.propagate('propagatePause', {});
                };

                function receivedResetTimeout() {
                    leader = false;
                    // resetTimeout doesn't cancel the logout when the dialog is open
                    // better to close the dialog first
                    if (dialog) { dialog.close(); }

                    if (isAutoLogoutRunning()) { resetTimeout(); }

                }

                function receivedChangedAutoLogoutSetting(propagateData) {

                    var value = parseInt(propagateData.val, 10);

                    // do not start/stop when settings were received from other tab.
                    // this setting change must not be propagated again to other tabs (be careful with endless-loop here)
                    settings.set('autoLogout', value, { silent: true });

                    // make sure that we start/stop the timers without propagation
                    if (value === 0) {
                        stop();
                    } else {
                        start();
                    }
                }

                function receivedLeaderChanged() {
                    leader = false;
                    // leader change is always propagated, but resetTimeout must not be called when no timer is running (instant logout + overhead)
                    if (isAutoLogoutRunning()) { resetTimeout(); }
                }

                function receivedNewLeaderStatus() {
                    // do not reset self TODO check
                    leader = true;
                    propagateLeaderChanged();
                }

                function receivedBeforeLogout() {
                    // important to close the dialog first before calling stop,
                    // because closing the dialog calls a reset and stop set interval to 0
                    if (dialog) { dialog.close(); }
                    stop();
                }

                function receivedPause() {
                    // never silent
                    if (leader) { resetTimeout(); }
                }

                function startPause() {
                    pause = true;
                }

                function stopPause() {
                    pause = false;
                }

                resetTimeout = function () {
                    clearTimeout(timeout);
                    // just for safety
                    if (interval <= 0) { return; }
                    timeout = setTimeout(function () {
                        logout({ autologout: true });
                    }, interval);
                    timeoutStart = _.now();
                    changed = false;

                    // small delta for resets from other tabs that the leader has a small safety buffer
                    if (!leader) { timeoutStart = _.now() + 1000; }
                    // taking lead for the timer
                    if (leader) { propagateResetTimeout(); }
                };

                // propagate new timeout setting to other tabs
                settings.on('change:autoLogout', propagateSettingsAutoLogout);

                // got reset from other tab
                tabApi.communicationEvents.listenTo(tabApi.communicationEvents, 'propagateResetAutoLogoutTimeout', receivedResetTimeout);
                // got new auto logout setting value from other tab
                tabApi.communicationEvents.listenTo(tabApi.communicationEvents, 'propagateSettingsAutoLogout', receivedChangedAutoLogoutSetting);
                // received new leader status from other tab
                tabApi.communicationEvents.listenTo(tabApi.communicationEvents, 'nextWindowActive', receivedNewLeaderStatus);
                // received a pause ping, could be in any tab
                tabApi.communicationEvents.listenTo(tabApi.communicationEvents, 'propagatePause', receivedPause);
                // received the leader state from other tab
                tabApi.communicationEvents.listenTo(tabApi.communicationEvents, 'propagateLeaderChanged', receivedLeaderChanged);

                // received a logout from another tab
                tabApi.sessionEvents.listenTo(tabApi.sessionEvents, 'before:propagatedLogout', receivedBeforeLogout);

                require(['io.ox/core/tk/visibility-api-util']).done(function (visibilityApi) {
                    $(visibilityApi).on('visibility-changed', function (e, data) {

                        if (data.currentHiddenState === false) {
                            leader = true;
                            propagateLeaderChanged();

                            if (isAutoLogoutRunning()) {
                                resetTimeout();
                            }
                        }
                    });
                });

                function getNextWindowName() {
                    // can be optimized, but this is flexible in case of code changes at the moment
                    var nextCandidate = _.first(_.filter(tabApi.getWindowList(), function (item) { return item.windowName !== tabApi.getWindowName(); }));
                    return nextCandidate ? nextCandidate.windowName : '';
                }

                tabApi.communicationEvents.listenTo(tabApi.communicationEvents, 'beforeunload', function (unsavedChanges) {
                    // we must always set a new leader when the tab is closed
                    // better set the state too often (self repairing...)
                    if (!unsavedChanges) {
                        var next = getNextWindowName();
                        if (next) { tabApi.propagate('nextWindowActive', { targetWindow: next }); }
                    }
                });

                // needed for use-case upload
                _.extend(ox.autoLogout, { start: stopPause, stop: startPause });

                //init
                leader = true;
                propagateLeaderChanged();

            });
        }

        settings.on('change:autoLogout', function (val) {
            if (parseInt(val, 10) === 0) return stop();
            start();
        });

        start();

    }());
});
