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

define('io.ox/portal/util', ['settings!io.ox/portal'], function (settings) {

    'use strict';

    // this util class was introduced to avoid using portal/widgets.js
    // because this would load *all* portal plugins

    return {

        getWidgets: function () {
            return _(settings.get('widgets/user', {})).map(function (obj) {
                // make sure we always have props
                obj.props = obj.props || {};
                return obj;
            });
        },

        getWidgetsByType: function (type) {
            return _(this.getWidgets()).filter(function (obj) {
                return obj.type === type;
            });
        },

        setColor: function (node, color) {
            color = color || 'default';
            node.removeClass('widget-color-' + node.attr('data-color'));
            node.addClass('widget-color-' + color).attr('data-color', color);
        }
    };
});
