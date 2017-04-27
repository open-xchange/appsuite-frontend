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
    'io.ox/core/boot/util',
    'io.ox/core/http',
    'settings!io.ox/core',
    'settings!io.ox/mail',
    'io.ox/core/capabilities',
    'io.ox/core/manifests',
    'io.ox/core/windowManager',
    'io.ox/core/moment'
], function (themes, util, http, coreSettings, mailSettings, capabilities, manifests) {

    'use strict';

    return function load() {

        // remove unnecessary stuff
        util.cleanUp();

        prefetch();
        addWindowTester();
        applyHighContrast();
        loadUserTheme();

        ox.once('boot:done', function () {
            // clear password (now); if cleared or set to "******" too early,
            // Chrome won't store anything or use that dummay value (see bug 36950)
            $('#io-ox-login-password').val('');
            // final step: launch
            require('io.ox/core/main').launch();
        });
    };

    function addWindowTester() {
        var message, focus, container;
        $('body').append(container = $('<div>').css({
            position: 'absolute',
            background: 'red',
            bottom: 0,
            width: '100%'
        }).append(window.name, message = $('<div class="message">'), focus = $('<div class="focus">')));

        ox.on('windowOpened', function (win) {
            console.log('window opened', win.name);
            message.append($('<button class="btn btn-primary">').attr('data-window-id', win.name).text('message to ' + win.name).on('click', function () {
                ox.windowManager.broadcastTo('Hello ' + win.name, win.name);
            }));
            focus.append($('<button class="btn btn-primary">').attr('data-window-id', win.name).text('focus ' + win.name).on('click', function () {
                ox.windowManager.get(win.name).focus();
            }));
            focus.append($('<button class="btn btn-primary">').attr('data-window-id', win.name).text('open ' + win.name).on('click', function () {
                window.open('', win.name);
            }));
        });
        ox.on('windowClosed', function (win) {
            console.log('window closed', win.name);
            $('body').find('[data-window-id="' + win.name + '"]').remove();
        });
        container.append($('<button class="btn btn-primary">').text('message to all').on('click', function () {
            ox.windowManager.broadcastTo('Hello to all');
        }));
        container.append($('<button class="btn btn-primary">').text('open new tab').on('click', function () {
             // edge seems to always open a fullscreen popup
            ox.windowManager.openAppInWindow({
                name: 'test-app'
            });
        }));
        container.append($('<button class="btn btn-primary">').text('open new popup').on('click', function () {
            // edge seems to always open a fullscreen popup
            ox.windowManager.openAppInWindow({
                name: 'test-app',
                windowAttributes: 'resizable=yes,top=100,left=100,width=1000,height=1200'

            });
        }));

        _(ox.windowManager.windows).each(function (win) {
            if (win.name !== window.name) {
                message.append($('<button class="btn btn-primary">').attr('data-window-id', win.name).text('message to ' + win.name).on('click', function () {
                    ox.windowManager.broadcastTo('Hello ' + win.name, win.name);
                }));
                focus.append($('<button class="btn btn-primary">').attr('data-window-id', win.name).text('focus ' + win.name).on('click', function () {
                    // chrome, only focus on direct child window works
                    // safari, works totally random... sometimes only last opener can focus, sometines only the child windows are focussable
                    // doesn't work in firefox at all yay... http://stackoverflow.com/questions/4085544/why-window-focus-not-working-in-mozilla-firefox
                    // window open with windowname would work but documents is using window.name for their restore functionality
                    // this works in firefox for popups when typing about:config in the addressbar and setting dom.disable_window_flip to false
                    // works without problem in IE 11 and edge
                    ox.windowManager.get(win.name).focus();
                }));
                focus.append($('<button class="btn btn-primary">').attr('data-window-id', win.name).text('open ' + win.name).on('click', function () {
                    // open doesn't work in firefox for tabs http://stackoverflow.com/questions/4085544/why-window-focus-not-working-in-mozilla-firefox
                    // first open then using focus works in firefox, for popups at least (even with dom.disable_window_flip enabled), but not in the same event listener...
                    // doesn't work at all in IE 11 and edge
                    window.open('', win.name);
                }));
            }
        });
    }

    function loadUserTheme() {

        // we have to clear the device function cache or there might be invalid return values, like for example wrong language data.(see Bug 51405)
        _.device.cache = {};
        var theme = _.url.hash('theme') || coreSettings.get('theme') || 'default',
            loadTheme = themes.set(theme),
            //"core" namespace has now a very similar timing to "io.ox/core/main" namespace
            //the only difference is, "core" plugins are loaded completely before
            //"io.ox/core/main" plugins
            loadCore = manifests.manager.loadPluginsFor('core').then(function () {
                return require(['io.ox/core/main']);
            });

        util.debug('Load UI > require [core/main] and set theme', theme);

        $.when(loadCore, loadTheme).then(
            launch.bind(null, loadCore),
            loadDefaultTheme.bind(null, theme, loadCore, loadTheme)
        );
    }

    function loadDefaultTheme(theme, loadCore, loadTheme) {

        function fail() {
            console.error('Could not load default theme');
            ox.trigger('boot:fail');
        }

        util.debug('Loading theme failed', theme);

        // failed to load theme?
        if (loadTheme.state() === 'rejected') {
            // give up if it was the default theme
            if (theme === 'default') return fail();
            // otherwise try to load default theme now
            console.error('Could not load custom theme', theme);
            themes.set('default').then(launch.bind(null, loadCore), fail);
        }
    }

    function launch(loadCore) {

        util.debug('Load UI > launch ...');

        loadCore.then(
            function success() {
                util.debug('DONE!');
                ox.trigger('boot:done');
            },
            function fail(e) {
                console.error('Cannot launch core!', e);
                ox.trigger('boot:fail');
            }
        );
    }

    function prefetch() {

        // greedy prefetch for mail app
        // need to get this request out as soon as possible
        if (coreSettings.get('autoStart') === 'io.ox/mail/main' && capabilities.has('webmail')) {

            var folder = 'default0/INBOX',
                thread = mailSettings.get(['viewOptions', folder, 'thread'], true),
                sort = mailSettings.get(['viewOptions', folder, 'sort'], 610),
                action = thread ? 'threadedAll' : 'all',
                params = {
                    action: action,
                    folder: folder,
                    columns: '102,600,601,602,603,604,605,606,607,608,610,611,614,652,656,X-Open-Xchange-Share-URL',
                    sort: sort,
                    order: mailSettings.get(['viewOptions', folder, 'order'], 'desc'),
                    categoryid: 'general',
                    timezone: 'utc',
                    limit: '0,' + mailSettings.get('listview/primaryPageSize', 50)
                };

            // mail categories (aka tabbed inbox)
            if (_.device('smartphone') || !capabilities.has('mail_categories') || !mailSettings.get('categories/enabled')) {
                delete params.categoryid;
            }

            // edge case: no prefetch if sorting is 'from-to' (need to many data we don't have yet)
            if (sort === 'from-to') return;

            if (thread) {
                _.extend(params, { includeSent: true, max: 300 });
            }
            http.GET({ module: 'mail', params: params }).done(function (data) {
                // the collection loader will check ox.rampup for this data
                ox.rampup['mail/' + _.param(params)] = data;
            });
        }
    }

    function applyHighContrast() {
        $('html').toggleClass('high-contrast', coreSettings.get('highcontrast', false));
    }
});
