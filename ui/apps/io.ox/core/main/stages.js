
define('io.ox/core/main/stages', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/stage',
    'io.ox/core/notifications',
    'io.ox/core/capabilities',
    'io.ox/core/api/apps',
    'io.ox/core/folder/api',
    'io.ox/core/main/debug',
    'io.ox/core/main/topbar',
    'settings!io.ox/core',
    'settings!io.ox/contacts',
    'gettext!io.ox/core'
], function (ext, Stage, notifications, capabilities, appAPI, folderAPI, debug, tb, settings, contactsSettings, gt) {

    var DURATION = 250;

    var topbar = tb.topbar;

    var drawDesktop = function () {
        ext.point('io.ox/core/desktop').invoke('draw', $('#io-ox-desktop'), {});
        drawDesktop = $.noop;
    };

    var getAutoLaunchDetails = function (str) {
        var pair = (str || '').split(/:/), app = pair[0], method = pair[1] || '';
        return { app: (/\/main$/).test(app) ? app : app + '/main', method: method };
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
            var favoritePaths = _(appAPI.getFavorites()).pluck('path');

            autoStart = _([].concat(settings.get('autoStart'), 'io.ox/mail', favoritePaths))
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

    new Stage('io.ox/core/stages', {
        id: 'first',
        index: 100,
        run: function () {
            debug('Stage "first"');
        }
    });

    new Stage('io.ox/core/stages', {
        id: 'appcheck',
        index: 101,
        run: function (baton) {
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
                manifest = appURL && ox.manifests.apps[getAutoLaunchDetails(appURL).app],
                deeplink = looksLikeDeepLink && manifest && manifest.deeplink,
                mailto = _.url.hash('mailto') !== undefined && (appURL === ox.registry.get('mail-compose') + ':compose');

            if (manifest && (manifest.refreshable || deeplink)) {
                baton.autoLaunch = appURL.split(/,/);
                // no manifest for mail compose, capabilities check is sufficient
            } else if (capabilities.has('webmail') && mailto) {
                // launch main mail app for mailto links
                baton.autoLaunch = ['io.ox/mail/main'];
            } else {
                // clear typical parameter?
                if (manifest) _.url.hash({ app: null, folder: null, id: null });
                baton.autoLaunch = autoLaunchArray();
            }
        }
    });

    new Stage('io.ox/core/stages', {
        id: 'autoLaunchApps',
        index: 102,
        run: function (baton) {
            baton.autoLaunchApps = _(baton.autoLaunch).chain().map(function (m) {
                return getAutoLaunchDetails(m).app;
            }).filter(function (m) {
                //don’t autoload without manifest
                //don’t autoload disabled apps
                return ox.manifests.apps[m] !== undefined && !ox.manifests.isDisabled(m);
            }).compact().value();
        }
    });

    new Stage('io.ox/core/stages', {
        id: 'startLoad',
        index: 103,
        run: function (baton) {
            function fail(type) {
                return function (e) {
                    var message = (e && e.message) || '';
                    console.error('core: Failed to load:', type, message, e, baton);
                    throw e;
                };
            }

            baton.loaded = $.when(
                baton.block,
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
    });

    new Stage('io.ox/core/stages', {
        id: 'secretCheck',
        index: 250,
        run: function () {
            if (ox.online && ox.rampup && ox.rampup.oauth) {
                var analysis = ox.rampup.oauth.secretCheck;
                if (analysis && !analysis.secretWorks) {
                    // Show dialog
                    require(['io.ox/keychain/secretRecoveryDialog'], function (d) { d.show(); });
                    if (ox.debug) {
                        console.error('Couldn\'t decrypt accounts: ', analysis.diagnosis);
                    }
                }
            }
        }
    });

    new Stage('io.ox/core/stages', {
        id: 'restore-check',
        index: 300,
        run: function (baton) {

            debug('Stage "restore-check"');

            return ox.ui.App.canRestore().done(function (canRestore) {
                baton.canRestore = canRestore;
            });
        }
    });

    new Stage('io.ox/core/stages', {
        id: 'restore-confirm',
        index: 400,
        run: function (baton) {

            debug('Stage "restore-confirm"');

            if (baton.canRestore) {

                baton.restoreHash = _.url.hash();

                var dialog,
                    def = $.Deferred().done(function () {
                        $('#background-loader').busy().fadeIn();
                        topbar.show();
                        dialog.remove();
                        dialog = null;
                    }),
                    btn1, btn2;

                $('#io-ox-core').append(
                    dialog = $('<div class="io-ox-restore-dialog" tabindex="-1" role="dialog" aria-labelledby="restore-heading" aria-describedby="restore-description">').append(
                        $('<div role="document">').append(
                            $('<div class="header">').append(
                                $('<h1 id="restore-heading">').text(gt('Restore applications')),
                                $('<div id="restore-description">').text(
                                    gt('The following applications can be restored. Just remove the restore point if you don\'t want it to be restored.')
                                )
                            ),
                            $('<ul class="list-unstyled content">'),
                            $('<div class="footer">').append(
                                btn1 = $('<button type="button" class="cancel btn btn-default">').text(gt('Cancel')),
                                btn2 = $('<button type="button" class="continue btn btn-primary">').text(gt('Continue'))
                            )
                        )
                    )
                );

                if (_.device('smartphone')) {
                    btn1.addClass('btn-block btn-lg');
                    btn2.addClass('btn-block btn-lg');
                }

                // draw savepoints to allow the user removing them
                ox.ui.App.getSavePoints().done(function (list) {

                    // check if we restore only floating windows => if yes we need to load the default app too
                    baton.onlyFloating = true;

                    _(list).each(function (item) {
                        if (baton.onlyFloating && !item.floating) baton.onlyFloating = false;

                        var info = item.description || item.module,
                            versionInfo = $();
                        if (item.version !== ox.version) {
                            var version = item.version || '';
                            version = version.split('.').slice(0, -2).join('.');
                            if (version) {
                                versionInfo = $('<span class="oldversion">').text('(' + version + ')');
                            }
                        }
                        this.append(
                            $('<li class="restore-item">').append(
                                $('<a href="#" role="button" class="remove">').attr('title', gt('Remove restore point: "%1$s"', info)).data(item).append(
                                    $('<i class="fa fa-trash-o" aria-hidden="true">')
                                ),
                                item.icon ? $('<i aria-hidden="true">').addClass(item.icon) : $(),
                                $('<span>').text(info),
                                versionInfo
                            )
                        );
                    }, dialog.find('.content'));
                });

                dialog.on('click', '.footer .btn.continue', def.resolve);
                dialog.on('click', '.footer .btn.cancel', function (e) {
                    e.preventDefault();
                    ox.ui.App.removeAllRestorePoints().done(function () {
                        _.url.hash(baton.restoreHash);
                        baton.canRestore = false;
                        baton.onlyFloating = false;
                        def.resolve();
                    });
                });
                dialog.on('click', '.content .remove', function (e) {
                    e.preventDefault();
                    var node = $(this),
                        id = node.data('id');
                    // remove visually first
                    node.closest('li').remove();
                    // remove restore point
                    ox.ui.App.removeRestorePoint(id).done(function (list) {
                        baton.onlyFloating = _(list).filter(function (item) {
                            return !item.floating;
                        }).length > 0;
                        // continue if list is empty
                        if (list.length === 0) {
                            _.url.hash(baton.restoreHash);
                            baton.canRestore = false;
                            def.resolve();
                        }
                    });
                });

                topbar.hide();
                $('#background-loader').idle().fadeOut(function () {
                    dialog.find('.btn-primary').focus();
                });

                return def;
            }
        }
    });

    new Stage('io.ox/core/stages', {
        id: 'restore',
        index: 500,
        run: function (baton) {

            debug('Stage "restore"');

            // check if we restore only floating windows => if yes we need to load the default app too
            if (baton.canRestore && !baton.isDeepLink && !baton.onlyFloating) {
                // clear auto start stuff (just conflicts)
                baton.autoLaunch = [];
                baton.autoLaunchApps = [];
            }

            if (baton.autoLaunch.length === 0 && !baton.canRestore) {
                drawDesktop();
                return baton.block.resolve(true);
            }

            return baton.block.resolve(baton.autoLaunch.length > 0 || baton.canRestore || location.hash === '#!');
        }
    });

    new Stage('io.ox/core/stages', {
        id: 'load',
        index: 600,
        run: function (baton) {

            debug('Stage "load"', baton);

            return baton.loaded.done(function (instantFadeOut) {

                debug('Stage "load" > loaded.done');

                // draw top bar now
                // ext.point('io.ox/core/banner').invoke('draw');
                ext.point('io.ox/core/appcontrol').invoke('draw');
                ext.point('io.ox/core/topbar').invoke('draw');
                ext.point('io.ox/core/mobile').invoke('draw');

                // help here
                if (!ext.point('io.ox/core/topbar').isEnabled('default')) {
                    $('#io-ox-screens').css('top', '0px');
                    topbar.hide();
                }
                //draw plugins
                ext.point('io.ox/core/plugins').invoke('draw');

                debug('Stage "load" > autoLaunch ...');

                // store hash now or restored apps might have changed url
                var hash = _.copy(_.url.hash());

                // restore apps
                ox.ui.App.restore().always(function () {
                    // is set false, if no autoLaunch is available.
                    // for example if default app is 'none' (see Bug 51207) or app is restored (see Bug Bug 51211)
                    var allUnavailable = baton.autoLaunch.length > 0;
                    // auto launch
                    _(baton.autoLaunch)
                    .chain()
                    .map(function (id) {
                        return getAutoLaunchDetails(id);
                    })
                    .filter(function (details) {
                        //don’t autoload without manifest
                        //don’t autoload disabled apps
                        return ox.manifests.apps[details.app] !== undefined && !ox.manifests.isDisabled(details.app);
                    })
                    .each(function (details, index) {
                        //only load first app on small devices
                        if (index === 0) allUnavailable = false;
                        if (_.device('smartphone') && index > 0) return;
                        // split app/call
                        var launch, method, options = _(hash).pick('folder', 'id');
                        debug('Auto launch:', details.app, options);
                        launch = ox.launch(details.app, options);
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
                });

                baton.instantFadeOut = instantFadeOut;
            })
            .fail(function () {
                console.warn('core: Stage "load" > loaded.fail!', baton);
            });
        }
    });

    new Stage('io.ox/core/stages', {
        id: 'curtain',
        index: 700,
        run: function (baton) {

            debug('Stage "curtain"');

            if (baton.instantFadeOut) {
                // instant fade out
                $('#background-loader').idle().hide();
                return $.when();
            }
            var def = $.Deferred();
            $('#background-loader').idle().fadeOut(DURATION, def.resolve);
            return def;
        }
    });

    new Stage('io.ox/core/stages', {
        id: 'ready',
        index: 1000000000000,
        run: function () {
            debug('DONE!');
            ox.trigger('core:ready');
        }
    });
});
