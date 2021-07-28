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

define('io.ox/dynamic-theme/register', [
    'io.ox/core/extensions',
    'io.ox/dynamic-theme/less',
    'text!io.ox/dynamic-theme/apps/themes/style.less.dyn',
    'settings!io.ox/dynamic-theme'
], function (ext, less, theme, settings) {
    'use strict';

    var vars = settings.get(), logoURL = vars.logoURL;
    delete vars.logoURL;

    ext.point('io.ox/core/appcontrol').extend({
        id: 'dynamic-logo',
        after: 'logo',
        draw: function () {
            if (!logoURL) return;
            $('#io-ox-top-logo > img', this).attr('src', logoURL);
        }
    });

    // Legacy values from previous versions override new defaults
    var legacy = {
        topbarBackground: 'frameColor',
        listSelectedFocus: 'selectionColor',
        folderSelectedFocus: 'selectionColor'
    };
    for (var i in legacy) if (vars[legacy[i]]) vars[i] = vars[legacy[i]];

    if (typeof vars.logoHeight === 'number') vars.logoHeight += 'px';
    if (typeof vars.logoWidth === 'number') vars.logoWidth += 'px';
    less.setVars(vars);
    less.enable('themes/style', theme);
});
