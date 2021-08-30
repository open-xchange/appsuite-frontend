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

define('io.ox/mail/categories/picker', [
    'io.ox/mail/categories/api',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/yell',
    'gettext!io.ox/mail'
], function (api, Dropdown, actionsUtil, yell, gt) {

    var PickerDropdown = Dropdown.extend({

        tagName: 'li',

        renderMenu: function (options) {
            this.$ul.empty();
            this.props = options.props;
            var data = [].concat(options.data);
            this.addCategories(data);
            this.addLinks(data);
        },

        addCategories: function (data) {

            var current = this.props.get('category_id'),
                list = api.collection.filter(function (model) {
                    return model.isEnabled() && model.id !== current;
                });

            if (!list.length) return;

            this.header(gt('Move to category'));
            _.each(list, function (model) {
                this.link(model.id, model.get('name'), $.proxy(this.onCategory, this, data));
            }.bind(this));
            this.divider();
        },

        addLinks: function (data) {
            this.link('move-to-folder', gt('Move to folder') + ' …', $.proxy(this.onLink, this, data));
        },

        onCategory: function (data, e) {
            var node = $(e.currentTarget),
                category = node.attr('data-name') || '0',
                name = node.text(),
                source = this.props.get('category_id');

            api.move({
                data: data,
                source: source,
                sourcename: api.collection.get(source).get('name'),
                target: category,
                targetname: name
            }).fail(yell);
        },

        onLink: function (data) {
            // Tested: false
            actionsUtil.invoke('io.ox/mail/actions/move', data);
        }
    });

    var picker = {
        appendDropdown: function (node, options) {
            node.addClass('dropdown-toggle');
            node.parent().addClass('dropdown categories');

            new PickerDropdown({
                el: node.parent(),
                $toggle: node
            }).render().renderMenu(options);
        },
        attach: function (node, options) {
            this.appendDropdown(node, options);
        }
    };

    return picker;

});
