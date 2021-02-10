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

define('io.ox/core/main', [
    'io.ox/core/desktop',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/stage',
    'io.ox/core/notifications',
    // defines jQuery plugin
    'io.ox/core/commons',
    'io.ox/core/upsell',
    'io.ox/core/ping',
    'io.ox/core/a11y',
    'io.ox/core/main/logout',
    'io.ox/core/main/refresh',
    'io.ox/core/main/topbar_right',
    'io.ox/core/main/debug',
    'settings!io.ox/core',
    'gettext!io.ox/core',
    'io.ox/backbone/views/window',
    'io.ox/core/main/registry',
    'io.ox/core/main/offline',
    'io.ox/core/relogin',
    'io.ox/core/links',
    'io.ox/core/http_errors',
    'io.ox/backbone/views/disposable',
    'io.ox/tours/get-started',
    'io.ox/core/whatsnew/main',
    'io.ox/core/main/icons',
    'io.ox/core/main/appcontrol',
    'io.ox/core/main/stages',
    'io.ox/core/main/designs',
    'io.ox/core/count/main'
], function (desktop, ext, Stage, notifications, commons, upsell, ping, a11y, logout, refresh, tbr, debug, settings, gt) {

    'use strict';

    // general fix for flexbox scrolling issue (see bugs 43799, 44938, 45501, 46950, 47395)
    $('#io-ox-windowmanager').on('scroll', function () {
        // no infinite loop here. Only scroll if needed
        if (this.scrollTop > 0) this.scrollTop = 0;
    });

    debug('core: Loaded');
    ox.trigger('core:load');

    _.stepwiseInvoke = function (list, method, context) {
        if (!_.isArray(list)) return $.when();
        var args = Array.prototype.slice.call(arguments, 3), done = $.Deferred(), tmp = [];
        function store(result) {
            tmp.push(result);
        }
        function tick() {
            // are we done now?
            if (list.length === 0) return done.resolve(tmp);
            // get next item
            var item = list.shift();
            // has method?
            if (item && _.isFunction(item[method])) {
                // call method and expect a deferred object
                var ret = item[method].apply(context, args);
                if (ret && ret.promise) return ret.done(store).then(tick, done.reject);
            }
            tick();
        }
        tick();
        return done.promise();
    };

    ext.point('io.ox/core/mobile').extend({
        id: 'i18n',
        draw: function () {
            // pass the translated string to the dropdown handler
            // which has no access to gt functions
            $(document).trigger('dropdown:translate', gt('Close'));
        }
    });

    function launch() {
        // add some senseless characters
        // a) to avoid unwanted scrolling
        // b) to recognize deep links
        if (location.hash === '') location.hash = '#!!';

        var baton = ext.Baton.ensure({
            popups: []
        });

        debug('core: launch > run stages');
        Stage.run('io.ox/core/stages', baton);
    }

    return {
        logout: logout,
        launch: launch
    };
});
