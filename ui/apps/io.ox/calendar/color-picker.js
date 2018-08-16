/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
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

        onChangeColor: function () {
            this.setValue(this.$(':checked').val());
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
                    // radio button
                    // $('<input type="radio" name="color">')
                    // .attr('id', id)
                    // .val(color.value)
                    // .prop('checked', this.getValue() === color.value)
                    // .on('change', this.onChangeColor),
                    // // colored box
                    // $('<div class="box color-label" aria-hidden="true">')
                    // .css({
                    //     'background-color': color.value,
                    //     color: util.getForegroundColor(color.value)
                    // })
                    // .attr('title', color.label),
                    $('<span class="sr-only">').text(color.label)
                ).attr({
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
