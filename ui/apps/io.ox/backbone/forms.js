/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */


define('io.ox/backbone/forms',
    ['io.ox/core/extensions',
     'io.ox/core/event',
     'io.ox/core/date',
     'gettext!io.ox/core',
     'less!io.ox/backbone/forms.less'], function (ext, Events, date, gt) {

    "use strict";

    // Error Alert

    function ErrorAlert(options) {
        _.extend(this, {

            tagName: 'div',
            className: 'error-alerts',

            init: function () {
                var self = this;

                function showBackendError(error) {
                    if (!self.isRelevant(error)) {
                        return;
                    }
                    var alert = $.alert(self.errorTitle, self.formatError(error));
                    self.$el.append(alert);

                    alert.find('.close').on('click', function () {
                        alert.remove();
                    });
                }

                this.observeModel('backendError', showBackendError);
            },

            isRelevant: function (response) {
                return true;
            },

            errorTitle: gt('An error occurred'),

            formatError: function (error) {
                return error.error || gt("An error occurred. Please try again later");
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

            this.nodes.controlGroup = $('<div class="control-group">').appendTo(this.$el);

            this.nodes.controlGroup.append(
                this.buildLabel(),
                this.buildControls()
            );
        };

        this.buildControls = function () {
            return this.nodes.controls || (this.nodes.controls = $('<div class="controls">').append(this.buildElement()));
        };

        this.buildLabel = function () {
            return this.nodes.label || (this.nodes.label = $('<label class="control-label">').text(this.label));
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
            this.model.set(this.attribute, valueFromElement);
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
            var helpBlock =  $('<div class="help-block error">');
            _(messages).each(function (msg) {
                helpBlock.append($.txt(msg));
            });
            this.nodes.controlGroup.addClass('error');
            this.nodes.controls.append(helpBlock);
            this.nodes.element.select();
        };

        this.modelEvents = {};


        if (options.rare) {
            this.modelEvents['change:' + options.attribute] = 'handleRareModelChange updateElement';
        } else {
            this.modelEvents['change:' + options.attribute] = 'updateElement';
        }

        this.modelEvents['invalid:' + options.attribute] = 'onValidationError';
        this.modelEvents['valid:' + options.attribute] = 'removeError';

        _.extend(this, options); // May override any of the above aspects
    }

    function DateControlGroup(options) {

        this.tagName = 'div';

        this.init = function () {
            this.nodes = {};
        };

        this.buildControlGroup = function () {
            if (this.nodes.controlGroup) {
                return this.nodes.controlGroup;
            }
            this.buildControls();

            this.nodes.controlGroup = $('<div class="control-group">').appendTo(this.$el);

            this.nodes.controlGroup.append(
                this.buildLabel(),
                this.buildControls()
            );
        };

        this.buildControls = function () {
            return this.nodes.controls || (this.nodes.controls = $('<div class="controls">').append(
                    this.buildElement(),
                    this.buildDropElements())
                    );
        };

        this.buildLabel = function () {
            return this.nodes.label || (this.nodes.label = $('<label class="control-label">').text(this.label));
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

        this.buildDropElements = function () {
            var self = this,
                collectedDate = function (submittedValue) {
                var dayValue = self.nodes.dropelements.find('[name="day"]').val(),
                    monthValue = self.nodes.dropelements.find('[name="month"]').val(),
                    yearValue = self.nodes.dropelements.find('[name="year"]').val(),
                    collectedString = new date.Local();

                if (submittedValue === '') {
                    return {formated: '', stamp: ''};
                } else {
                    collectedString.setDate(dayValue);
                    collectedString.setMonth(monthValue);

                    yearValue = (yearValue !== '') ? yearValue : new Date().getFullYear();

                    collectedString.setYear(yearValue);
                    return {formated: collectedString.format(date.DATE), stamp: collectedString};
                }

            },
                createSelect = function (name, from, to) {
                var node = $('<select>').attr({
                    'name': name,
                    'size': 1
                }),
                    arrayOfValues = [];
                if (name === 'month') {
                    arrayOfValues.push($('<option>').text(''));
                    for (var i = from; i <= to; i += 1) {
                        arrayOfValues.push($('<option>').val(i).text(gt.noI18n(date.locale.months[i])));
                    }

                } else if (name === 'day') {
                    arrayOfValues.push($('<option>').text(''));
                    for (var i = from; i <= to; i += 1) {
                        arrayOfValues.push($('<option>').text(i));
                    }
                } else {
                    for (var i = from; i <= to; i += 1) {
                        arrayOfValues.push($('<option>').text(i));
                    }
                    arrayOfValues.push($('<option>').text(''));
                    arrayOfValues.reverse();
                }

                _(arrayOfValues).each(function (val) {
                    node.append(val);
                });

                return node;
            };

            this.nodes.element.css('display', 'none');

            this.nodes.dropelements = $('<span>').append(
                createSelect('day', 1, 31),
                createSelect('month', 0, 11),
                createSelect('year', 1900,  new Date().getFullYear())
            );
            this.nodes.dropelements.on('change', 'select', function () {

                var dateObj = collectedDate($(this).val());
                self.nodes.element.val(dateObj.formated);
                self.nodes.element.data('dateobject', dateObj.stamp);
                self.nodes.element.trigger('change');
            });

            return this.nodes.dropelements;
        };

        this.setValueInElement = function (valueFromModel) {
            this.nodes.element.val(valueFromModel);
        };

        this.setValueInModel = function (valueFromElement) {
            this.model.set(this.attribute, valueFromElement);
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
            var helpBlock =  $('<div class="help-block error">');
            _(messages).each(function (msg) {
                helpBlock.append($.txt(msg));
            });
            this.nodes.controlGroup.addClass('error');
            this.nodes.controls.append(helpBlock);
            this.nodes.element.select();
        };

        this.modelEvents = {};


        if (options.rare) {
            this.modelEvents['change:' + options.attribute] = 'handleRareModelChange updateElement';
        } else {
            this.modelEvents['change:' + options.attribute] = 'updateElement';
        }

        this.modelEvents['invalid:' + options.attribute] = 'onValidationError';
        this.modelEvents['valid:' + options.attribute] = 'removeError';

        _.extend(this, options); // May override any of the above aspects
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
                this.$el.addClass("error");
            },
            clearError: function () {
                this.$el.removeClass("error");
                this.$el.find('.help-block').remove();
            }
        });

        return object;
    }

    function InputField(options) {
        var modelEvents = {};
        modelEvents['change:' + options.attribute] = 'updateInputField';
        var basicImplementation = {
            tagName: 'div',
            render: function () {
                this.nodes = {};
                this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.inputField = $(this.control || '<input type="text">'));
                this.nodes.inputField.val(this.model.get(this.attribute));
                this.nodes.inputField.on('change', _.bind(this.updateModel, this));
            },
            modelEvents: modelEvents,
            updateInputField: function () {
                this.nodes.inputField.val(this.model.get(this.attribute));
            },
            updateModel: function () {
                this.model.set(this.attribute, this.nodes.inputField.val());
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
                        .css('display', 'inline-block')
                        .append(
                            this.nodes.checkbox = $('<input type="checkbox">'),
                            this.label
                        )
                );
                if (this.model.get(this.attribute)) {
                    this.nodes.checkbox.attr({checked: "checked"});
                }
                this.nodes.checkbox.attr('checked', this.model.get(this.attribute));
                this.nodes.checkbox.on('change', function () {
                    self.model.set(self.attribute, self.nodes.checkbox.is(':checked'));
                });
            },
            updateCheckbox: function () {
                if (this.model.get(this.attribute)) {
                    this.nodes.checkbox.attr({checked: "checked"});
                } else {
                    this.nodes.checkbox.removeAttr("checked");
                }
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
                this.nodes.select = $('<select>');
                _(this.selectOptions).each(function (label, value) {
                    self.nodes.select.append(
                        $("<option>", {value: value}).text(label)
                    );
                });
                this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
                this.updateChoice();
                this.nodes.select.on('change', function () {
                    self.model.set(self.attribute, self.nodes.select.val());
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

    // Form Sections made up of horizontal forms

    function Section(options) {
        var self = this;
        _.extend(this, {

            tagName: 'div',
            className: 'section',

            init: function () {
                Events.extend(this);
                this.nodes = {};
            },

            point: function () {
                return ext.point(self.ref);
            },

            render: function () {
                var self = this,
                    anyHidden = false,
                    anyVisible = false;
                this.point().each(function (extension) {
                    if (extension.metadata('hidden', [self.model])) {
                        anyHidden = anyHidden || true;
                    } else {
                        anyVisible = anyVisible || true;
                    }
                });

                // If no extension is visible collapse completely unless overridden
                if (anyVisible && anyHidden) {
                    // Show more / less links
                    this.state = 'mixed';
                } else if (!anyVisible) {
                    // All extensions are hidden -> completely collapse section
                    this.state = 'collapsed';
                } else if (!anyHidden) {
                    // Everything is visible -> leave out more / less links
                    this.state = 'allVisible';
                }

                this.initialState = this.state;

                this.drawHeader();
                this.drawExtensions();

                if (this.state === 'mixed' || this.state === 'collapsed') {
                    this.less();
                }

            },

            more: function () {
                var self = this;
                this.state = 'allVisible';
                this.nodes.toggleLink.text(gt('Show less'));
                if (this.initialState === 'mixed') {
                    // show all
                    this.point().each(function (extension) {
                        if (!extension.metadata('hidden', [self.model])) {
                            return;
                        }
                        if (extension.show) {
                            extension.show();
                        } else {
                            self.nodes.extensionNodes[extension.id].show();
                        }
                    });
                } else if (this.initialState === 'collapsed') {
                    // Show regular header
                    this.nodes.collapsedHeader.hide();
                    this.nodes.header.show();

                    // show extensions
                    this.nodes.extensions.show();
                }
            },

            less: function () {
                var self = this;
                if (this.initialState === 'mixed') {
                    // hide initially hidden
                    this.point().each(function (extension) {
                        if (!extension.metadata('hidden', [self.model])) {
                            return;
                        }
                        if (extension.hide) {
                            extension.hide();
                        } else {
                            self.nodes.extensionNodes[extension.id].hide();
                        }
                    });
                } else if (this.initialState === 'collapsed') {
                    // hide all
                    this.nodes.extensions.hide();

                    // show collapsedHeader
                    this.nodes.collapsedHeader.show();
                    this.nodes.header.hide();
                }

                this.state = this.initialState;
                this.nodes.toggleLink.text(gt('Show more'));
            },

            drawHeader: function () {
                var self = this;

                this.nodes.header = $('<div class="row sectionheader">').appendTo(this.$el);

                $('<a href="#" class="offset2 span4">').text(this.title).on('click', function () {
                    if (self.state === 'mixed') {
                        self.more();
                    } else if (self.state === 'allVisible') {
                        self.less();
                    }
                }).appendTo(this.nodes.header);
                if (this.state === 'allVisible') {
                    return;
                }

                this.nodes.toggleLink = $('<a href="#" class="span6" data-action="toggle-' + options.id + '">').on('click', function () {
                    if (self.state === 'mixed') {
                        self.more();
                    } else if (self.state === 'allVisible') {
                        self.less();
                    }
                });
//                .appendTo(this.nodes.header);

                if (this.state === 'collapsed') {
                    this.nodes.collapsedHeader = $('<div class="row sectionheader collapsed">').appendTo(this.$el);
                    $('<span class="offset2 span4">').append(
                        $('<i class="icon-plus-sign">'),
                        $('<a href="#" data-action="toggle-' + options.id + '">').text(this.title).on('click', function () {
                            self.more();
                        })
                    ).appendTo(this.nodes.collapsedHeader);
                }

            },

            drawExtensions: function () {
                var self = this;
                this.nodes.extensions = this.buildExtensionContainer().appendTo(this.$el);
                this.nodes.extensionNodes = {};

                this.point().each(function (extension) {
                    self.nodes.extensionNodes[extension.id] = $('<div>').appendTo(self.nodes.extensions);
                    extension.invoke('draw', self.nodes.extensionNodes[extension.id], self.options);
                });

            },

            buildExtensionContainer: function () {
                return $(this.container || '<form class="form-horizontal">');
            }
        }, options);

    }

    function DatePicker(options) {
        var BinderUtils = {
            convertDate: function (direction, value, attribute, model) {
                if (direction === 'ModelToView') {
                    return BinderUtils._toDate(value, attribute, model);
                } else {
                    return BinderUtils._dateStrToDate(value, attribute, model);
                }
            },

            convertTime: function (direction, value, attribute, model) {
                if (direction === 'ModelToView') {
                    if (model.get('full_time')) {
                        value = date.Local.utc(value);
                    }
                    return BinderUtils._toTime(value, attribute, model, direction);
                } else {
                    value = BinderUtils._timeStrToDate(value, attribute, model);
                    if (model.get('full_time')) {
                        value = date.Local.localTime(value);
                    }
                    return value;
                }
            },

            numToString: function (direction, value, attribute, model) {
                if (direction === 'ModelToView') {
                    return value + '';
                } else {
                    return parseInt(value, 10);
                }
            },

            _toDate: function (value, attribute, model) {
                if (!value) {
                    return null;
                }
                if (!_.isNumber(value)) {
                    return value; //do nothing
                }
                var mydate = parseInt(value, 10);
                if (_.isNull(mydate)) {
                    return value;
                }
                return new date.Local(mydate).format(date.DATE);
            },

            _toTime: function (value, attribute) {
                if (!value) {
                    return null;
                }
                var myTime = new date.Local(parseInt(value, 10));

                if (_.isNull(myTime)) {
                    return value;
                }
                return new date.Local(myTime).format(date.TIME);
            },

            _timeStrToDate: function (value, attribute, model) {
                var myValue = parseInt(model.get(attribute), 10) || false;
                if (!myValue) {
                    return value;
                }
                var mydate = new date.Local(myValue);
                var parsedDate = date.Local.parse(value, date.TIME);

                if (_.isNull(parsedDate)) {
                    return mydate.getTime();
                }

                if (parsedDate.getTime() === 0) {
                    return model.get(attribute);
                }

                mydate.setHours(parsedDate.getHours());
                mydate.setMinutes(parsedDate.getMinutes());
                mydate.setSeconds(parsedDate.getSeconds());

                return mydate.getTime();
            },

            _dateStrToDate: function (value, attribute, model) {
                var myValue = parseInt(model.get(attribute), 10) || false;
                if (!myValue) {
                    return value;
                }
                var mydate = new date.Local(myValue);
                var parsedDate = date.Local.parse(value, date.DATE);

                if (_.isNull(parsedDate)) {
                    return value;
                }

                // just reject the change, if it's not parsable
                if (parsedDate.getTime() === 0) {
                    return model.get(attribute);
                }

                mydate.setDate(parsedDate.getDate());
                mydate.setMonth(parsedDate.getMonth());
                mydate.setYear(parsedDate.getYear());
                return mydate.getTime();
            }
        };


        //customize datepicker
        //just localize the picker, use en as default with current languages
        $.fn.datepicker.dates.en = {
            "days": date.locale.days,
            "daysShort": date.locale.daysShort,
            "daysMin": date.locale.daysStandalone,
            "months": date.locale.months,
            "monthsShort": date.locale.monthsShort
        };

        var hours_typeahead = [];
        var filldate = new date.Local();
        filldate.setHours(0);
        filldate.setMinutes(0);
        for (var i = 0; i < 24; i++) {
            hours_typeahead.push(filldate.format(date.TIME));
            filldate.add(1000 * 60 * 30); //half hour
            hours_typeahead.push(filldate.format(date.TIME));
            filldate.add(1000 * 60 * 30); //half hour
        }

        var comboboxHours = {
            source: hours_typeahead,
            items: 48,
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

        var modelEvents = {};
        modelEvents['change:' + options.attribute] = 'setValueInField';
        modelEvents['invalid:' + options.attribute] = 'showError';
        modelEvents.valid = 'removeError';
        modelEvents['change:full_time'] = 'onFullTimeChange';

        _.extend(this, {
            tagName: 'div',
            render: function () {
                var self = this;
                this.nodes = {};
                this.$el.append(
                        this.nodes.controlGroup = $('<div class="control-group">').append(
                            $('<label>').addClass(options.labelClassName || '').text(this.label),
                            $('<div class="control">').append(
                                function () {
                                    self.nodes.dayField = $('<input type="text" class="input-small">');
                                    self.nodes.timezoneField = $('<span class="label">');
                                    if (self.model.get(self.attribute)) {
                                        self.nodes.timezoneField.text(date.Local.getTTInfoLocal(self.model.get(self.attribute)).abbr);
                                    } else {
                                        self.nodes.timezoneField.text(date.Local.getTTInfoLocal(_.now()).abbr);
                                    }
                                    if (options.display === "DATE") {
                                        return [self.nodes.dayField, '&nbsp;', self.nodes.timezoneField];
                                    } else if (options.display === "DATETIME") {
                                        self.nodes.timeField = $('<input type="text" class="input-mini">');
                                        if (self.model.get('full_time')) {
                                            self.nodes.timeField.hide();
                                            self.nodes.timezoneField.hide();
                                        }
                                        return [self.nodes.dayField, '&nbsp;', self.nodes.timeField, '&nbsp;', self.nodes.timezoneField];
                                    }
                                }
                            )
                        )
                );
                this.setValueInField();
                // get the right date format
                var dateFormat = date.getFormat(date.DATE).replace(/\by\b/, 'yyyy').toLowerCase();
                this.nodes.dayField.datepicker({format: dateFormat});
                this.nodes.timeField.combobox(comboboxHours);

                this.nodes.dayField.on("change", _.bind(this.updateModelDate, this));
                this.nodes.timeField.on("change", _.bind(this.updateModelTime, this));

                return this;
            },
            setValueInField: function () {
                var value = this.model.get(this.attribute);
                if (value) {
                    this.nodes.timezoneField.text(date.Local.getTTInfoLocal(value).abbr);
                } else {
                    this.nodes.timezoneField.text(date.Local.getTTInfoLocal(_.now()).abbr);
                }
                this.nodes.dayField.val(BinderUtils.convertDate('ModelToView', value, this.attribute, this.model));
                this.nodes.timeField.val(BinderUtils.convertTime('ModelToView', value, this.attribute, this.model));
            },
            updateModelDate: function () {
                this.model.set(this.attribute, BinderUtils.convertDate('ViewToModel', this.nodes.dayField.val(), this.attribute, this.model));
            },
            updateModelTime: function () {
                this.model.set(this.attribute, BinderUtils.convertTime('ViewToModel', this.nodes.timeField.val(), this.attribute, this.model));
            },
            showError: function (messages) {
                this.removeError();
                this.nodes.controlGroup.addClass("error");
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
                    this.nodes.controlGroup.removeClass("error");
                }
            },
            onFullTimeChange: function () {
                if (this.model.get('full_time')) {
                    this.nodes.timeField.hide();
                    this.nodes.timezoneField.hide();
                } else {
                    this.nodes.timeField.show();
                    this.nodes.timezoneField.show();
                }
            },
            modelEvents: modelEvents
        }, options);
    }


    var forms = {
        ErrorAlert: ErrorAlert,
        ControlGroup: ControlGroup,
        DateControlGroup: DateControlGroup,
        Section: Section,
        InputField: InputField,
        CheckBoxField: CheckBoxField,
        SelectBoxField: SelectBoxField,
        SectionLegend: SectionLegend,
        DatePicker: DatePicker,
        utils: {
            date2string: function (value) {
                if (_.isNumber(value)) {
                    return (new date.Local(date.Local.utc(value)));
                }
                return value;
            },

            controlGroup: {
                date: {
                    setValueInElement: function (valueFromModel) {
                        var transformedValue = forms.utils.date2string(valueFromModel),
                            transformedValueFormated;

                        if (this.nodes.dropelements) {
                            var allSelects = this.nodes.dropelements.find('select'),
                            singleValues = [];
                            if (_.isObject(transformedValue)) {
                                transformedValueFormated = transformedValue.format(date.DATE);
                            } else {
                                transformedValueFormated = transformedValue;
                            }

                            if (transformedValue !== undefined && transformedValue !== null) {
                                singleValues.push(transformedValue.getDate(), transformedValue.getMonth(), transformedValue.getYear());
                            }

                            _(allSelects).each(function (element, key) {
                                $(element).val(singleValues[key]);
                            });
                        }

                        this.nodes.element.val(transformedValueFormated);

                    },

                    setValueInModel: function (valueFromElement) {
                        var timestamp = this.nodes.element.data().dateobject.t;
                        if (valueFromElement === '') {
                            valueFromElement = timestamp = null;
                        }
                        if (this.model.set(this.attribute, timestamp)) {
                            this.$el.removeClass('error');
                            this.nodes.controls.find('.help-block.error').remove();
                        }
                    }
                }
            }
        }
    };

    return forms;
});

