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

define('io.ox/core/boot/load', [
    'themes',
    'gettext',
    'io.ox/core/extensions',
    'io.ox/core/boot/config',
    'io.ox/core/boot/util',
    'io.ox/core/session',
    'io.ox/core/http',
    'settings!io.ox/core',
    'io.ox/core/capabilities',
    'io.ox/core/manifests',
    'io.ox/core/sockets',
    'io.ox/core/locale',
    'io.ox/core/moment'
], function (themes, gettext, ext, config, util, session, http, coreSettings, capabilities, manifests, socket, locale) {

    'use strict';

    ext.point('io.ox/core/boot/load').extend([{
        id: 'user_config',
        // wait for user config
        run: function () { return config.user(); }
    }, {
        id: 'i18n',
        run: function (baton) {
            var language = locale.deriveSupportedLanguageFromLocale(baton && baton.sessionData && baton.sessionData.language || ox.locale);
            // apply session data (again) & page title
            if (baton.sessionData) session.set(baton.sessionData);
            ox.trigger('change:document:title');
            // load UI
            util.debug('Load UI > load i18n plugins and set current locale', ox.locale);

            // signin phase is over (important for gettext)
            ox.signin = false;

            // we have to clear the device function cache or there might be invalid return values, like for example wrong locale data (see Bug 51405).
            _.device.cache = {};
            // make sure we have loaded precore.js now
            ox.language = language;
            return $.when(
                require([ox.base + '/precore.js']),
                gettext.setLanguage(language),
                // this namespace also loads dynamic themes code so it's loaded before core namespace but after we have a session etc.
                manifests.manager.loadPluginsFor('i18n')
            ).then(function () {
                util.debug('Load UI > current locale and i18n plugins DONE.');
                gettext.enable();
            });
        }
    }, {
        id: 'locale',
        run: function () {
            // run after language is set
            return require(['io.ox/core/locale']);
        }
    }, {
        id: 'warnings',
        run: function () {
            // don't block
            require(['io.ox/core/boot/warning']).then(function () {
                ext.point('io.ox/core/boot/warning').invoke('draw');
            });
        }
    }, {
        id: 'tabHandling',
        run: function () {
            util.debug('Load "tabHandling"');

            require(['io.ox/core/api/tab']).then(function (tabAPI) {

                if (!util.checkTabHandlingSupport()) {
                    return tabAPI.disable();
                }

                return tabAPI.enable();
            });
        }
    }, {
        id: 'multifactor',
        run: function (baton) {
            if (baton.sessionData && baton.sessionData.requires_multifactor) {
                return loadUserTheme().then(doMultifactor);
            }
        }
    }, {
        id: 'compositionSpaces',
        run: function () {
            // guests don't have webmail for example
            if (!capabilities.has('webmail')) return;

            ox.rampup.compositionSpaces = $.when(
                http.GET({ url: 'api/mail/compose', params: { action: 'all', columns: 'subject,meta' } }),
                require(['gettext!io.ox/mail'])
            ).then(function (data, gt) {
                var list = _(data).first() || [];
                return list.map(function (compositionSpace) {
                    var cid;
                    if (compositionSpace.meta && compositionSpace.meta.editFor) {
                        var editFor = compositionSpace.meta.editFor;
                        cid = _.cid({ id: editFor.originalId, folder: editFor.originalFolderId });
                        cid = 'io.ox/mail/compose:' + cid + ':edit';
                    }
                    return {
                        //#. $1$s is the subject of an email
                        description: gt('Mail: %1$s', compositionSpace.subject || gt('No subject')),
                        floating: true,
                        id: compositionSpace.id + Math.random().toString(16),
                        cid: cid,
                        keepOnRestore: false,
                        module: 'io.ox/mail/compose',
                        point: compositionSpace.id,
                        timestamp: new Date().valueOf(),
                        ua: navigator.userAgent
                    };
                });
            }).catch(function (e) {
                // add a catch such that the boot process is not stopped due to errors
                if (ox.debug) console.error(e);
            });
        }
    }, {
        id: 'load',
        run: function () {
            util.restore();

            // remove unnecessary stuff
            util.cleanUp();
            require(['settings!io.ox/mail']).then(prefetch);
            setupSockets();
            //"core" namespace has now a very similar timing to "io.ox/core/main" namespace
            //the only difference is, "core" plugins are loaded completely before
            //"io.ox/core/main" plugins
            var loadCore = manifests.manager.loadPluginsFor('core').then(function () {
                return require(['io.ox/core/main']);
            });
            return $.when(loadCore, loadUserTheme()).then(function success(core) {
                util.debug('DONE!');
                ox.trigger('boot:done');

                // clear password (now); if cleared or set to "******" too early,
                // Chrome won't store anything or use that dummay value (see bug 36950)
                $('#io-ox-login-password').val('');
                // final step: launch
                core.launch();
            }, function fail(e) {
                console.error('Cannot launch core!', e);
                ox.trigger('boot:fail');
            });
        }
    }]);

    function loadUserTheme() {
        // we have to clear the device function cache or there might be invalid return values, like for example wrong language data.(see Bug 51405)
        _.device.cache = {};
        var theme = _.sanitize.option(_.url.hash('theme')) || coreSettings.get('theme') || 'default',
            loadTheme = themes.set(theme);

        util.debug('Load UI > require [core/main] and set theme', theme);

        return loadTheme.catch(
            loadDefaultTheme.bind(null, theme)
        );
    }

    function loadDefaultTheme(theme) {

        function fail() {
            console.error('Could not load default theme');
            ox.trigger('boot:fail');
        }

        util.debug('Loading theme failed', theme);

        // failed to load theme?
        // give up if it was the default theme
        if (theme === 'default') return fail();
        // otherwise try to load default theme now
        console.error('Could not load custom theme', theme);
        return themes.set('default').catch(fail);
    }

    // Do multifactor authentication.  If successful, load full rampup data
    function doMultifactor() {
        var def = $.Deferred();
        require(['io.ox/multifactor/auth', 'io.ox/multifactor/login/loginScreen'], function (auth, loginScreen) {  // Couldn't be loaded until themes loaded
            loginScreen.create();
            auth.doAuthentication().then(function () {
                loginScreen.destroy();
                session.rampup().then(function () {
                    def.resolve();
                });
            }, function (e) {
                console.error(e);
                console.error('Failed multifactor login. Reloading');
                session.logout().always(function () {
                    window.location.reload(true);  // Hard fail here.  Reload
                    def.reject();
                });
            });
        });
        return def;
    }

    // greedy prefetch for mail app
    // we need to get the default all/threadedAll request out as soon as possible
    function prefetch(mailSettings) {

        if (!capabilities.has('webmail') || !mailSettings.get('features/prefetchOnBoot', true)) return;

        var columns = http.defaultColumns.mail;

        // always extend columns (we can do that now and if we start with mail with need this)
        if (mailSettings.get('features/textPreview', true)) {
            columns.unseen += ',662';
            columns.all += ',662';
            columns.search += ',662';
        }

        if (mailSettings.get('features/authenticity', false)) {
            columns.unseen += ',664';
            columns.all += ',664';
            columns.search += ',664';
        }

        if (coreSettings.get('autoStart') !== 'io.ox/mail/main') return;

        var folder = 'default0/INBOX',
            sort = mailSettings.get(['viewOptions', folder, 'sort'], 661);

        // edge case: no prefetch if sorting is 'from-to' (need too many settings we don't have yet)
        if (sort === 'from-to') return;

        var thread = mailSettings.get('threadSupport', true) ? mailSettings.get(['viewOptions', folder, 'thread'], true) : false,
            action = thread ? 'threadedAll' : 'all',
            params = {
                action: action,
                folder: folder,
                categoryid: 'general',
                columns: columns.all,
                sort: sort,
                order: mailSettings.get(['viewOptions', folder, 'order'], 'desc'),
                includeSent: true,
                max: 300,
                timezone: 'utc',
                limit: '0,' + mailSettings.get('listview/primaryPageSize', 50),
                deleted: !mailSettings.get('features/ignoreDeleted', false)
            };

        // mail categories (aka tabbed inbox)
        if (_.device('smartphone') || !capabilities.has('mail_categories') || !mailSettings.get('categories/enabled')) {
            delete params.categoryid;
        }

        if (!thread) {
            // delete instead of adding to maintain proper order of parameters
            delete params.includeSent;
            delete params.max;
        }

        http.GET({ module: 'mail', params: params }).done(function (data) {
            // the collection loader will check ox.rampup for this data
            ox.rampup['mail/' + _.cacheKey(params)] = data;
        });
    }

    function setupSockets() {
        // get connected socket
        socket.getSocket().done(function (socket) {
            if (capabilities.has('webmail')) {
                socket.on('ox:mail:new', function (data) {
                    // simple event forwarding
                    // don't log sensitive data here (data object)
                    try {
                        ox.websocketlog.push({
                            timestamp: _.now(),
                            date: moment().format('D.M.Y HH:mm:ss'),
                            event: 'ox:mail:new',
                            data: { folder: data.folder, id: data.id }
                        });
                    } catch (e) {
                        console.log(e);
                    }
                    ox.trigger('socket:mail:new', data);
                });
            }

            if (capabilities.has('calendar')) {
                // only call update by push max every 10s, to reduce load
                var throttleCache = [],
                    sendUpdateEvent = _.throttle(function () {
                        var data = {
                            folders: _(throttleCache).chain().pluck('folders').flatten().compact().unique().value(),
                            invitations: _(throttleCache).chain().pluck('needsAction').flatten().compact().unique(function (event) {
                                return event.id + '.' + event.folder + '.' + event.recurrenceId;
                            }).value()
                        };
                        ox.trigger('socket:calendar:updates', data);
                        throttleCache = [];
                    }, 10000);

                socket.on('ox:calendar:updates', function (data) {
                    // simple event forwarding
                    // don't log sensitive data here (data object)
                    try {
                        ox.websocketlog.push({
                            timestamp: _.now(),
                            date: moment().format('D.M.Y HH:mm:ss'),
                            event: 'ox:calendar:updates',
                            data: { folders: data.folders, invitations: data.needsAction }
                        });
                    } catch (e) {
                        console.log(e);
                    }
                    throttleCache.push(data);
                    sendUpdateEvent();
                });
            }

        });
    }
});
