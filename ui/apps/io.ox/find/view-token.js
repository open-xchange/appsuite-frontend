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

define('io.ox/find/view-token', [
    'io.ox/backbone/mini-views/dropdown'
], function (Dropdown) {

    'use strict';

    var TokenView = Backbone.View.extend({

        initialize: function () {
            this.ui = {
                label: this.$el.find('.token-label'),
                tokeninput: this.$el.parent().find('.token-input.tt-input'),
                dropdown: $()
            };

            this.api = this.$el.closest('.tokenfield').find('input.tokenfield').data('bs.tokenfield');

            // redraw on option change
            this.listenTo(this.model, 'change:option', _.bind(this.render, this));

            return this;
        },

        render: function () {
            // replace content of token label
            this.ui.label
                .empty()
                .append(
                    this.model.isPerson() ? this.getDropdown() : this.getNameNode()
                );
            // TODO: reset calculated width (https://github.com/sliptree/bootstrap-tokenfield/issues/155)
            this.api.update();
            return this;
        },

        getNameNode: function () {
            if (this.model.isPerson()) return $();

            if (!this.model.getNameDetail()) {
                return $.txt(this.model.getName());
            }

            return [
                $('<span class="token-name">').text(this.model.getName()),
                $.txt('\u00A0'),
                $('<span class="token-detail">').text(this.model.getNameDetail())
            ];
        },

        update: function () {
            // adjust position
            var left = this.$el.offset().left;
            this.ui.dropdown.$el.find('.dropdown-menu').css('left', left);
        },

        getDropdown: function () {
            if (!this.model.isPerson()) return $();

            if (!this.model.get('options').length) {
                return [
                    $('<span class="token-name">').text(this.model.getDisplayName())
                ];
            }

            var value = this.model,
                ddmodel = new Backbone.Model(),
                dropdown = new Dropdown({
                    model: ddmodel,
                    tagName: 'div',
                    classname: 'facets',
                    label: function () {
                        return [
                            $('<span class="token-type">').text(value.getTokenType()),
                            $('<i class="fa fa-caret-down" aria-hidden="true">'),
                            $('<span class="token-name">').text(value.getDisplayName())
                        ];
                    }
                });

            // fixes dropdown position
            dropdown.$el.on('show.bs.dropdown', function () {
                $(this).find('.dropdown-menu').css('top', $(this).offset().top + $(this).height() + 'px');
            });

            this.ui.dropdown = dropdown;

            // ensure (in case option is not set yet)
            ddmodel.set('option', value.getOption().id);

            dropdown.$el.on('show.bs.dropdown', _.bind(this.update, this));

            // activate
            ddmodel.on('change:option', function (model, option) {
                value.activate(option);
            });

            // create dropdown items
            _.each(value.get('options'), function (option) {
                if (option.hidden) return;
                var label = (option.item || option).name;
                dropdown.option('option', option.id, label);
            });

            // dom
            return dropdown.render().$el.addClass('pull-left').attr('data-dropdown', 'view');
        }

    });

    return TokenView;
});
