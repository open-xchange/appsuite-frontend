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
    'io.ox/core/date',
    'settings!io.ox/calendar',
    'gettext!io.ox/core'
], function (date, settings, gt) {

    'use strict';

    // Bootstrap DatePicker

    function DatePicker(options) {
        options = _.extend({
            required: true,
            display: 'DATETIME',
            utc: false,
            clearButton: false
        }, options);

        var BinderUtils = {
            _toDate: function (value, attribute, model) {
                if (value === undefined || value === null || value === '') {//dont use !value or 0 will result in false
                    return null;
                }
                if (!_.isNumber(value)) {
                    return value; //do nothing
                }
                if (model.get('full_time')) {
                    value = date.Local.utc(value);
                    if (attribute === 'end_date') {
                        value -= date.DAY;
                    }
                }
                if (options.utc) {
                    value = date.Local.utc(value);
                }

                var mydate = parseInt(value, 10);
                if (_.isNull(mydate)) {
                    return value;
                }
                mydate = new date.Local(mydate);
                if (options.display === 'DATETIME' && _.device('small') && !model.get('full_time')) {
                    return mydate.format(date.DATE) + ' ' + mydate.format(date.TIME);
                } else {
                    return mydate.format(date.DATE);
                }
            },

            _toTime: function (value) {
                if (value === undefined || value === null || value === '') {//dont use !value or 0 will result in false
                    return null;
                }
                var myTime = new date.Local(parseInt(value, 10));

                if (_.isNull(myTime)) {
                    return value;
                }

                return new date.Local(myTime).format(date.TIME);
            },

            _timeStrToDate: function (value, attribute, model) {
                var myValue = parseInt(model.get(attribute), 10);
                if (isNaN(myValue)) {
                    return value;
                }
                var parsedDate = date.Local.parse(value.toUpperCase(), date.TIME);
                if (_.isNull(parsedDate)) {
                    // trigger validate error
                    return undefined;
                }
                return new date.Local(myValue).setHours(parsedDate.getHours(), parsedDate.getMinutes(), parsedDate.getSeconds()).getTime();
            },

            _dateStrToDate: function (value, attribute, model) {
                var myValue = parseInt(model.get(attribute), 10),
                    formatStr = date.DATE;

                if (value === '' && !options.required) {
                    return null;
                }

                if (isNaN(myValue)) {
                    myValue = new date.Local().setHours(0, 0, 0, 0).getTime();
                }

                // change format string for mobiscroll
                if (options.display === 'DATETIME' && _.device('small') && !model.get('full_time')) {
                    formatStr = date.getFormat(date.DATE) + ' ' + date.getFormat(date.TIME);
                }

                var parsedDate = date.Local.parse(value, formatStr);

                if (_.isNull(parsedDate)) {
                    return value;
                }

                // fulltime utc workaround
                if (model.get('full_time')) {
                    return attribute === 'end_date' ? parsedDate.local + date.DAY : parsedDate.local;
                }

                if (options.utc) {
                    return parsedDate.local;
                }

                if (options.display !== 'DATETIME' || !_.device('small') || model.get('full_time')) {
                    parsedDate = new date.Local(myValue).setYear(parsedDate.getYear(), parsedDate.getMonth(), parsedDate.getDate());
                }

                return parsedDate.getTime();
            }
        };

        //customize datepicker
        //just localize the picker, use en as default with current languages
        $.fn.datepicker.dates.en = {
            days: date.locale.days,
            daysShort: date.locale.daysShort,
            daysMin: date.locale.daysStandalone,
            months: date.locale.months,
            monthsShort: date.locale.monthsShort,
            today: gt('Today')
        };

        var mobileMode = _.device('small'),
            modelEvents = {};
        modelEvents['change:' + options.attribute] = 'setValueInField';
        modelEvents['invalid:' + options.attribute] = 'showError';
        modelEvents.valid = 'removeError';
        modelEvents['change:full_time'] = 'onFullTimeChange';
        _.extend(this, {
            tagName: 'div',
            render: function () {
                var self = this;
                this.nodes = {};
                this.mobileSet = {};
                this.$el.append(
                    this.nodes.controlGroup = $('<fieldset>').append(
                        $('<legend>').addClass(options.labelClassName || '').text(this.label),
                        $('<div class="form-inline">').append(
                            function () {
                                var guid = _.uniqueId('form-control-label-');
                                self.nodes.dayFieldLabel = $('<label class="sr-only">').attr('for', guid).text(gt('Date'));
                                self.nodes.dayField = $('<input type="text" tabindex="1" class="form-control datepicker-day-field">').attr('id', guid);
                                if (options.initialStateDisabled) {
                                    self.nodes.dayField.prop('disabled', true);
                                }

                                if (options.display === 'DATETIME') {
                                    self.nodes.timezoneField = $('<span class="label label-default">');
                                    if (self.model.get(self.attribute)) {
                                        self.nodes.timezoneField.text(gt.noI18n(date.Local.getTTInfoLocal(self.model.get(self.attribute)).abbr));
                                    } else {
                                        self.nodes.timezoneField.text(gt.noI18n(date.Local.getTTInfoLocal(_.now()).abbr));
                                    }
                                }

                                if (mobileMode) {
                                    self.nodes.dayField.toggleClass('input-medium', 'input-sm');
                                    return [self.nodes.dayFieldLabel, self.nodes.dayField];
                                } else {
                                    if (options.display === 'DATE') {
                                        return [self.nodes.dayFieldLabel, self.nodes.dayField, '&nbsp;', self.nodes.timezoneField];
                                    } else if (options.display === 'DATETIME') {
                                        guid = _.uniqueId('form-control-label-');
                                        self.nodes.timeFieldLabel = $('<label class="sr-only">').attr('for', guid).text(gt('Time'));
                                        self.nodes.timeField = $('<input type="text" tabindex="1" class="form-control">').attr('id', guid).attr({
                                            'aria-label': gt('Use up and down keys to change the time. Close selection by pressing ESC key.')
                                        });
                                        if (self.model.get('full_time')) {
                                            self.nodes.timeField.hide();
                                            self.nodes.timezoneField.hide();
                                        }
                                        return [self.nodes.dayFieldLabel, self.nodes.dayField, '&nbsp;', self.nodes.timeFieldLabel, self.nodes.timeField, '&nbsp;', self.nodes.timezoneField];
                                    }
                                }
                            }
                        )
                    )
                );

                this.setValueInField();

                if (!mobileMode) {
                    // get the right date format
                    var dateFormat = date.getFormat(date.DATE).replace(/\by\b/, 'yyyy').toLowerCase();
                    this.nodes.dayField.attr({
                        'aria-label': gt('Use cursor keys to change the date. Press ctrl-key at the same time to change year or shift-key to change month. Close date-picker by pressing ESC key.')
                    }).datepicker({
                        format: dateFormat,
                        weekStart: date.locale.weekStart,
                        parentEl: self.nodes.controlGroup,
                        todayHighlight: true,
                        todayBtn: 'linked',//today button should insert the date when clicked. See 34381
                        autoclose: true
                    });
                } else {
                    require(['io.ox/core/tk/mobiscroll'], function (defaultSettings) {
                        //do funky mobiscroll stuff
                        if (options.display === 'DATETIME') {
                            self.nodes.dayField.mobiscroll().datetime(defaultSettings);
                        } else {
                            self.nodes.dayField.mobiscroll().date(defaultSettings);
                        }
                        // self.nodes.dayField.mobiscroll('option', 'dateOrder', 'dmy');
                        if (options.clearButton) {//add clear button
                            self.nodes.dayField.mobiscroll('option', 'button3Text', gt('clear'));
                            self.nodes.dayField.mobiscroll('option', 'button3', function () {
                                self.model.set(self.attribute, null, { validate: true });
                                self.nodes.dayField.mobiscroll('hide');
                            });
                        }

                        self.nodes.dayField.val = function (value) {//repairing functionality
                            if (arguments.length > 0) {
                                this['0'].value = value;
                            } else {
                                return this['0'].value;
                            }
                        };
                        self.mobileSet = defaultSettings;
                    });
                }

                if (!mobileMode && options.display === 'DATETIME') {
                    var hours_typeahead = [],
                        filldate = new date.Local().setHours(0, 0, 0, 0),
                        interval = parseInt(settings.get('interval'), 10) || 30;
                    for (var i = 0; i < 1440; i += interval) {
                        hours_typeahead.push(filldate.format(date.TIME));
                        filldate.add(interval * date.MINUTE);
                    }

                    var comboboxHours = {
                        source: hours_typeahead,
                        items: hours_typeahead.length,
                        menu: '<ul class="typeahead dropdown-menu calendaredit"></ul>',
                        sorter: function (items) {
                            items = _(items).sortBy(function (item) {
                                var pd = date.Local.parse(item, date.TIME);
                                return pd.getTime();
                            });
                            return items;
                        },
                        autocompleteBehaviour: false
                    };

                    this.nodes.timeField.combobox(comboboxHours);
                    this.nodes.timeField.on('change', _.bind(this.updateModelTime, this));
                }

                this.nodes.dayField.on('change', _.bind(this.updateModelDate, this));

                return this;
            },

            setValueInField: function () {
                var value = this.model.get(this.attribute);
                if (options.display === 'DATETIME') {
                    this.nodes.timezoneField.text(gt.noI18n(date.Local.getTTInfoLocal(value || _.now()).abbr));
                }
                this.nodes.dayField.val(BinderUtils._toDate(value, this.attribute, this.model));

                if (!mobileMode && options.display === 'DATETIME') {
                    this.nodes.timeField.val(BinderUtils._toTime(value, this.attribute, this.model));
                }
            },

            updateModelDate: function () {
                this.model.set(this.attribute, BinderUtils._dateStrToDate(this.nodes.dayField.val(), this.attribute, this.model), { validate: true });
            },

            updateModelTime: function () {
                var time = BinderUtils._timeStrToDate(this.nodes.timeField.val(), this.attribute, this.model);
                if (time && _.isNumber(time)) {
                    this.model.set(this.attribute, time, { validate: true });
                    this.model.trigger('valid');
                } else {
                    this.model.trigger('invalid:' + this.attribute, [gt('Please enter a valid date')]);
                }
            },

            showError: function (messages) {
                this.removeError();
                this.nodes.controlGroup.addClass('error');
                var helpBlock =  this.nodes.helpBlock = $('<div class="help-block error">');
                _(messages).each(function (msg) {
                    helpBlock.append($.txt(msg));
                });
                this.$el.append(helpBlock);
            },

            removeError: function () {
                if (this.nodes.helpBlock) {
                    this.nodes.helpBlock.remove();
                    delete this.nodes.helpBlock;
                    this.nodes.controlGroup.removeClass('error');
                }
            },

            onFullTimeChange: function () {
                // toggle time input fields
                var ft = this.model.get('full_time'),
                    // fallback when no separate timefields exist
                    timeField = this.nodes.timeField || $(),
                    timezoneField = this.nodes.timezoneField || $();
                if (mobileMode) {
                    this.nodes.dayField.mobiscroll('option', {
                        timeWheels: ft ? '' : this.mobileSet.timeWheels,
                        timeFormat: ft ? '' : this.mobileSet.timeFormat
                    });
                } else {
                    timeField.css('display', ft ? 'none' : '');
                }
                timezoneField.css('display', ft ? 'none' : '');
            },

            modelEvents: modelEvents

        }, options);
    }

    return DatePicker;
});
