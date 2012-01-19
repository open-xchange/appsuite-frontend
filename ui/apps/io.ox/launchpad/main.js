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

define('io.ox/launchpad/main',
    ['io.ox/core/desktop',
     'io.ox/core/api/apps',
     'gettext!io.ox/core/launchpad',
     'less!io.ox/launchpad/style.css'], function (desktop, api, gt) {

    'use strict';

    var FADE_DURATION = 500,

        pad, container,

        // app template
        appTmpl = _.template(
            '<a href="#" class="app" tabindex="1">' +
            '  <img src="<%= icon %>" class="icon" alt="">' +
            '  <div class="title ellipsis"><span><%= title %></span></div>' +
            '</a>'
        ),

        // initialize (just once)
        init = _.once(function () {
            var screen = ox.ui.screens.add('launchpad');
            pad = $('<div>').addClass('abs').appendTo(screen)
                .scrollable()
                .addClass('pad');
        }),

        launchApp = function (e) {
            // stop link
            e.preventDefault();
            // create clone
            var self = $(this),
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
            // relaunch or load?
            if (e.data.app) {
                e.data.app.launch();
            } else {
                $.when(
                    require([e.data.id + "/main"]),
                    pad.fadeOut(FADE_DURATION >> 1)
                )
                .done(function (m) {
                    m.getApp().launch();
                });
            }
        },

        fnOpenAppStore = function (e) {
            e.preventDefault();
            require(['io.ox/applications/main'], function (m) {
                m.getApp().launch();
            });
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

            var hRunning = $('<h1>').text('Running applications'),
                running = $('<div>').addClass('section'),
                hApps = $('<h1>').text('Your applications'),
                installed = $('<div>').addClass('section');

            // add link to app store
            hApps.prepend(
                $('<a>', { href: '#', tabindex: '1' })
                .addClass('button default-action')
                .text('Manage applications')
                .on('click', fnOpenAppStore)
            );

            _.chain(ox.ui.running)
                .filter(function (app) {
                    return app.getName() !== undefined;
                })
                .map(function (app) {
                    var data = api.get(app.getName());
                    data.title = data.title || app.getWindowTitle() || app.getName();
                    // draw
                    running.append(
                        drawApp(data).on('click', { id: data.id, app: app }, launchApp)
                    );
                });

            _(api.getInstalled()).each(function (data) {
                installed.append(
                    drawApp(data).on('click', { id: data.id }, launchApp)
                );
            });

            pad.append(hRunning, running, hApps, installed).fadeIn(FADE_DURATION);
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