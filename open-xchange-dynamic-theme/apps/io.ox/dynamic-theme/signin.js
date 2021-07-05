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

define('io.ox/dynamic-theme/signin', [
    'io.ox/core/extensions',
    'io.ox/dynamic-theme/less',
    'text!io.ox/dynamic-theme/apps/themes/login/login.less.dyn'
], function (ext, less, theme) {
    'use strict';

    if (!window.ox || !ox.serverConfig || !ox.serverConfig.dynamicTheme) return;

    var vars = ox.serverConfig.dynamicTheme;

    if (vars.headerLogo) {
        $('#io-ox-login-header h1').empty().append($('<img>').attr({
            src: vars.headerLogo,
            alt: ox.serverConfig.productName
        }));
        delete vars.headerLogo;
    }

    less.setVars(vars);
    less.enable('themes/login/login', theme);
});
