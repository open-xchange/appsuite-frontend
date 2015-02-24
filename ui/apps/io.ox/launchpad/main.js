/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

// huu

define('io.ox/launchpad/main', [
    'io.ox/core/desktop',
    'io.ox/core/api/apps',
    'settings!io.ox/core',
    'io.ox/core/extensions',
    'io.ox/core/upsell',
    'gettext!io.ox/core',
    'less!io.ox/launchpad/style'
], function (desktop, api, coreConfig, ext, upsell, gt) {

    'use strict';

    // same stupid solution like in core/main until we get translated apps from backend
    gt.pgettext('app', 'Portal');
    gt.pgettext('app', 'Mail');
    gt.pgettext('app', 'Address Book');
    gt.pgettext('app', 'Calendar');
    gt.pgettext('app', 'Scheduling');
    gt.pgettext('app', 'Tasks');
    gt.pgettext('app', 'Drive');
    gt.pgettext('app', 'Conversations');
    gt.pgettext('app', 'Settings');
    gt.pgettext('app', 'Documents');

    var FADE_DURATION = 1000,

        firstRun = true,

        pad,

        // app template
        appTmpl = _.template(
            '<a href="#" class="app" tabindex="1" data-app-name="<%= id %>">' +
            '  <img src="<%= icon %>" class="icon" alt="">' +
            '  <div class="title ellipsis"><%= title %></div>' +
            '  <div class="lock abs"><i class="fa fa-lock"></i></div>' +
            '</a>'
        ),

        // initialize (just once)
        init = _.once(function () {
            var screen = ox.ui.screens.add('launchpad');
            pad = $('<div>').addClass('abs').appendTo(screen)
                .scrollable()
                .addClass('pad');
        }),

        getRunningApps = function (name) {
            return _.chain(ox.ui.running)
                .filter(function (app) {
                    var appName = app.getName();
                    return name !== undefined ? appName === name : appName !== undefined;
                })
                .map(function (app) {
                    var data = api.get(app.getName());
                    data.title = app.getTitle() || data.title || app.getWindowTitle() || app.getName();
                    data.appId = app.getId();
                    return { data: data, app: app };
                })
                .value();
        },

        launchApp = function (e) {
            // stop link
            e.preventDefault();
            // create clone
            var self = $(this),
                running,
                parent = pad.parent().parent(),
                p = self.offset(),
                pp = parent.offset();

            parent.append(
                $(this).clone()
                    .addClass('io-ox-app-clone')
                    .css({
                        position: 'absolute',
                        top: p.top - pp.top,
                        left: p.left - pp.left
                    })
            );
            // animate & launch
            parent.focus();
            // look for running app
            if (e.data.appId && (running = getRunningApps(e.data.id)).length) {
                var runIndex = 0;
                if (running.length > 1) {
                    for (var i = 0; i < running.length; ++i) {
                        if (running[i].app.getId() === e.data.appId) {
                            runIndex = i;
                            break;
                        }
                    }
                }
                running[runIndex].app.launch();
            } else {
                $.when(
                    require([e.data.entryModule || e.data.id + '/main']),
                    pad.fadeOut(FADE_DURATION >> 1)
                )
                .done(function (m) {
                    if (e.data.launchArguments) {
                        var app = m.getApp();
                        app.launch.apply(app, e.data.launchArguments);
                    } else if (e.data.createArguments) {
                        //documents need a parameter to create a new document
                        e.data.createArguments.folderId = String(coreConfig.get('folder/infostore'));
                        m.getApp(e.data.createArguments).launch();
                    } else {
                        m.getApp().launch();
                    }
                });
            }
        },

        fnHasAppStore = function () {
            var managePoint = ext.point('io.ox/core/apps/manage');
            return managePoint.list().length > 0;
        },

        fnOpenAppStore = function (e) {
            e.preventDefault();
            var openedStore = false;
            ext.point('io.ox/core/apps/manage').each(function (extension) {
                if (openedStore) {
                    return;
                }
                extension.openStore();
                openedStore = true;
            });
            /*
            if (!openedStore) {
                require(['io.ox/applications/main'], function (m) {
                    m.getApp().launch();
                });
            }
            */
        },

        drawApp = function (data) {
            data.title = /*#, dynamic*/gt.pgettext('app', data.title);
            return $(appTmpl(data));
        },

        clear = function () {
            // clean up
            pad.parent().parent().find('.io-ox-app-clone').remove();
            pad.scrollTop(0).empty().hide();
        },

        fnUpsell = function (e) {
            e.preventDefault();
            var data = e.data;
            upsell.trigger({ type: 'app', id: data.id, missing: upsell.missing(data.requires) });
        },

        paint = function () {

            clear();

            var hRunning = $('<h1>').text(gt('Running applications')),
                secRunning = $('<div>').addClass('section'),
                hApps = $('<h1>').text(gt('Your applications')),
                secInstalled = $('<div>').addClass('section'),
                running;

            running = getRunningApps();
            _(running).each(function (o) {
                // draw running app
                secRunning.append(
                    drawApp(o.data).on('click', o.data, launchApp)
                );
            });

            // add link to app store
            function fnListApps(installed) {
                secInstalled.empty();
                if (fnHasAppStore()) {
                    secInstalled.append(
                        $('<div>').addClass('manage-apps')
                        .append(
                            $('<a>', { href: '#', tabindex: '1' })
                            .addClass('btn btn-primary')
                            .text(gt('Manage applications'))
                            .on('click', fnOpenAppStore)
                        )
                    );
                }
                _(installed).each(function (data) {
                    // draw installed app
                    var app;
                    if ((data.visible || _.isUndefined(data.visible)) && upsell.visible(data.requires)) {
                        // draw
                        app = drawApp(data);
                        // needs upsell?
                        if (!upsell.has(data.requires)) {
                            app.addClass('upsell').on('click', data, fnUpsell);
                        } else {
                            app.on('click', data, launchApp);
                        }
                        // append
                        secInstalled.append(app);
                    }
                });
            }

            api.getInstalled('cached').done(fnListApps);

            api.getInstalled().done(fnListApps);

            if (running.length) {
                pad.append(hRunning, secRunning);
            }

            pad.append(hApps, secInstalled).fadeIn(firstRun ? FADE_DURATION : 0);
            firstRun = false;
        },

        // show launch pad
        show = function () {
            if (ox.ui.screens.current() !== 'launchpad') {
                init();
                paint();
                ox.ui.screens.show('launchpad');
            }
        };

    return {
        show: show
    };

});
