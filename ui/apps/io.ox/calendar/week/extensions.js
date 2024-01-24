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

define('io.ox/calendar/week/extensions', [
    'io.ox/core/extensions',
    'io.ox/calendar/util'
], function (ext, util) {

    'use strict';

    ext.point('io.ox/calendar/week/view/appointment').extend({
        id: 'resize-fulltime',
        index: 100,
        draw: function (baton) {
            var model = baton.model;
            if (!util.isAllday(model)) return;
            if (!this.hasClass('modify')) return;
            var startDate = baton.view.model.get('startDate'),
                endDate = startDate.clone().add(baton.view.numColumns, 'days');
            if (!model.getMoment('startDate').isSame(startDate, 'day')) this.append($('<div class="resizable-handle resizable-w" aria-hidden="true">'));
            if (!model.getMoment('endDate').isSame(endDate, 'day')) this.append($('<div class="resizable-handle resizable-e" aria-hidden="true">'));
        }
    });

    ext.point('io.ox/calendar/week/view/appointment').extend({
        id: 'resize',
        index: 200,
        draw: function (baton) {
            var model = baton.model;
            if (util.isAllday(model)) return;
            if (!this.hasClass('modify')) return;
            // nodes may be reused or cloned, make sure to remove excess resize handles
            this.find('.resizable-handle').remove();
            if (model.getMoment('startDate').local().isSame(baton.date, 'day')) this.append($('<div class="resizable-handle resizable-n" aria-hidden="true">'));
            if (model.getMoment('endDate').local().isSame(baton.date, 'day')) this.append($('<div class="resizable-handle resizable-s" aria-hidden="true">'));
        }
    });

    ext.point('io.ox/calendar/week/view/appointment').extend({
        id: 'flags',
        index: 300,
        draw: function (baton) {
            var model = baton.model;
            if (util.isAllday(model)) return;

            // no need to create nodes if all day so separate the checks
            var flags = util.returnIconsByType(model).property;
            if (flags.length === 0) return;

            var contentContainer = $(this).find('.appointment-content'),
                contentHeight =  $(this).attr('contentHeight'),
                // keep in sync with css, lineheight
                titleHeight = 16,
                noWrap = $(this).hasClass('no-wrap'),
                // keep in sync with css, lineheight
                locationHeight = noWrap || !model.get('location') ? 0 : 16,
                flagsHeight = 12;

            if (titleHeight + locationHeight < contentHeight - flagsHeight) {
                contentContainer.append($('<div class="flags bottom-right">').append(flags));
            }
        }
    });

});
