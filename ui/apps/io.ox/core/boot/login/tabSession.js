/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
