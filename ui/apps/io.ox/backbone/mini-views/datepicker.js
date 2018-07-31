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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
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
                def = $.Deferred();

            this.$el.addClass('dateinput').toggleClass('mobile-mode', self.mobileMode).append(
                $('<legend>').addClass('simple control-label').text(this.options.label),
                $('<div class="input-group form-inline">').append(
                    function () {
                        // render date input
                        var guid = _.uniqueId('form-control-label-'),
                            ariaID = guid + '-aria',
                            dayFieldLabel = $('<label class="sr-only">').attr('for', guid).text(gt('Date') + ' (' + moment.localeData().longDateFormat('l') + ')'),
                            timezoneContainer;

                        self.nodes.dayField = $('<input type="text" class="form-control datepicker-day-field">').attr({
                            id: guid,
                            'aria-describedby': ariaID
                        });

                        if (self.mobileMode) {
                            // render date input only on mobile devices
                            return [
                                dayFieldLabel,
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
                            dayFieldLabel,
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
                require(['io.ox/core/tk/mobiscroll'], function (mobileSettings) {

                    //don't overwrite default settings (see Bug 38847)
                    self.mobileSettings = _.copy(mobileSettings);

                    if (self.options.clearButton) {
                        self.mobileSettings.buttons = ['set', 'clear', 'cancel'];
                    }
                    if (!self.isFullTime()) {
                        self.mobileSettings.preset = 'datetime';
                    }

                    // initialize mobiscroll plugin
                    self.nodes.dayField.mobiscroll(self.mobileSettings);
                    def.resolve();
                });
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
                self.nodes.dayField.on('change', _.bind(self.updateModel, self));
            });

            return this;
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
                timestamp = moment.tz(timestamp, this.model.get(this.options.timezoneAttribute));
            } else {
                timestamp = this.model.getMoment(this.attribute);
            }
            this.nodes.dayField.val(this.getDateStr(timestamp));
            if (!this.mobileMode) {
                this.nodes.timeField.val(timestamp.format('LT'));
                this.nodes.timezoneField.text(timestamp.zoneAbbr());
            }
            // trigger change after all fields are updated, not before. Otherwise we update the model with a wrong time value
            if (!this.mobileMode) this.nodes.dayField.trigger('change');
            this.updateModel();
        },

        updateModel: function () {
            var time = this.getTimestamp();
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
            if (!this.isFullTime() && this.mobileMode) {
                return val.format('l') + ' ' + val.format('LT');
            }
            return val.format('l');
        },

        getTimestamp: function () {
            var dateStr = this.nodes.dayField.val(),
                formatStr = 'l';

            // empty?
            if (dateStr === '') return null;

            // change format string for datetime if timefield is present
            if (!this.isFullTime()) {
                formatStr += ' ' + 'LT';
                if (!this.mobileMode) {
                    if (this.nodes.timeField && this.nodes.timeField.val() !== '') {
                        dateStr += ' ' + this.nodes.timeField.val();
                    } else {
                        formatStr = 'l';
                    }
                }
            }

            // parse string to timestamp
            var parsedDate = moment.tz(dateStr, formatStr, this.chronos ? this.model.get(this.attribute).tzid || moment().tz() : this.model.get(this.options.timezoneAttribute));
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
                // mobiscroll may not be initialized yet, due to async loading.
                if (this.nodes.dayField.mobiscroll) {
                    this.nodes.dayField.mobiscroll('option', { preset: show ? 'datetime' : 'date' });
                }
            } else {
                this.$el.toggleClass('dateonly', !show);
                this.nodes.timeField.add(this.nodes.timezoneField).css('display', show ? '' : 'none');
            }
        }
    });

    return DatePickerView;
});
