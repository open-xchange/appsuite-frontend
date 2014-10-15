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
    'io.ox/core/http'
], function (themes, util, http) {

    'use strict';

    return function () {

        // remove unnecessary stuff
        util.cleanUp();

        // hide login dialog
        $('#io-ox-login-screen').hide();
        $(this).busy();

        util.debug('loadCore > load settings ...');

        var continuation = $.Deferred();

        function success(settings, mail) {
            // greedy prefetch for mail app
            // need to get this request out as soon as possible
            if (settings.get('autoStart') === 'io.ox/mail/main') {
                var folder = 'default0/INBOX',
                    thread = mail.get(['viewOptions', folder, 'thread'], true),
                    action = thread ? 'threadedAll' : 'all',
                    params = {
                        action: action,
                        folder: folder,
                        columns: '102,600,601,602,603,604,605,607,608,610,611,614,652',
                        sort: mail.get(['viewOptions', folder, 'sort'], 610),
                        order: mail.get(['viewOptions', folder, 'order'], 'desc')
                    };
                if (thread) {
                    _.extend(params, {
                        includeSent: true,
                        max: 300,
                        timezone: 'utc',
                        limit: '0,30'
                    });
                }
                http.GET({ module: 'mail', params: params }).done(function (data) {
                    // the collection loader will check ox.rampup for this data
                    ox.rampup['mail/' + $.param(params)] = data;
                });
            }

            var theme = _.url.hash('theme') || settings.get('theme') || 'default';

            $('html').toggleClass('high-contrast', settings.get('highcontrast', false));

            util.debug('loadCore > load config ...');
            util.debug('loadCore > require "main" & set theme', theme);

            var def1 = require(['io.ox/core/main']),
                def2 = themes.set(theme);

            function cont() {
                def1.then(
                    function success(core) {
                        // go!
                        util.debug('core.launch()');
                        //trigger load event so custom dropdown can add event listeners (loading to early causes js errors on mobile devices during login)
                        $(document).trigger('core-main-loaded');
                        continuation.resolve(core);
                    },
                    function fail(e) {
                        console.error('Cannot launch core!', e);
                    }
                );
            }

            function fail() {
                console.error('Could not load theme: ' + theme);
                continuation.reject('autologin=false');
            }

            $.when(def1, def2).always(function () {
                // failed to load theme?
                if (def2.state() === 'rejected') {
                    // give up if it was the default theme
                    if (theme === 'default') return fail();
                    // otherwise try to load default theme now
                    console.error('Could not load custom theme: ' + theme);
                    themes.set('default').then(cont, fail);
                } else {
                    cont();
                }
            });
        }

        function fail() {

            util.debug('loadCore > load config failed, using default ...');

            var def1 = require(['io.ox/core/main']),
                def2 = themes.set('default');

            function cont() {
                util.debug('loadCore def1 and def2 resolved');
                def1.then(
                    function success(core) {
                        // go!
                        util.debug('core.launch()');
                        continuation.resolve(core);
                    },
                    function fail(e) {
                        console.error('Cannot launch core!', e);
                    }
                );
            }

            function fail() {
                console.error('Could not load theme: default');
                continuation.reject('autologin=false');
            }

            $.when(def2, def1).then(cont, fail);
        }

        // get configuration & core
        require(['settings!io.ox/core', 'settings!io.ox/mail', ox.base + '/precore.js'], success, fail);

        return continuation.promise();
    };
});
