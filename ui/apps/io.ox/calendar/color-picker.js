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
                attribute: 'color'
            }, opt);

            // make sure, that the additional color is not a duplicate
            if (opt.additionalColor && _(util.colors).findWhere({ color: this.opt.additionalColor })) this.opt.additionalColor = undefined;
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
            var id = _.uniqueId('color-label-');
            return $('<label>').append(
                // radio button
                $('<input type="radio" name="color">')
                    .attr('id', id)
                    .val(color.value)
                    .prop('checked', this.getValue() === color.value)
                    .on('change', this.onChangeColor),
                // colored box
                $('<div class="box color-label">')
                    .attr('title', color.label)
                    .css({
                        'background-color': color.value,
                        color: util.getForegroundColor(color.value)
                    })
            );
        },

        render: function () {
            var self = this;
            if (this.opt.noColorOption) {
                this.$el.append(
                    this.renderOption({ label: gt('no color'), foreground: '#000' })
                        .addClass('no-color')
                );
            }
            _.range(0, 10).forEach(function (index) {
                self.$el.append(self.renderOption(util.colors[index]));
            });
            if (this.opt.additionalColor) {
                this.$el.append(this.renderOption(this.opt.additionalColor));
            }
            return this;
        }

    });

});
