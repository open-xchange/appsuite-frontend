/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/calendar/month/extensions', [
    'io.ox/core/extensions',
    'io.ox/calendar/util'
], function (ext, util) {

    'use strict';

    ext.point('io.ox/calendar/month/view/appointment').extend({
        id: 'start-time',
        index: 100,
        draw: function (baton) {
            var contentContainer = this.children('.appointment-content'),
                titleContainer = contentContainer.children('.title-container');
            titleContainer.replaceWith(titleContainer.children());
            var model = baton.model;
            if (util.isAllday(model)) return;
            var start = moment.max(baton.startDate.clone(), model.getMoment('startDate'));
            contentContainer.prepend($('<span class="start">').text(start.tz(moment().tz()).format('LT')));
        }
    });

});
