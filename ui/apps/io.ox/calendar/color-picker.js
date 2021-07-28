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

define('io.ox/calendar/color-picker', [
    'io.ox/calendar/util',
    'gettext!io.ox/calendar',
    'less!io.ox/calendar/color-picker'
], function (util, gt) {

    'use strict';

    return Backbone.View.extend({

        className: 'io-ox-calendar-color-picker',
        initialize: function (opt) {
            this.opt = _.extend({
                noColorOption: false,
                additionalColor: undefined,
                attribute: 'color',
                rows: 3
            }, opt);

            // make sure, that the additional color is not a duplicate
            if (opt.additionalColor && _(util.colors).findWhere({ value: this.opt.additionalColor.value })) this.opt.additionalColor = undefined;
            this.onChangeColor = this.onChangeColor.bind(this);

            // allow custom getter and setter
            if (this.opt.getValue) this.getValue = this.opt.getValue;
            if (this.opt.setValue) this.setValue = this.opt.setValue;
        },

        getValue: function () {
            return this.model.get(this.opt.attribute);
        },

        setValue: function (value) {
            this.model.set(this.opt.attribute, value);
        },

        onChangeColor: function (e) {
            this.setValue($(e.currentTarget).data('value'));
        },

        renderOption: function (color) {
            var id = _.uniqueId('color-label-'),
                $href = $('<a href="#" class="color-box-link" draggable="false">').append(
                    $('<i class="fa fa-fw box color-label" aria-hidden="true">')
                        .addClass(this.getValue() === color.value ? 'fa-check' : 'fa-none')
                        .css({
                            'background-color': color.value,
                            color: util.getForegroundColor(color.value)
                        }),
                    $('<span class="sr-only">').text(color.label)
                ).on('click', this.onChangeColor)
                .attr({
                    'id': id,
                    'role': 'menuitemradio',
                    'aria-checked': this.getValue() === color.value,
                    'data-name': this.opt.attribute,
                    'data-value': color.value,
                    'title': color.label
                });
            return $href;
        },

        render: function () {
            var self = this;

            if (this.opt.noColorOption) {
                this.$el.append(
                    this.renderOption({ label: gt('no color') })
                        .addClass('no-color')
                );
            }
            util.colors.forEach(function (color) {
                self.$el.append(self.renderOption(color));
            });
            if (this.opt.additionalColor) {
                this.$el.append(this.renderOption(this.opt.additionalColor));
            }

            return this;
        }

    });

});
