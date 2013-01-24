/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

// huu

define('io.ox/launchpad/main',
    ['io.ox/core/desktop',
     'io.ox/core/api/apps',
     'io.ox/core/config',
     'io.ox/core/extensions',
     'gettext!io.ox/core',
     'less!io.ox/launchpad/style.css'], function (desktop, api, config, ext, gt) {

    'use strict';

    var FADE_DURATION = 1000,

        firstRun = true,

        pad, container,

        // app template
        appTmpl = _.template(
            '<a href="#" class="app" tabindex="1" data-app-name="<%= id %>">' +
            '  <img src="<%= icon %>" class="icon" alt="">' +
            '  <div class="title ellipsis"><%= title %></div>' +
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
                pp = parent.offset(),
                clone = $(this).clone()
                    .addClass('io-ox-app-clone')
                    .css({
                        position: 'absolute',
                        top: p.top - pp.top,
                        left: p.left - pp.left
                    })
                    .appendTo(parent);
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
                    require([e.data.entryModule || e.data.id + "/main"]),
                    pad.fadeOut(FADE_DURATION >> 1)
                )
                .done(function (m) {
                    if (e.data.launchArguments) {
                        var app = m.getApp();
                        app.launch.apply(app, e.data.launchArguments);
                    } else if (e.data.createArguments) {
                        //documents need a parameter to create a new document
                        e.data.createArguments.folderId = String(config.get("folder.infostore"));
                        m.getApp(e.data.createArguments).launch();
                    } else {
                        m.getApp().launch();
                    }
                });
            }
        },

        fnOpenAppStore = function (e) {
            e.preventDefault();
            var openedStore = false;
            ext.point("io.ox/core/apps/manage").each(function (extension) {
                if (openedStore) {
                    return;
                }
                extension.openStore();
                openedStore = true;
            });
            if (!openedStore) {
                require(['io.ox/applications/main'], function (m) {
                    m.getApp().launch();
                });
            }
        },

        drawApp = function (data) {
            return $(appTmpl(data));
        },

        clear = function () {
            // clean up
            pad.parent().parent().find('.io-ox-app-clone').remove();
            pad.scrollTop(0).empty().hide();
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

            api.getInstalled('cached').done(function (installed) {
                secInstalled.empty();
                /*secInstalled.append(
                    $('<div>').addClass('manage-apps')
                    .append(
                        $('<a>', { href: '#', tabindex: '1' })
                        .addClass('btn btn-primary')
                        .text(gt('Manage applications'))
                        .on('click', fnOpenAppStore)
                    )
                );*/
                _(installed).each(function (data) {
                    // draw installed app
                    if (data.visible || _.isUndefined(data.visible)) {
                        secInstalled.append(
                            drawApp(data).on('click', data, launchApp)
                        );
                    }
                });
            });

            api.getInstalled().done(function (installed) {
                secInstalled.empty();
                /*secInstalled.append(
                    $('<div>').addClass('manage-apps')
                    .append(
                        $('<a>', { href: '#', tabindex: '1' })
                        .addClass('btn btn-primary')
                        .text(gt('Manage applications'))
                        .on('click', fnOpenAppStore)
                    )
                );*/
                _(installed).each(function (data) {
                    // draw installed app
                    if (data.visible || _.isUndefined(data.visible)) {
                        secInstalled.append(
                            drawApp(data).on('click', data, launchApp)
                        );
                    }
                });
            });

            if (running.length) {
                pad.append(hRunning, secRunning);
            }

            pad.append(hApps, secInstalled).fadeIn(firstRun ? FADE_DURATION : 0);
            firstRun = false;
        },

        // hide launch pad
        hide = function () {
            ox.ui.screens.show('windowmanager');
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
