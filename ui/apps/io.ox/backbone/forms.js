/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/backbone/forms',
    ['io.ox/core/extensions',
     'io.ox/core/event',
     'io.ox/core/date',
     'settings!io.ox/calendar',
     'gettext!io.ox/core',
     'less!io.ox/backbone/forms.less'
    ], function (ext, Events, date, settings, gt) {

    'use strict';

    // Error Alert

    function ErrorAlert(options) {
        _.extend(this, {

            tagName: 'div',
            className: 'error-alerts',

            init: function () {
                var self = this;

                function showBackendError(error, xhr) {
                    if (!self.isRelevant(error, xhr)) {
                        return;
                    }
                    var alert = $.alert(self.errorTitle, self.formatError(error));
                    self.$el.find('.alert').remove();
                    self.$el.append(alert);

                    alert.find('.close').on('click', function () {
                        alert.remove();
                    });
                }

                this.observeModel('backendError', showBackendError);
            },

            isRelevant: function () {
                return true;
            },

            errorTitle: gt('An error occurred'),

            formatError: function (error) {
                return error.error || gt('An error occurred. Please try again later');
            }

        }, options || {});
    }

    // Control Group
    function ControlGroup(options) {

        this.tagName = 'div';

        this.init = function () {
            this.nodes = {};
        };

        this.buildControlGroup = function () {
            if (this.nodes.controlGroup) {
                return this.nodes.controlGroup;
            }
            this.buildControls();

            this.nodes.controlGroup = $('<div class="form-group">').appendTo(this.$el);
            this.nodes.controlGroup.append(
                this.buildLabel(),
                this.buildControls()
            );
        };

        this.buildControls = function () {
            return this.nodes.controls || (this.nodes.controls = $('<div>').addClass(options.controlCssClass).append(this.buildElement()));
        };

        this.buildLabel = function () {
            return this.nodes.label || (this.nodes.label = $('<label class="control-label" for="' + this.attribute + '">').addClass(options.labelCssClass).text(this.label));
        };

        this.buildElement = function () {
            var self = this;
            if (this.nodes.element) {
                return this.nodes.element;
            }
            this.nodes.element = $(this.control).addClass('control');
            this.nodes.element.on('change', function () {
                self.updateModel();
            });

            return this.nodes.element;
        };

        this.setValueInElement = function (valueFromModel) {
            this.nodes.element.val(valueFromModel);
        };

        this.setValueInModel = function (valueFromElement) {
            this.model.set(this.attribute, valueFromElement, {validate: true});
        };

        this.updateElement = function () {
            this.setValueInElement(this.model.get(this.attribute));
        };

        this.updateModel = function () {
            this.setValueInModel(this.nodes.element.val());
        };

        this.removeError = function () {
            this.nodes.controlGroup.removeClass('error');
            this.nodes.controls.find('.help-block.error').remove();
        };

        this.handleRareModelChange = function () {
            if (this.model.isSet(this.attribute)) {
                this.nodes.controlGroup.show();
            }
        };

        this.render = function () {
            this.buildControlGroup();
            this.updateElement();
            if (this.rare && !this.model.isSet(this.attribute)) {
                this.nodes.controlGroup.hide();
            }
        };

        this.onValidationError = function (messages) {
            this.removeError();
            var helpBlock =  $('<div class="help-block error">');
            _(messages).each(function (msg) {
                helpBlock.append($.txt(msg));
            });
            this.nodes.controlGroup.addClass('error');
            this.nodes.controls.append(helpBlock);
            if (this.nodes.element) this.nodes.element.select();
        };

        this.modelEvents = {};

        if (options.rare) {
            this.modelEvents['change:' + options.attribute] = 'handleRareModelChange updateElement';
        } else {
            this.modelEvents['change:' + options.attribute] = 'updateElement';
        }

        this.rare = options.rare;

        this.modelEvents['invalid:' + options.attribute] = 'onValidationError';
        this.modelEvents['valid:' + options.attribute] = 'removeError';

        _.extend(this, options); // May override any of the above aspects
    }

    function SelectControlGroup(options) {
        _.extend(this, new ControlGroup(options), {
            buildElement: function () {
                var self = this;
                if (this.nodes.element) {
                    return this.nodes.element;
                }

                this.nodes.element = $('<select tabindex="1">').addClass('form-control');
                _(this.selectOptions).each(function (label, value) {
                    self.nodes.element.append(
                        $('<option>', {value: value}).text(label)
                    );
                });

                this.nodes.element.on('change', function () {
                    self.updateModel();
                });

                return this.nodes.element;
            }
        }, options);
    }

    function addErrorHandling(options, object) {
        if (!object.modelEvents) {
            object.modelEvents = {};
        }
        object.modelEvents['invalid:' + options.attribute] = 'showError';
        object.modelEvents['valid:' + options.attribute] = 'clearError';

        _.extend(object, {
            showError: function (messages) {
                this.$el.find('.help-block').remove();
                var helpBlock = $('<div class="help-block error">');
                _(messages).each(function (msg) {
                    helpBlock.append($.txt(msg));
                });
                this.$el.append(helpBlock);
                this.$el.addClass('error');
            },
            clearError: function () {
                this.$el.removeClass('error');
                this.$el.find('.help-block').remove();
            }
        });

        return object;
    }

    function InputField(options) {
        options = _.extend({
            changeAppTitleOnKeyUp: false
        }, options);
        var modelEvents = {};
        modelEvents['change:' + options.attribute] = 'updateInputField';
        var basicImplementation = {
            tagName: 'div',
            render: function () {
                this.nodes = {};
                var guid = _.uniqueId('form-control-label-');
                this.$el.append(
                    $('<label>').addClass(this.labelClassName || '').attr('for', guid).text(this.label),
                    this.nodes.inputField = $(this.control || '<input type="text">').attr('id', guid)
                );
                this.nodes.inputField
                    .val(this.model.get(this.attribute))
                    .addClass('form-control')
                    .attr({ tabindex: 1 });
                if (options.changeAppTitleOnKeyUp) {
                    this.nodes.inputField.on('keyup', $.proxy(function () {
                        this.model.trigger('keyup:' + this.attribute, this.model, this.nodes.inputField.val());
                    }, this));
                }
                this.nodes.inputField.on('change', _.bind(this.updateModel, this));
            },
            modelEvents: modelEvents,
            updateInputField: function () {
                this.nodes.inputField.val(this.model.get(this.attribute));
            },
            updateModel: function () {
                this.model.set(this.attribute, this.nodes.inputField.val(), {validate: true});
            }

        };

        _.extend(this, addErrorHandling(options, basicImplementation), options);
    }

    function CheckBoxField(options) {
        var modelEvents = {};
        modelEvents['change:' + options.attribute] = 'updateCheckbox';

        var basicImplementation = {
            tagName: 'div',
            modelEvents: modelEvents,
            render: function () {
                var self = this;
                this.nodes = {};
                if (this.header) {
                    this.$el.append($('<label>').addClass(this.headerClassName || '').text(this.header));
                }
                this.$el.append(
                        $('<label class="checkbox">')
                        .addClass(this.labelClassName || '')
                        .append(
                            this.nodes.checkbox = $('<input tabindex="1" type="checkbox">'),
                            this.label
                        )
                );
                if (this.model.get(this.attribute)) {
                    this.nodes.checkbox.prop('checked', true);
                }
                this.nodes.checkbox.prop('checked', this.model.get(this.attribute));
                this.nodes.checkbox.on('change', function () {
                    self.model.set(self.attribute, self.nodes.checkbox.prop('checked'), {validate: true});
                });
            },
            updateCheckbox: function () {
                this.nodes.checkbox.prop('checked', this.model.get(this.attribute));
            }
        };

        _.extend(this, addErrorHandling(options, basicImplementation), options);
    }

    function SelectBoxField(options) {
        var modelEvents = {};
        modelEvents['change:' + options.attribute] = 'updateChoice';
        var basicImplementation = {
            tagName: 'div',
            modelEvents: modelEvents,
            render: function () {
                var self = this;
                this.nodes = {};
                this.nodes.select = $('<select class="form-control" tabindex="1">');
                if (options.multiple) {
                    this.nodes.select.prop('multiple', true);
                }
                _(this.selectOptions).each(function (label, value) {
                    self.nodes.select.append(
                        $('<option>', {value: value}).text(label)
                    );
                });
                this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label).append(this.nodes.select));
                this.updateChoice();
                this.nodes.select.on('change', function () {
                    self.model.set(self.attribute, self.nodes.select.val(), {validate: true});
                });
            },
            updateChoice: function () {
                this.nodes.select.val(this.model.get(this.attribute));
            }
        };

        _.extend(this, addErrorHandling(options, basicImplementation), options);
    }
    /**
     * Generates a section title with a <label> element
     */
    function SectionLegend(options) {
        _.extend(this, {
            tagName: 'div',
            render: function () {
                this.nodes = {};
                this.$el.append(this.nodes.legend = $('<legend>').text(this.label).addClass('sectiontitle'));
            }
        }, options);
    }

    function Header(options) {
        _.extend(this, {
            tagName: 'div',
            render: function () {
                this.$el.append($('<div>').append(
                      $('<h1>').text(options.label)
                  ));
            }
        }, options);
    }

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
                    this.nodes.controlGroup = $('<div class="control-group">').append(
                        $('<label>').addClass(options.labelClassName || '').text(this.label),
                        $('<div class="form-inline">').append(
                            function () {
                                self.nodes.dayField = $('<input type="text" tabindex="1" class="form-control datepicker-day-field">');
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
                                    return [self.nodes.dayField];
                                } else {
                                    if (options.display === 'DATE') {
                                        return [self.nodes.dayField, '&nbsp;', self.nodes.timezoneField];
                                    } else if (options.display === 'DATETIME') {

                                        self.nodes.timeField = $('<input type="text" tabindex="1" class="form-control">');
                                        if (self.model.get('full_time')) {
                                            self.nodes.timeField.hide();
                                            self.nodes.timezoneField.hide();
                                        }
                                        return [self.nodes.dayField, '&nbsp;', self.nodes.timeField, '&nbsp;', self.nodes.timezoneField];
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
                        todayBtn: true
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
                                self.model.set(self.attribute, null);
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
                        interval = parseInt(settings.get('interval'), 10);
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
                    this.model.set(this.attribute, time, {validate: true});
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
                if (mobileMode) {
                    if (this.model.get('full_time')) {
                        this.nodes.dayField.mobiscroll('option', 'timeWheels', '');//remove the timewheels
                        this.nodes.dayField.mobiscroll('option', 'timeFormat', '');//remove the timeFormat
                        this.nodes.timezoneField.hide();
                    } else {
                        this.nodes.dayField.mobiscroll('option', 'timeWheels', this.mobileSet.timeWheels);//add the timewheels again
                        this.nodes.dayField.mobiscroll('option', 'timeFormat', this.mobileSet.timeFormat);//add the timeFormat again
                        this.nodes.timezoneField.show();
                    }
                } else {
                    if (this.model.get('full_time')) {
                        this.nodes.timeField.hide();
                        this.nodes.timezoneField.hide();
                    } else {
                        this.nodes.timeField.css('display', '');
                        this.nodes.timezoneField.css('display', '');
                    }
                }
            },

            modelEvents: modelEvents

        }, options);
    }

    var forms = {
        ErrorAlert: ErrorAlert,
        ControlGroup: ControlGroup,
        SelectControlGroup: SelectControlGroup,
        Header: Header,
        InputField: InputField,
        CheckBoxField: CheckBoxField,
        SelectBoxField: SelectBoxField,
        SectionLegend: SectionLegend,
        DatePicker: DatePicker
    };

    return forms;
});
