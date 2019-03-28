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

define('io.ox/core/main/logout', [
    'io.ox/core/session',
    'io.ox/core/http',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (session, http, ext, capabilities, settings, gt) {

    var DURATION = 250;

    ext.point('io.ox/core/logout').extend({
        id: 'confirmLogout',
        index: 100,
        logout: function (baton) {

            // early-out
            if (!ox.tabHandlingEnabled || !baton.manualLogout) return $.when();

            var def = $.Deferred();
            var TabAPI = require('io.ox/core/api/tab');


            TabAPI.TabCommunication.otherTabsLiving().then(
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

            return def.promise();
        }
    });

    ext.point('io.ox/core/logout').extend({
        id: 'tabLogout',
        index: 150,
        logout: function (baton) {
            // early-out
            if (!ox.tabHandlingEnabled) return $.when();

            var def = $.Deferred();

            function redirectAndRejectSafely(def, baton) {
                try {
                    // TODO propagate autologout parameter from other tabs
                    logoutRedirect(baton);
                } finally {
                    def.reject();
                }
            }

            var TabAPI = require('io.ox/core/api/tab');

            TabAPI.TabHandling.setLoggingOutState();

            // when logged out by other tab, just redirect to logout location and clear
            if (baton.skipSessionLogout) {
                try {
                    // session can already be destroyed here by the active tab, better be safe than sorry
                    ox.cache.clear().always(function () {
                        // note: code in inside always is not secured
                        redirectAndRejectSafely(def, baton);
                    });
                } catch (e) {
                    if (ox.debug) console.warn('clear storage at logout did not work', e);
                    redirectAndRejectSafely(def, baton);
                }
            } else {
                // require does catch errors, so we handle them to ensure a resolved deferred
                try {
                    // notify other tabs that a logout happend
                    TabAPI.TabSession.propagateLogout();
                } catch (e) {
                    if (ox.debug) console.warn('propagate logout did not work', e);
                } finally {
                    def.resolve();
                }
            }

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
                        require(['io.ox/core/tk/dialogs'], function (dialogs) {
                            new dialogs.ModalDialog()
                                .text(gt('Unsaved documents will be lost. Do you want to sign out now?'))
                                .addPrimaryButton('Yes', gt('Yes'))
                                .addButton('No', gt('No'))
                                .show()
                                .then(function (action) {
                                    if (action === 'No') {
                                        def.reject();
                                    } else {
                                        $('#io-ox-core').hide();
                                        $('#background-loader').show();
                                        def.resolve();
                                    }
                                });
                        });
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
            $.when.apply($,
                _(settings.getAllPendingSettings()).map(function (set) {
                    return set.save(undefined, { force: true });
                })
            );
            return http.resume();
        }
    });

    function getLogoutLocation() {
        var location = capabilities.has('guest') ?
            settings.get('customLocations/guestLogout') || ox.serverConfig.guestLogoutLocation :
            settings.get('customLocations/logout') || ox.serverConfig.logoutLocation;
        return _.url.vars(location || ox.logoutLocation || '');

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
