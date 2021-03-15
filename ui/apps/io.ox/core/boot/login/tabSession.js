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
 * @author Kristof Kamin <kristof.kamin@open-xchange.com>
 */

define('io.ox/core/boot/login/tabSession', [
    'io.ox/core/boot/util',
    'io.ox/core/extensions',
    'io.ox/core/api/tab'
], function (util, ext, tabAPI) {

    'use strict';

    ext.point('io.ox/core/boot/login').extend({
        id: 'TabSession',
        index: 195,
        login: function () {
            if (!util.checkTabHandlingSupport()) return;
            return tabAPI.login().then(tabSessionLoginSuccess, function () {
                util.debug('TabSession: login timed out');
            });
        }
    });

    function tabSessionLoginSuccess(loginData) {
        util.debug('TabSession: logging in');
        ox.session = loginData.session;
        ox.secretCookie = true;
        util.debug('TabSession: logged in');
        // reminder: do not not propagate this login again, because it's
        // not a new login and all other tabs have this session already
        loginData.tabSessionLogin = true;
        ox.trigger('login:success', loginData);
    }

    return tabSessionLoginSuccess;
});
