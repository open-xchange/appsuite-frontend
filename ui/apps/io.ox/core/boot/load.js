/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/boot/load', [
    'themes',
    'io.ox/core/boot/util',
    'io.ox/core/http',
    'settings!io.ox/core',
    'settings!io.ox/mail'
], function (themes, util, http, coreSettings, mailSettings) {

    'use strict';

    return function load() {

        // remove unnecessary stuff
        util.cleanUp();

        prefetch();
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

    function loadUserTheme() {

        var theme = _.url.hash('theme') || coreSettings.get('theme') || 'default',
            loadCore = require(['io.ox/core/main']),
            loadTheme = themes.set(theme);

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
                // trigger load event so custom dropdown can add event listeners
                // (loading to early causes js errors on mobile devices during login)
                $(document).trigger('core-main-loaded');
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
        if (coreSettings.get('autoStart') === 'io.ox/mail/main') {
            var folder = 'default0/INBOX',
                thread = mailSettings.get(['viewOptions', folder, 'thread'], true),
                action = thread ? 'threadedAll' : 'all',
                params = {
                    action: action,
                    folder: folder,
                    columns: '102,600,601,602,603,604,605,607,608,610,611,614,652',
                    sort: mailSettings.get(['viewOptions', folder, 'sort'], 610),
                    order: mailSettings.get(['viewOptions', folder, 'order'], 'desc'),
                    timezone: 'utc',
                    limit: '0,30'
                };
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
