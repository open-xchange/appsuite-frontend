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

define('com.spamexperts/register', [
    'io.ox/core/extensions',
    'io.ox/core/upsell',
    'gettext!com.spamexperts/translations',
    'settings!com.spamexperts'
],
function (ext, upsell, gt, settings) {
    'use strict';

    if (!upsell.visible('com.spamexperts')) return;

    ext.point('io.ox/core/foldertree/mail/app').extend({
        id: 'com.spamexperts',
        index: 'last',
        draw: function () {
            if (_.device('!smartphone')) {
                this.append($('<div class="links" style="margin-top: -1em">').append(
                    $('<a href="#" data-action="com.spamexperts" tabindex="1" role="button">')
                        .text(
                            //#. %1$s is the name of the configuration panel
                            gt('%1$s access', settings.get('name')))
                        .on('click', goToSettings)
                ));
            }
        }
    });

    function goToSettings(e) {
        e.preventDefault();
        if (upsell.has('com.spamexperts')) {
            ox.launch('io.ox/settings/main', { id: 'com.spamexperts' });
        } else {
            upsell.trigger({ missing: 'com.spamexperts' });
        }
    }
});
