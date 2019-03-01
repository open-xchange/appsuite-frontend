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
    'io.ox/backbone/views/modal',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (session, http, ext, capabilities, ModalDialog, settings, gt) {

    var DURATION = 250;

    // trigger all apps to save restorepoints
    ext.point('io.ox/core/logout').extend({
        id: 'saveRestorePoint',
        index: 1,
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
                        new ModalDialog({ title: gt('Unsaved documents will be lost. Do you want to sign out now?') })
                            .addButton({ label: gt('No'), action: 'No' })
                            .addButton({ label: gt('Yes'), action: 'Yes' })
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

    var logout = function (opt) {

        opt = _.extend({
            autologout: false
        }, opt || {});

        $('#background-loader').fadeIn(DURATION, function () {
            $('#io-ox-core').hide();
            var extensions = ext.point('io.ox/core/logout').list(),
                def = _.stepwiseInvoke(extensions, 'logout', this, new ext.Baton(opt))
                    .always(function () {
                        // force ignores errors
                        if (def.state() === 'rejected' && !opt.force) {
                            $('#io-ox-core').show();
                            $('#background-loader').fadeOut(DURATION);
                            return ox.trigger('logout:failed', arguments);
                        }

                        session.logout().always(function () {
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
                        });
                    });
        });
    };

    return logout;
});
