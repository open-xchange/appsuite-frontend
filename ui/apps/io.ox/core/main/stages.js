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

define('io.ox/core/main/stages', [
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/core/capabilities',
    'io.ox/core/api/apps',
    'io.ox/core/folder/api',
    'io.ox/core/main/debug',
    'io.ox/core/api/tab',
    'settings!io.ox/core',
    'settings!io.ox/contacts',
    'gettext!io.ox/core'
], function (ext, notifications, capabilities, apps, folderAPI, debug, tabAPI, settings, contactsSettings, gt) {

    var topbar = $('#io-ox-appcontrol');

    var getAutoLaunchDetails = function (str) {
        var pair = (str || '').split(/:/), app = pair[0], method = pair[1] || '';
        if (/\.\./.test(app)) {
            console.error('app names must not contain relative paths');
            return { app: undefined };
        }
        return { app: (/\/main$/).test(app) ? app : app + '/main', method: method, name: app.replace(/\/main$/, '') };
    };

    var mobileAutoLaunchArray = function () {
        var autoStart = _([].concat(settings.get('autoStartMobile', 'io.ox/mail'))).filter(function (o) {
            return !_.isUndefined(o) && !_.isNull(o);
        });
        // add mail as fallback
        if (autoStart[0] !== 'io.ox/mail') autoStart.push('io.ox/mail');
        return autoStart;
    };

    var autoLaunchArray = function () {
        var autoStart = [];

        if (settings.get('autoStart') === 'none') {
            autoStart = [];
        } else {
            var favoritePaths = _.map(apps.forLauncher(), function (m) { return m.get('path'); });

            autoStart = _([].concat(settings.get('autoStart'), favoritePaths))
                .chain()
                .filter(function (o) {
                    if (_.isUndefined(o)) return false;
                    if (_.isNull(o)) return false;
                    // special case to start in settings (see Bug 50987)
                    if (/^io.ox\/settings(\/main)?$/.test(o)) return true;
                    return favoritePaths.indexOf(/main$/.test(o) ? o : o + '/main') >= 0;
                })
                .first(1) // use 1 here to return an array
                .value();
        }

        return autoStart;
    };

    /**
     * Disables the specified items in the extension point.
     */
    var disableItems = function (point, ids) {
        ids.forEach(point.disable, point);
    };

    /**
     * Disables all but the specified items in the extension point.
     */
    var filterItems = function (point, ids) {
        point.each(function (item) {
            if (ids.indexOf(item.id) < 0) {
                point.disable(item.id);
            }
        });
    };

    // som

    ext.point('io.ox/core/stages').extend({
        id: 'first',
        index: 100,
        run: function () {
            debug('Stage "first"');
        }
    }, {
        id: 'app_register',
        index: 105,
        run: function () {
            return require(['io.ox/core/main/apps', 'io.ox/core/main/warning']);
        }
    }, {
        id: 'appcheck',
        index: 110,
        run: function (baton) {
            debug('Stage "appcheck"');
            // checks url which app to launch, needed to handle direct links
            //
            var hash = _.url.hash(),
                looksLikeDeepLink = !('!!' in hash),
                usesDetailPage;
            // fix old infostore
            if (hash.m === 'infostore') hash.m = 'files';

            // no id values with id collections 'folder.id,folder.id'
            // no virtual folder
            if (looksLikeDeepLink && hash.app && hash.folder && hash.id && hash.folder.indexOf('virtual/') !== 0 && hash.id.indexOf(',') < 0) {

                // new-school: app + folder + id
                // replace old IDs with a dot by 'folder_id SLASH id'
                var id = /^\d+\./.test(hash.id) ? hash.id.replace(/\./, '/') : hash.id;
                usesDetailPage = /^io.ox\/(mail|contacts|calendar|tasks)$/.test(hash.app);

                _.url.hash({
                    app: usesDetailPage ? hash.app + '/detail' : hash.app,
                    folder: hash.folder,
                    id: id
                });

                baton.isDeepLink = true;

            } else if (hash.m && hash.f && hash.i) {

                // old-school: module + folder + id
                usesDetailPage = /^(mail|contacts|calendar|tasks)$/.test(hash.m);

                _.url.hash({
                    // special treatment for files (viewer + drive app)
                    app: 'io.ox/' + (usesDetailPage ? hash.m + '/detail' : hash.m),
                    folder: hash.f,
                    id: hash.i
                });

                baton.isDeepLink = true;

            } else if (hash.m && hash.f) {

                // just folder
                _.url.hash({
                    app: 'io.ox/' + hash.m,
                    folder: hash.f
                });

                baton.isDeepLink = true;
            }

            // clean up
            _.url.hash({ m: null, f: null, i: null, '!!': undefined, '!': null });

            // always use portal on small devices!
            if (_.device('smartphone')) mobileAutoLaunchArray();

            var appURL = _.url.hash('app'),
                app = appURL && ox.ui.apps.get(getAutoLaunchDetails(appURL).name),
                deeplink = looksLikeDeepLink && app && app.get('deeplink'),
                mailto = _.url.hash('mailto') !== undefined && (appURL === ox.registry.get('mail-compose') + ':compose');

            if (app && (app.get('refreshable') || deeplink)) {
                baton.autoLaunch = appURL.split(/,/).filter(function (app) { return !!apps.get(app.replace(/(:.*|\/main)$/, '')); });
                // no manifest for mail compose, capabilities check is sufficient
            } else if (capabilities.has('webmail') && mailto) {
                // launch main mail app for mailto links
                baton.autoLaunch = ['io.ox/mail/main'];
            } else {
                // clear typical parameter?
                if (app) _.url.hash({ app: null, folder: null, id: null });
                baton.autoLaunch = autoLaunchArray();
            }
        }
    }, {
        id: 'autoLaunchApps',
        index: 120,
        run: function (baton) {
            debug('Stage "autoLaunchApps"');
            baton.autoLaunchApps = _(baton.autoLaunch).chain().map(function (m) {
                return getAutoLaunchDetails(m).app;
            }).compact().value();
        }
    }, {
        id: 'startLoad',
        index: 130,
        run: function (baton) {
            debug('Stage "startLoad"');
            function fail(type) {
                return function (e) {
                    var message = (e && e.message) || '';
                    console.error('core: Failed to load:', type, message, e, baton);
                    throw e;
                };
            }

            baton.loaded = $.when(
                ext.loadPlugins().fail(fail('loadPlugins')),
                require(baton.autoLaunchApps).fail(fail('autoLaunchApps')),
                require(['io.ox/core/api/account']).then(
                    function (api) {
                        var def = $.Deferred();
                        api.all().always(def.resolve);
                        return def;
                    },
                    fail('account')
                )
            );
        }
    }, {
        id: 'secretCheck',
        index: 250,
        run: function () {
            debug('Stage "secretCheck"');
            if (ox.online && ox.rampup && ox.rampup.oauth) {
                var analysis = ox.rampup.oauth.secretCheck;
                // health check that the secret string associated with a user (typically his/her password) is
                // still correct to decrypt encryptedly stored sensitive data like passwords and/or tokens for
                // subscribed external accounts. It does not reflect that the encryptedly stored sensitive
                // data ist still correct in sense of: e.g. it is still the proper password
                if (analysis && !analysis.secretWorks) {
                    // Show dialog
                    require(['io.ox/keychain/secretRecoveryDialog'], function (d) { d.show(); });
                    if (ox.debug) {
                        console.error('Couldn\'t decrypt accounts: ', analysis.diagnosis);
                    }
                }
            }
        }
    }, {
        id: 'drawDesktop',
        index: 500,
        run: function () {
            ext.point('io.ox/core/desktop').invoke('draw', $('#io-ox-desktop'), {});
            ox.ui.windowManager.on('empty', function (e, isEmpty, win) {
                if (isEmpty) {
                    ext.point('io.ox/core/desktop').invoke('draw', $('#io-ox-desktop'), {});
                    ox.ui.screens.show('desktop');
                    var autoStart = getAutoLaunchDetails(win || settings.get('autoStart', 'io.ox/mail/main')).app;
                    if (autoStart !== 'none/main') ox.launch(autoStart);
                } else {
                    ox.ui.screens.show('windowmanager');
                }
            });
        }
    }, {
        id: 'load',
        index: 600,
        run: function (baton) {
            debug('Stage "load"', baton);

            return baton.loaded;
        }
    }, {
        /**
         * Popout Viewer - modify topbars if opened in a new browser tab - DOCS-1881
         */
        id: 'popoutViever',
        index: 605,
        run: function () {
            // tab handling enabled in general
            if (!tabAPI.openInTabEnabled()) return;
            // tab handling disabled in URL for Selenium tests
            if (_.url.hash('office:disable-openInTabs') === 'true') return;
            // the Popout Viewer app
            if (_.url.hash('app') !== 'io.ox/files/detail') return;

            // hide controls in the top bar
            var appControlPoint = ext.point('io.ox/core/appcontrol');
            disableItems(appControlPoint, ['quicklauncher']);

            var leftSectionPoint = ext.point('io.ox/core/appcontrol/left');
            disableItems(leftSectionPoint, ['launcher']);

            // hide controls in the right section of the top bar
            var rightSectionPoint = ext.point('io.ox/core/appcontrol/right');
            disableItems(rightSectionPoint, ['refresh-mobile', 'notifications', 'settings-dropdown']);


            // hide top-level entries in the extension point
            var helpDropDownPoint = ext.point('io.ox/core/appcontrol/right/help');
            filterItems(helpDropDownPoint, ['help', 'feedback', 'divider-first', 'about']);

            // hide top-level entries in the extension point
            var settingsDropDownPoint = ext.point('io.ox/core/appcontrol/right/settings');
            filterItems(settingsDropDownPoint, []);

            // hide top-level entries in the extension point
            var accountDropDownPoint = ext.point('io.ox/core/appcontrol/right/account');
            filterItems(accountDropDownPoint, ['logout']);

            // hide all logout items (e.g. Guard) but the global logout
            var signOutsPoint = ext.point('io.ox/core/appcontrol/right/account/signouts');
            filterItems(signOutsPoint, ['logout']);
        }
    }, {
        id: 'topbars',
        index: 610,
        run: function () {

            debug('Stage "load" > loaded.done');

            ext.point('io.ox/core/appcontrol').invoke('draw', topbar);

            if (_.device('smartphone')) {
                ext.point('io.ox/core/mobile').invoke('draw');
            }

            // help here
            if (!ext.point('io.ox/core/topbar').isEnabled('default')) {
                $('#io-ox-screens').css('top', '0px');
                topbar.hide();
            }
            //draw plugins
            ext.point('io.ox/core/plugins').invoke('draw');

            debug('Stage "load" > autoLaunch ...');

            // restore apps
            if (!tabAPI.openInTabEnabled()) return ox.ui.App.restore();
            return tabAPI.isParentTab() ? ox.ui.App.restore() : true;
        }
    }, {
        id: 'restoreLaunch',
        index: 620,
        run: function (baton) {

            // store hash now or restored apps might have changed url
            var hash = _.copy(_.url.hash());

            // is set false, if no autoLaunch is available.
            // for example if default app is 'none' (see Bug 51207) or app is restored (see Bug Bug 51211)
            var allUnavailable = baton.autoLaunch.length > 0;
            // auto launch
            _(baton.autoLaunch)
            .chain()
            .map(function (id) {
                return getAutoLaunchDetails(id);
            })
            .each(function (details, index) {
                //only load first app on small devices
                if (index === 0) allUnavailable = false;
                if (_.device('smartphone') && index > 0) return;
                // WORKAROUND: refresh in 'edit' app created needles broken instance when at least a single intstance was restored
                if (_.device('smartphone') && ox.ui.apps.where({ 'restored': true, 'name': details.name }).length) return;
                // split app/call
                var launch, method, options = _(hash).pick('folder', 'id');
                // remember first started app
                options.first = true;
                debug('Auto launch:', details.app, options);
                if (/detail\/main$/.test(details.app) && details.app.indexOf('files/detail/main') < 0) {
                    // TODO: NEEDS REFACTORING
                    // This is a !temporary! workaround as we need to change how deeplinks and
                    // windows are handled overall
                    var mainApp = details.app.replace(/\/detail/, '');
                    launch = ox.launch(mainApp, options);
                    launch.done(function () {
                        _.delay(function () {
                            ox.launch(details.app, { cid: _.cid(options) });
                        }, 1000);
                    });
                } else {
                    launch = ox.launch(details.app, options);
                }
                method = details.method;
                // TODO: all pretty hard-wired here; looks for better solution
                // special case: open viewer too?
                if (hash.app === 'io.ox/files' && hash.id !== undefined) {
                    require(['io.ox/core/viewer/main', 'io.ox/files/api'], function (Viewer, api) {
                        folderAPI.get(hash.folder)
                            .done(function () {
                                api.get(hash).done(function (data) {
                                    new Viewer().launch({ files: [data], folder: hash.folder });
                                });
                            })
                            .fail(function (error) {
                                _.url.hash('id', null);
                                notifications.yell(error);
                            });
                    });
                }
                // explicit call?
                if (method) {
                    launch.done(function () {
                        if (_.isFunction(this[method])) {
                            this[method]();
                        }
                    });
                }
                // non-app deeplinks
                var id = _.url.hash('reg'),
                    // be case insensitive
                    showFeedback = _(_.url.hash()).reduce(function (memo, value, key) {
                        if (key.toLowerCase() === 'showfeedbackdialog') {
                            return value;
                        }
                        return memo;
                    });

                if (id && ox.registry.get(id)) {
                    // normalise args
                    var list = (_.url.hash('regopt') || '').split(','),
                        data = {}, parts;
                    // key:value, key:value... -> object
                    _.each(list, function (str) {
                        parts = str.split(':');
                        data[parts[0]] = parts[1];
                    });
                    // call after app is ready
                    launch.done(function () {
                        ox.registry.call(id, 'client-onboarding', { data: data });
                    });
                }

                if (showFeedback === 'true' && capabilities.has('feedback')) {
                    launch.done(function () {
                        require(['plugins/core/feedback/register'], function (feedback) {
                            feedback.show();
                        });
                    });
                }

                if (contactsSettings.get('features/furigana', false)) {
                    require(['l10n/ja_JP/io.ox/register']);
                }
            });
            if (allUnavailable || (ox.rampup && ox.rampup.errors)) {
                var message = _.pluck(ox.rampup.errors, 'error').join('\n\n');
                message = message || gt('The requested application is not available at this moment.');
                notifications.yell({ type: 'error', error: message, duration: -1 });
            }
        }
    }, {
        id: 'curtain',
        index: 700,
        run: function () {
            debug('Stage "curtain"');

            var def = $.Deferred();
            $('#background-loader').idle().fadeOut(250, def.resolve);
            return def;
        }
    }, {
        id: 'ready',
        index: 1000000000000,
        run: function () {
            debug('DONE!');
            ox.trigger('core:ready');
        }
    });

    var exports = {
        // temporary code to get translations for bug 58204
        restore: function (n) {

            // do not use "gt.ngettext" for plural without count
            var sentence1 = (n === 1) ?
                //#. %1$s is placeholder for the product name like "App Suite"
                gt('The below item was open last time you exited %1$s.', ox.serverConfig.productName) :
                //#. %1$s is placeholder for the product name like "App Suite"
                gt('The below items were open last time you exited %1$s.', ox.serverConfig.productName);

            var sentence2 = gt('Please click "Continue" if you\'d like to continue editing.');

            // do not use "gt.ngettext" for plural without count
            var sentence3 = (n === 1) ?
                //#. sentence is meant for a single item
                gt('If you do not wish to keep the item, please click on the trash icon.') :
                //#. sentence is meant for multiple items (n>1)
                gt('If you do not wish to keep an item, please click on the trash icon.');

            return sentence1 + ' ' + sentence2 + ' ' + sentence3;
        }
    };

    return exports;
});
