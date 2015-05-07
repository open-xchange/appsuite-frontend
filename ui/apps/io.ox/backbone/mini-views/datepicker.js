/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/backbone/mini-views/datepicker', [
    'settings!io.ox/calendar',
    'gettext!io.ox/core',
    'less!io.ox/backbone/mini-views/datepicker'
], function (settings, gt) {

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
                label: ''
            }, options);

            this.attribute = this.options.attribute;
            this.nodes = {};
            this.mobileSettings = {};
            this.mobileMode = _.device('smartphone');

            this.listenTo(this.model, 'change:' + this.attribute, this.updateView);
            this.listenTo(this.model, 'invalid:' + this.attribute, this.onError);
            this.listenTo(this.model, 'valid', this.onValid);
            this.listenTo(this.model, 'change:' + this.options.timezoneAttribute, this.updateView);
        },

        events: {
            'click .timezone button': 'clickTimezone'
        },

        render: function () {
            var self = this,
                def = $.Deferred();

            this.$el.addClass('dateinput').append(
                $('<legend>').addClass('simple control-label').text(this.options.label),
                $('<div class="input-group form-inline">').append(
                    function () {
                        // render date input
                        var guid = _.uniqueId('form-control-label-'),
                            ariaID = guid + '-aria',
                            dayFieldLabel = $('<label class="sr-only">').attr('for', guid).text(gt('Date') + ' (' + moment.localeData().longDateFormat('l') + ')'),
                            timezoneContainer;

                        self.nodes.dayField = $('<input type="text" tabindex="1" class="form-control datepicker-day-field">').attr({
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
                        guid = _.uniqueId('form-control-label-');
                        self.nodes.timeField = $('<input class="form-control time-field">').attr({
                            type: 'text',
                            tabindex: 1,
                            id: guid,
                            'aria-describedby': guid + '-aria'
                        });

                        // render timezone badge
                        var timezoneAbbreviation = gt.noI18n(moment.tz(self.model.get(self.options.timezoneAttribute)).zoneAbbr());

                        if (self.options.timezoneButton && !self.mobileMode) {
                            timezoneContainer = $('<div class="timezone input-group-btn">').append(
                                self.nodes.timezoneField = $('<button class="btn btn-default" tabindex="1" type="button">').text(timezoneAbbreviation)
                            );
                        } else {
                            timezoneContainer = self.nodes.timezoneField = $('<div class="timezone input-group-addon">').text(timezoneAbbreviation);
                            if (self.model.has('start_date') && self.model.has('end_date')) {
                                require(['io.ox/calendar/util'], function (calendarUtil) {
                                    calendarUtil.addTimezonePopover(timezoneContainer, self.model.attributes, { placement: 'top' });
                                });
                            }
                        }

                        // add a11y
                        self.nodes.a11yDate = $('<p>')
                            .attr({ id: ariaID })
                            .addClass('sr-only')
                            .text(gt('Use cursor keys to change the date. Press ctrl-key at the same time to change year or shift-key to change month. Close date-picker by pressing ESC key.'));
                        self.nodes.a11yTime = $('<p>')
                            .attr({ id: guid + '-aria' })
                            .addClass('sr-only')
                            .text(gt('Use up and down keys to change the time. Close selection by pressing ESC key.'));

                        return [
                            self.nodes.dayField,
                            dayFieldLabel,
                            self.nodes.a11yDate,
                            self.nodes.timeField,
                            $('<label class="sr-only">').attr('for', guid).text(gt('Time') + ' (' + moment.localeData().longDateFormat('LT') + ')'),
                            self.nodes.a11yTime,
                            timezoneContainer
                        ];
                    }
                )
            );

            if (this.mobileMode) {
                require(['io.ox/core/tk/mobiscroll'], function (mobileSettings) {

                    self.mobileSettings = mobileSettings;

                    if (self.options.clearButton) {
                        self.mobileSettings.buttons = ['set', 'clear', 'cancel'];
                    }
                    if (!self.isFullTime()) {
                        self.mobileSettings.preset = 'datetime';
                    }

                    // initialize mobiscroll plugin
                    self.nodes.dayField.mobiscroll(mobileSettings);
                    self.nodes.dayField.on('change', _.bind(self.updateModel, self));

                    def.resolve();
                });
            } else {
                require(['io.ox/core/tk/datepicker'], function () {
                    // get the right date format and init datepicker
                    self.nodes.dayField.datepicker({
                        clearBtn: self.options.clearButton,
                        parentEl: self.$el
                    }).on('clearDate', function () {
                        // clear the timefield too if the clearbutton is pressed
                        self.nodes.timeField.val('');
                    });

                    // build and init timepicker based on combobox plugin
                    var hours_typeahead = [],
                        filldate = moment().startOf('day'),
                        interval = parseInt(settings.get('interval'), 10) || 30;
                    for (var i = 0; i < 1440; i += interval) {
                        hours_typeahead.push(filldate.format('LT'));
                        filldate.add(interval, 'minutes');
                    }

                    var comboboxHours = {
                        source: hours_typeahead,
                        items: hours_typeahead.length,
                        menu: '<ul class="typeahead dropdown-menu calendaredit"></ul>',
                        sorter: function (items) {
                            items = _(items).sortBy(function (item) {
                                return +moment(item, 'LT');
                            });
                            return items;
                        }
                    };

                    self.nodes.timeField.combobox(comboboxHours).addClass('');
                    self.nodes.timeField.on('change', _.bind(self.updateModel, self));
                    self.toggleTimeInput(self.options.display === 'DATETIME');

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
            var timestamp = parseInt(this.model[this.model.getDate ? 'getDate' : 'get'](this.attribute), 10);
            if (_.isNaN(timestamp)) return;
            timestamp = moment.tz(timestamp, this.model.get(this.options.timezoneAttribute));
            if (!this.mobileMode) {
                this.nodes.timeField.val(timestamp.format('LT'));
                this.nodes.dayField.datepicker('update', this.getDateStr(timestamp));
                this.nodes.timezoneField.text(gt.noI18n(timestamp.zoneAbbr()));
            } else {
                this.nodes.dayField.val(this.getDateStr(timestamp));
            }
        },

        updateModel: function () {
            var time = this.getTimestamp();
            if (_.isNull(time) || _.isNumber(time)) {
                this.model[this.model.setDate ? 'setDate' : 'set'](this.attribute, time, { validate: true });
                this.model.trigger('valid');
            } else {
                this.model.trigger('invalid:' + this.attribute, [gt('Please enter a valid date')]);
            }
        },

        isFullTime: function () {
            if (!this.options.ignoreToggle && this.model.has('full_time')) {
                return !!this.model.get('full_time');
            } else {
                return this.options.display === 'DATE';
            }
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
            if (dateStr === '')  return null;

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
            var parsedDate = moment.tz(dateStr, formatStr, this.model.get(this.options.timezoneAttribute));
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
                this.nodes.dayField.mobiscroll('option', { preset: show ? 'datetime' : 'date' });
            } else {
                this.$el.toggleClass('dateonly', !show);
                this.nodes.timeField.add(this.nodes.timezoneField).css('display', show ? '' : 'none');
            }
        }
    });

    return DatePickerView;
});
