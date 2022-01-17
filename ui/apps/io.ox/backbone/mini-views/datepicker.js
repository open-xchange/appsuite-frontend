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

define('io.ox/backbone/mini-views/datepicker', [
    'settings!io.ox/calendar',
    'gettext!io.ox/core',
    'io.ox/calendar/util',
    'less!io.ox/backbone/mini-views/datepicker'
], function (settings, gt, util) {

    'use strict';

    // Bootstrap DatePicker
    var DatePickerView = Backbone.View.extend({

        tagName: 'fieldset',

        initialize: function (options) {
            this.options = _.extend({
                display: 'DATE',
                clearButton: false,
                ignoreToggle: false,
                timezoneButton: false,
                timezoneAttribute: 'timezone',
                label: '',
                a11y: {}
            }, options);

            this.attribute = this.options.attribute;
            this.nodes = {};
            this.mobileSettings = {};
            this.mobileMode = _.device('touch');
            this.chronos = options.chronos;

            this.listenTo(this.model, 'change:' + this.attribute, this.updateView);
            this.listenTo(this.model, 'invalid:' + this.attribute, this.onError);
            this.listenTo(this.model, 'valid', this.onValid);
            this.listenTo(this.model, 'change:' + this.options.timezoneAttribute, this.updateView);

            // add attribute information
            if (this.options.attribute) {
                this.$el.attr('data-attribute', this.options.attribute);
            }
        },

        events: {
            'click .timezone': 'clickTimezone'
        },

        render: function () {
            var self = this,
                def = $.Deferred(),
                guid = _.uniqueId('form-control-label-');

            this.$el.addClass('dateinput').toggleClass('mobile-mode', self.mobileMode).append(
                $('<label class="simple control-label">').attr('for', guid).text(this.options.label),
                $('<div class="input-group form-inline">').append(
                    function () {
                        // render date input
                        var ariaID = guid + '-aria',
                            dayFieldLabel = gt('Date') + ' (' + moment.localeData().longDateFormat('l') + ')',
                            timezoneContainer;

                        self.nodes.dayField = $('<input type="text" class="form-control datepicker-day-field">').attr({
                            id: guid,
                            'aria-label': dayFieldLabel,
                            'aria-describedby': ariaID
                        });

                        if (self.mobileMode) {
                            // render date input only on mobile devices
                            return [
                                self.nodes.dayField
                            ];
                        }

                        // render time input
                        self.nodes.timeField = $('<input type="text" class="form-control time-field">').attr('id', _.uniqueId('form-control-label-'));

                        // render timezone badge
                        var timezone = self.chronos ? self.model.getMoment(self.attribute) : moment.tz(self.model.get(self.options.timezoneAttribute)),
                            timezoneAbbreviation = timezone.zoneAbbr(),
                            timezoneFullname = (timezone.format('Z ') + timezone.zoneAbbr() + ' ' + timezone.tz()).replace(/_/g, ' ');

                        if (!self.options.timezoneButton && !self.mobileMode) {
                            timezoneContainer = self.nodes.timezoneField = $('<div class="timezone input-group-addon">').text(timezoneAbbreviation).attr('aria-label', timezoneFullname);
                        } else {
                            // we need <a> tag to make firefox happy (no <button> doesn't work) and tabindex to make safari happy, otherwise they wont close on click outside of the popover
                            // see https://github.com/twbs/bootstrap/issues/14038 and Bug 51690
                            timezoneContainer = self.nodes.timezoneField = $('<a role="button" class="timezone input-group-addon btn">').attr('tabindex', 0).text(timezoneAbbreviation).attr('aria-label', timezoneFullname);

                            if (self.model.has('start_date') && self.model.has('end_date')) {
                                timezoneContainer.attr('data-toggle', 'popover');
                                require(['io.ox/calendar/util'], function (calendarUtil) {
                                    calendarUtil.addTimezonePopover(
                                        timezoneContainer,
                                        self.model.attributes,
                                        {
                                            placement: 'top',
                                            trigger: 'click',
                                            closeOnScroll: self.options.closeOnScroll,
                                            attrName: self.attribute
                                        }
                                    );
                                });
                            }
                        }

                        // add a11y
                        self.nodes.a11yDate = $('<p class="sr-only">').attr('id', ariaID)
                            .text(gt('Use cursor keys to change the date. Press ctrl-key at the same time to change year or shift-key to change month. Close date-picker by pressing ESC key.'));

                        self.toggleTimeInput(!self.isFullTime());

                        return [
                            self.nodes.dayField,
                            self.nodes.a11yDate,
                            self.nodes.timeField,
                            $('<label class="sr-only">').attr('for', self.nodes.timeField.attr('id')).text(gt('Time') + ' (' + moment.localeData().longDateFormat('LT') + ')'),
                            self.nodes.a11yTime,
                            timezoneContainer
                        ];
                    }
                )
            );

            this.updateView();

            if (this.mobileMode) {
                self.nodes.dayField.attr('type', self.isFullTime() ? 'date' : 'datetime-local');
                if (self.chronos) self.nodes.dayField.attr({ required: 'required', defaultValue: '' });
                def.resolve();
            } else {
                require(['io.ox/backbone/views/datepicker', 'io.ox/backbone/mini-views/combobox', 'io.ox/core/tk/datepicker'], function (Picker, Combobox) {

                    new Picker({ date: self.model.get(self.attribute), attribute: self.attribute }).attachTo(self.nodes.dayField);

                    var comboboxOptions = [],
                        filldate = moment().startOf('day'),
                        interval = parseInt(settings.get('interval'), 10) || 30;

                    for (var i = 0; i < 1440; i += interval) {
                        comboboxOptions.push({
                            name: filldate.format('LT'),
                            value: filldate.format('LT')
                        });
                        filldate.add(interval, 'minutes');
                    }
                    var combobox = new Combobox({
                        options: comboboxOptions,
                        dropdownClass: 'calendaredit',
                        input: self.nodes.timeField,
                        label: self.options.a11y.timeLabel
                    });
                    self.nodes.timeField.replaceWith(combobox.$el.addClass('combobox'));
                    combobox.render();
                    self.nodes.timeField.on('change', _.bind(self.updateModel, self)).on('click', function () {
                        self.trigger('click:time');
                    });
                    self.toggleTimeInput(!self.isFullTime());

                    def.resolve();
                });
            }

            def.then(function () {
                // insert initial values
                self.updateView();
                self.nodes.dayField.on(self.mobileMode ? 'input' : 'change', _.bind(self.updateModel, self));
            });

            return this;
        },

        getFallback: function () {
            return this.model.get('zone') ? 'UTC' : moment().tz();
        },

        updateView: function () {
            var timestamp;
            if (!this.chronos) {
                // clear if set to null
                if (_.isNull(this.model.get(this.attribute))) {
                    this.nodes.dayField.val('');
                    if (this.nodes.timeField) this.nodes.timeField.val('');
                }
                timestamp = parseInt(this.model.getDate ? this.model.getDate(this.attribute, { fulltime: this.isFullTime() }) : this.model.get(this.attribute), 10);
                if (_.isNaN(timestamp)) return;
                timestamp = moment.tz(timestamp, this.model.get(this.options.timezoneAttribute) || this.getFallback());
            } else {
                timestamp = this.model.getMoment(this.attribute);
            }

            if (!this.mobileMode) {
                this.nodes.timeField.val(timestamp.format('LT'));
                this.nodes.timezoneField.text(timestamp.zoneAbbr());
            }

            this.toggleTimeInput(!this.isFullTime());
            this.nodes.dayField.val(this.getDateStr(timestamp));

            // trigger change after all fields are updated, not before. Otherwise we update the model with a wrong time value
            if (!this.mobileMode) this.nodes.dayField.trigger('change');
        },

        updateModel: function () {
            var time = this.getTimestamp();
            // events must have a time, set to previous time if user tries to set to null
            // note: requires attribute does not work in all browsers, that's why we use this solution
            if (this.chronos && (time === null || time === undefined)) {
                this.updateView();
                return;
            }

            if (this.chronos || _.isNull(time) || _.isNumber(time)) {
                var params = { validate: true, fulltime: this.isFullTime() };
                this.model[this.model.setDate ? 'setDate' : 'set'](this.attribute, time, params);
                this.model.trigger('valid');
            } else {
                this.model.trigger('invalid:' + this.attribute, [gt('Please enter a valid date')]);
            }
        },

        isFullTime: function () {
            if (!this.options.ignoreToggle && (this.model.has('full_time'))) {
                return !!(this.model.get('full_time'));
            } else if (this.chronos) {
                return util.isAllday(this.model);
            }
            return this.options.display === 'DATE';
        },

        getDateStr: function (val) {

            if (val === undefined || val === null) return '';

            if (this.mobileMode) {
                if (this.isFullTime()) return val.format('YYYY-MM-DD');
                return val.format('YYYY-MM-DDTHH:mm');
            }
            return val.format('l');
        },

        getTimestamp: function () {
            var dateStr = this.nodes.dayField.val(),
                formatStr = 'l',
                autofill = false;

            // empty?
            if (dateStr === '') {
                // so there is a filled time string  and we have no valid attribute in model already?-> insert today day as dateStr
                if (!this.mobileMode && !this.model.get(this.attribute) && !this.isFullTime() && this.nodes.timeField && this.nodes.timeField.val() !== '') {
                    dateStr = moment().format('l');
                    autofill = true;
                } else {
                    return null;
                }
            }

            if (this.mobileMode) {
                if (this.isFullTime()) formatStr = 'YYYY-MM-DD';
                formatStr = 'YYYY-MM-DDTHH:mm';
            } else if (!this.isFullTime()) {
                // change format string for datetime if timefield is present
                formatStr += ' ' + 'LT';
                if (this.nodes.timeField && this.nodes.timeField.val() !== '') {
                    dateStr += ' ' + this.nodes.timeField.val();
                } else {
                    formatStr = 'l';
                }
            }

            // parse string to timestamp
            var parsedDate = moment.tz(dateStr, formatStr, this.chronos ? this.model.get(this.attribute).tzid || moment().tz() : this.model.get(this.options.timezoneAttribute) || this.getFallback());
            if (autofill && parsedDate.valueOf() < _.now()) parsedDate.add(1, 'day');

            if (this.chronos) {
                if (this.isFullTime()) return { value: parsedDate.format('YYYYMMDD') };
                return { value: parsedDate.format('YYYYMMDD[T]HHmmss'), tzid: this.model.get(this.attribute).tzid || moment().tz() };
            }
            // on parse error return null
            return !parsedDate ? undefined : parsedDate.valueOf();
        },

        onError: function (messages) {
            var self = this;
            this.onValid();
            this.$el.addClass('error');
            this.nodes.helpBlock = $('<div class="help-block error">');
            _(messages).each(function (msg) {
                self.nodes.helpBlock.append($.txt(msg));
            });
            this.$el.append(this.nodes.helpBlock);
        },

        // remove error message
        onValid: function () {
            if (this.nodes.helpBlock) {
                this.nodes.helpBlock.remove();
                delete this.nodes.helpBlock;
                this.$el.removeClass('error');
            }
        },

        clickTimezone: function () {
            this.trigger('click:timezone');
        },

        // toggle time input fields
        toggleTimeInput: function (show) {
            if (this.mobileMode) {
                // prevent flickering
                if ((show && this.nodes.dayField.attr('type') === 'datetime-local') || (!show && this.nodes.dayField.attr('type') === 'date')) return;
                this.nodes.dayField.attr('type', show ? 'datetime-local' : 'date');
            } else {
                // prevent flickering
                if ((show && !this.$el.hasClass('dateonly')) || (!show && this.$el.hasClass('dateonly'))) return;
                this.$el.toggleClass('dateonly', !show);
                this.nodes.timeField.add(this.nodes.timezoneField).css('display', show ? '' : 'none');
            }
        }
    });

    return DatePickerView;
});
