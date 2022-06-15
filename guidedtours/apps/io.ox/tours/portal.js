/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/tours/portal', [
    'io.ox/core/tk/wizard',
    'gettext!io.ox/tours'
], function (Tour, gt) {

    'use strict';

    /* Tour: portal */
    Tour.registry.add({
        id: 'default/io.ox/portal',
        app: 'io.ox/portal',
        priority: 1
    }, function () {
        new Tour()
        .step()
            .title(gt('The Portal'))
            .content(gt('The Portal informs you about current emails, appointments or social network news.'))
            .hotspot('.launcher[data-app-name="io.ox/portal"]')
            .end()
        .step()
            .title(gt('Reading the details'))
            .content(gt('To read the details, click on an entry in a square.'))
            .spotlight('.widget .item')
            .end()
        .step()
            .title(gt('Drag and drop'))
            .content(gt('To change the layout, drag a square\'s title to another position and drop it there.'))
            .spotlight('.widget:visible:first')
            .end()
        .step()
            .title(gt('Closing a square'))
            .content(gt('If you no longer want to display a square, click the delete icon.'))
            .hotspot('.widget .disable-widget .fa-times:visible')
            .spotlight('.widget .disable-widget .fa-times:visible')
            .end()
        .step()
            .title(gt('Customizing the Portal'))
            .content(gt('To display a square again or to display further information sources, click on Customize this page.'))
            .spotlight('.header [data-action="customize"]')
            .hotspot('.header [data-action="customize"]')
            .end()
        .start();
    });
});
