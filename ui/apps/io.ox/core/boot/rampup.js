/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/boot/rampup', [
    'io.ox/core/http',
    'io.ox/core/extensions'
], function (http, ext) {
    'use strict';

    function storeIn(origData, path) {
        return function (data) {
            path.split('//').reduce(function (obj, key, index, arr) {
                obj[key] = obj[key] || {};
                if (index === arr.length - 1) {
                    obj[key] = data;
                }
                return obj[key];
            }, origData);
        };
    }

    ext.point('io.ox/core/boot/rampup').extend([{
        id: 'exit_early',
        fetch: function (baton) {
            if (_.isEmpty(ox.rampup)) return;
            var debug = require('io.ox/core/boot/util').debug;
            debug('skipping rampup extensions, already got data', ox.rampup);
            baton.stopPropagation();
            baton.preventDefault();
        }
    }, {
        id: 'http_pause',
        fetch: function () {
            http.pause();
        }
    }, {
        id: 'jslobs',
        fetch: function (baton) {
            baton.data.jslobs = {};
            require(['settings!io.ox/caldav']).then(storeIn(baton.data, 'jslobs//io.ox/caldav'));
            require(['settings!io.ox/calendar']).then(storeIn(baton.data, 'jslobs//io.ox/calendar'));
            require(['settings!io.ox/contacts']).then(storeIn(baton.data, 'jslobs//io.ox/contacts'));
            require(['settings!io.ox/core']).then(storeIn(baton.data, 'jslobs//io.ox/core'));
            require(['settings!io.ox/core/updates']).then(storeIn(baton.data, 'jslobs//io.ox/core/updates'));
            require(['settings!io.ox/files']).then(storeIn(baton.data, 'jslobs//io.ox/files'));
            require(['settings!io.ox/mail']).then(storeIn(baton.data, 'jslobs//io.ox/mail'));
            require(['settings!io.ox/tasks']).then(storeIn(baton.data, 'jslobs//io.ox/tasks'));
        }
    }, {
        id: 'user config',
        fetch: function () {
            require(['io.ox/core/boot/config']).then(function (config) { return config.user(); });
        }
    }, {
        id: 'oauth',
        fetch: function (baton) {
            http.GET({
                module: 'oauth/accounts',
                params: { action: 'all' }
            }).then(storeIn(baton.data, 'oauth//accounts'));
            http.GET({
                module: 'oauth/services',
                params: { action: 'all' }
            }).then(storeIn(baton.data, 'oauth//services'));
        }
    }, {
        id: 'onboardingDevices',
        fetch: function (baton) {
            http.GET({
                module: 'onboarding',
                params: { action: 'config' }
            }).then(storeIn(baton.data, 'onboardingDevices'));
        }
    }, {
        id: 'user',
        fetch: function (baton) {
            http.GET({
                module: 'user',
                params: { action: 'get', id: baton.sessionData.user_id }
            }).then(storeIn(baton.data, 'user'));
        }
    }, {
        id: 'accounts',
        fetch: function (baton) {
            http.GET({
                module: 'account',
                params: { action: 'all' }
            }).then(storeIn(baton.data, 'accounts'));
        }
    }, {
        id: 'http_resume',
        fetch: function () {
            return http.resume();
        }
    }]);
});
