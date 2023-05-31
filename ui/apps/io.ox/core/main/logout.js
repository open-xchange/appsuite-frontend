/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/main/logout', [
    'io.ox/core/session',
    'io.ox/core/http',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/backbone/views/modal',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (session, http, ext, capabilities, ModalDialog, settings, gt) {

    var DURATION = 250;

    // logout for the not focused browser tab must not send requests
    // because of possible races with tab that destroys the session,
    // therefore be really the first point and do this quick logout
    ext.point('io.ox/core/logout').extend({
        id: 'tabLogoutFollower',
        index: 'first',
        logout: function (baton) {
            // early-out
            if (!ox.tabHandlingEnabled) return $.when();

            var def = $.Deferred();

            function redirectAndRejectSafely(def, baton) {
                try {
                    logoutRedirect(baton);
                } finally {
                    def.reject();
                }
            }

            // when logged out by other tab, just redirect to logout location and clear
            if (baton.skipSessionLogout) {
                require(['io.ox/core/api/tab'], function (tabAPI) {
                    // session can already be destroyed here by the active tab, better be safe than sorry
                    try {
                        tabAPI.setLoggingOutState(tabAPI.LOGGING_OUT_STATE.FOLLOWER);
                        // stop websockets
                        ox.trigger('logout');
                        // stop requests/rt polling
                        http.disconnect();
                        // better clear in every tab, races a theoretically possible (i.e. tab1 has finished logout (clear) and tab2 is still in progress/writing)
                        ox.cache.clear().always(function () {
                            // note: code in inside always is not secured
                            redirectAndRejectSafely(def, baton);
                        });
                    } catch (e) {
                        if (ox.debug) console.warn('clear storage at logout did not work', e);
                        redirectAndRejectSafely(def, baton);
                    }
                });
            } else {
                def.resolve();
            }

            return def;
        }

    });

    ext.point('io.ox/core/logout').extend({
        id: 'confirmLogout',
        index: 100,
        logout: function (baton) {

            // early-out
            if (!ox.tabHandlingEnabled || !baton.manualLogout) return $.when();

            var def = $.Deferred();
            require(['io.ox/core/api/tab'], function (tabApi) {

                tabApi.otherTabsLiving().then(
                    // when other tabs exists, user must confirm logout
                    function () {
                        require(['io.ox/backbone/views/modal'], function (ModalDialog) {
                            var dialog = new ModalDialog({
                                async: true,
                                title: gt('Sign out'),
                                backdrop: true
                            })
                            .build(function () {
                                this.$body.append(
                                    $('<div>').text(gt('Are you sure you want to sign out from all related browser tabs?'))
                                );
                            })
                            .addCancelButton()
                            .addButton({ action: 'force', label: gt('Sign out') })
                            .open();

                            dialog.on('close', function () {
                                dialog = null;
                                def.reject();
                            });

                            dialog.on('force', function () {
                                def.resolve();
                            });
                        });

                    // no other tabs exists, just continue quitting
                    }, function () {
                        def.resolve();
                    });
            });
            return def.promise();
        }
    });

    ext.point('io.ox/core/logout').extend({
        id: 'tabLogoutLeader',
        index: 150,
        logout: function (baton) {
            // early-out
            if (!ox.tabHandlingEnabled) return $.when();

            var def = $.Deferred();

            require(['io.ox/core/api/tab'], function (tabAPI) {
                // require does catch errors, so we handle them to ensure a resolved deferred
                try {
                    tabAPI.setLoggingOutState(tabAPI.LOGGING_OUT_STATE.LEADER);
                    // notify other tabs that a logout happened
                    tabAPI.propagate('propagateLogout', { autologout: baton.autologout, exceptWindow: tabAPI.getWindowName(), storageKey: tabAPI.DEFAULT_STORAGE_KEYS.SESSION });
                } catch (e) {
                    if (ox.debug) console.warn('propagate logout did not work', e);
                } finally {
                    def.resolve();
                }
            });

            return def;
        }
    });

    ext.point('io.ox/core/logout').extend({
        id: 'hideUI',
        index: 200,
        logout: function () {
            var def = $.Deferred();
            $('#background-loader').fadeIn(DURATION, function () {
                $('#io-ox-core').hide();
                def.resolve();
            });
            return def;
        }
    });

    // trigger all apps to save restorepoints
    ext.point('io.ox/core/logout').extend({
        id: 'saveRestorePoint',
        index: 300,
        logout: function (baton) {
            http.pause();
            var def = $.Deferred();
            if (baton.autologout || ox.online) {
                // TODO: add http pause / resume
                $.when.apply($,
                    ox.ui.apps.map(function (app) {
                        return app.saveRestorePoint();
                    })
                ).always(def.resolve);
            } else {
                ox.ui.App.canRestore().then(function (canRestore) {
                    if (canRestore) {
                        $('#io-ox-core').show();
                        $('#background-loader').hide();
                        //#. 'Sign out' and 'Cancel' as button texts of a modal dialog to confirm to sign out.
                        new ModalDialog({ title: gt('Sign out'), description: gt('Unsaved documents will be lost. Do you want to sign out now?') })
                            .addButton({ label: gt('Cancel'), action: 'No', className: 'btn-default' })
                            .addButton({ label: gt('Sign out'), action: 'Yes' })
                            .on('No', function () { def.reject(); })
                            .on('Yes', function () {
                                $('#io-ox-core').hide();
                                $('#background-loader').show();
                                def.resolve();
                            })
                            .open();
                    } else {
                        def.resolve();
                    }
                });
            }
            // save core settings
            settings.save();
            http.resume();
            return def;
        }
    });

    // clear all caches
    ext.point('io.ox/core/logout').extend({
        id: 'clearCache',
        logout: function () {
            return ox.cache.clear();
        }
    });

    ext.point('io.ox/core/logout').extend({
        id: 'logout-button-hint',
        logout: function () {
            http.pause();
            settings.set('features/logoutButtonHint/active', false).save();
            return http.resume();
        }
    });


    // wait for all pending settings
    ext.point('io.ox/core/logout').extend({
        id: 'savePendingSettings',
        index: 1000000000000,
        logout: function () {
            // force save requests for all pending settings
            http.pause();
            var def = $.Deferred();
            $.when.apply($,
                _(settings.getAllPendingSettings()).map(function (set) {
                    return set.save(undefined, { force: true });
                })
            ).always(def.resolve);
            http.resume();
            return def;
        }
    });

    function getLogoutLocation() {
        // sanitize, see OXUIB-2285
        var location = capabilities.has('guest')
            ? settings.get('customLocations/guestLogout') || ox.serverConfig.guestLogoutLocation
            : settings.get('customLocations/logout') || ox.serverConfig.logoutLocation;

        if (location && location.match(/^https:\/\/.*$|^\/.*$/)) {
            return _.url.vars(location);
        }
        return _.url.vars(ox.logoutLocation || '');
    }

    function needsReload(target) {
        // see bug 56170 and 61385
        if (!/#autologout=true/.test(target)) return;
        var parser = document.createElement('a');
        parser.href = target;
        return (location.host === parser.host) &&
               (location.pathname === parser.pathname);
    }

    function logoutRedirect(opt) {
        var logoutLocation = getLogoutLocation();
        // add autologout param
        if (opt.autologout) {
            var separator = logoutLocation.indexOf('#') > -1 ? '&' : '#';
            logoutLocation = logoutLocation + separator + 'autologout=true';
        }

        // Substitute some variables
        _.url.redirect(_.url.vars(logoutLocation));

        if (needsReload(logoutLocation)) {
            // location.reload will cause an IE error
            _.defer(function () { location.reload(true); });
        }
    }

    var logout = function (opt) {

        opt = _.extend({
            autologout: false
        }, opt || {});


        var extensions = ext.point('io.ox/core/logout').list(),
            def = _.stepwiseInvoke(extensions, 'logout', this, new ext.Baton(opt))
                .always(function () {
                    // force ignores errors
                    if (def.state() === 'rejected' && !opt.force) {
                        $('#io-ox-core').show();
                        $('#background-loader').fadeOut(DURATION);
                        return ox.trigger('logout:failed', arguments);
                    }

                    // only the active tab is allowed to destroy the session
                    // may or may not be reached in case of a redirect from the not active tab (timing)
                    if (ox.tabHandlingEnabled && opt.skipSessionLogout) return;

                    session.logout().always(function () {
                        logoutRedirect(opt);
                    });
                });

    };

    return logout;
});
