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
                    self.$el.find('.alert').remove();
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
            if (options.fluid) {
                this.nodes.controlGroup.addClass('row-fluid');
            }
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

        this.modelEvents['invalid:' + options.attribute] = 'onValidationError';
        this.modelEvents['valid:' + options.attribute] = 'removeError';

        _.extend(this, options); // May override any of the above aspects
    }

    function SelectControlGroup(options) {
        _.extend(this, new ControlGroup({}), {
            buildElement: function () {
                var self = this;
                if (this.nodes.element) {
                    return this.nodes.element;
                }

                this.nodes.element = $('<select>').addClass('control');
                _(this.selectOptions).each(function (label, value) {
                    self.nodes.element.append(
                        $("<option>", {value: value}).text(label)
                    );
                });

                this.nodes.element.on('change', function () {
                    self.updateModel();
                });

                return this.nodes.element;
            }
        }, options);
    }

    function DateControlGroup(options) {

        ControlGroup.call(this, _.extend({
            buildElement: buildElement,
            setValueInElement: setValueInElement,
            updateModel: updateModel
        }, options || {}));

        function buildElement() {
            var self = this;
            var parent = $('<span>');
            this.nodes.dropelements = {};

            function createSelect(name, from, to, setter, format) {
                var node = self.nodes.dropelements[name] = $('<select size="1">').attr('name', name),
                    i = Math.min(from, to),
                    $i = Math.max(from, to),
                    d = new date.Local(0),
                    options = [];
                for (; i <= $i; i++) {
                    setter.call(d, i);
                    options.push($('<option>').val(i).text(d.format(format)));
                }
                // revert?
                if (from > to) {
                    options.reverse();
                }
                // add empty option
                options.unshift($('<option>').text(''));
                // append
                parent.append(node.append(options));
            }

            date.getFormat(date.DATE).replace(
                /(Y+|y+|u+)|(M+|L+)|(d+)|(?:''|'(?:[^']|'')*'|[^A-Za-z'])+/g,
                function (match, y, m, d) {
                    var proto = date.Local.prototype;
                    if (y) {
                        var year = (new date.Local()).getYear();
                        createSelect('year', year, year - 150, proto.setYear, y);
                    } else if (m) {
                        createSelect('month', 0, 11, proto.setMonth, 'MMMM');
                    } else if (d) {
                        createSelect('day', 1, 31, proto.setDate, match);
                    }
                });
            parent.on('change', 'select', function () {
                self.updateModel($(this).val() === '');
            });

            return parent;
        }

        function setValueInElement(valueFromModel) {
            if (!this.nodes.dropelements) return;

            var de = this.nodes.dropelements;
            if (valueFromModel) {
                var d = new date.Local(date.Local.utc(valueFromModel));
                de.year.val(d.getYear());
                de.month.val(d.getMonth());
                de.day.val(d.getDate());
            } else {
                de.year.val('');
                de.month.val('');
                de.day.val('');
            }
        }

        function updateModel(clear) {
            var de = this.nodes.dropelements;
            this.setValueInModel(clear ? null :
                date.Local.localTime(new date.Local(
                    de.year.val()  || new date.Local().getYear(),
                    de.month.val() || 0,
                    de.day.val()   || 1)));
        }

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
        options = _.extend({
            changeAppTitleOnKeyUp: false
        }, options);
        var modelEvents = {};
        modelEvents['change:' + options.attribute] = 'updateInputField';
        var basicImplementation = {
            tagName: 'div',
            render: function () {
                this.nodes = {};
                this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.inputField = $(this.control || '<input type="text">'));
                this.nodes.inputField.val(this.model.get(this.attribute));
                if (options.changeAppTitleOnKeyUp) {
                    this.nodes.inputField.on('keyup', $.proxy(function (e) {
                        this.baton.app.setTitle(this.nodes.inputField.val());
                    }, this));
                }
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
                if (options.multiple) {
                    this.nodes.select.attr('multiple', 'multiple');
                }
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

    function Header(options) {
        _.extend(this, {
            tagName: 'div',
            render: function () {
                this.$el.append($('<div>').append(
                      $('<div>').addClass('clear-title').text(options.label),
                      $('<div>').addClass('settings sectiondelimiter')
                  ));
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
                    // Show regular header
                    this.nodes.collapsedHeader.hide();
                    this.nodes.header.show();
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
                    // show collapsedHeader
                    this.nodes.collapsedHeader.show();
                    this.nodes.header.hide();
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

            /**
             * Draw the header of a section.
             *
             * There can be four states a section might be in.
             * 1. allVisible
             *   * if this is the initial state, section can never be collapsed
             *   * neither + or - sign are shown
             * 2. mixed open
             *   * section contains some visible fields that can be hidden by the user
             *   * - sign is shown
             * 3. mixed close
             *   * section contains some hidden fields that can be made visible by the user
             *   * + sign is shown
             * 3. collapsed
             *   * some or all fields of this section are hidden
             *   * + sign is shown
             *
             * TODO: this code might need some cleanup (drawHeader, less and more)
             */
            drawHeader: function () {
                var self = this;

                this.nodes.header = $('<div class="row sectionheader">').append(
                    $('<span class="offset2 span4">').append(
                        $('<i class="icon-minus-sign">'),
                        $('<a href="#">').text(this.title).on('click', function () {
                            if (self.state === 'mixed') {
                                self.more();
                            } else if (self.state === 'allVisible') {
                                self.less();
                            }
                        })
                    )
                ).appendTo(this.$el);

                if (this.state === 'allVisible') {
                    this.nodes.header.find('.icon-minus-sign').hide();
                    return;
                }

                this.nodes.toggleLink = $('<a href="#" class="span6" data-action="toggle-' + options.id + '">').on('click', function () {
                    if (self.state === 'mixed') {
                        self.more();
                    } else if (self.state === 'allVisible') {
                        self.less();
                    }
                });

                if (this.state === 'collapsed' || this.initialState === 'mixed') {
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
                var ret;
                if (direction === 'ModelToView') {
                    if (model.get('full_time')) {
                        value = date.Local.utc(value);
                        if (attribute === 'end_date') {
                            value -= date.DAY;
                        }
                    }
                    ret = BinderUtils._toDate(value, attribute, model);
                } else {
                    ret = BinderUtils._dateStrToDate(value, attribute, model);
                    if (model.get('full_time') && attribute === 'end_date') {
                        ret += date.DAY;
                    }
                }
                return ret;
            },

            convertTime: function (direction, value, attribute, model) {
                if (direction === 'ModelToView') {
                    return BinderUtils._toTime(value, attribute, model);
                } else {
                    return BinderUtils._timeStrToDate(value, attribute, model);
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
                if (value === undefined || value === null) {//dont use !value or 0 will result in false
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
                if (value === undefined || value === null) {//dont use !value or 0 will result in false
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
                var mydate = new date.Local(myValue);
                var parsedDate = date.Local.parse(value, date.TIME);

                if (_.isNull(parsedDate)) {
                    return mydate.getTime();
                }

                mydate.setHours(parsedDate.getHours());
                mydate.setMinutes(parsedDate.getMinutes());
                mydate.setSeconds(parsedDate.getSeconds());

                return mydate.getTime();
            },

            _dateStrToDate: function (value, attribute, model) {
                var myValue = parseInt(model.get(attribute), 10);
                if (isNaN(myValue)) {
                    return value;
                }
                var mydate = new date.Local(myValue);
                var parsedDate = date.Local.parse(value, date.DATE);

                if (_.isNull(parsedDate)) {
                    return value;
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
                                    if (options.initialStateDisabled) {
                                        self.nodes.dayField.attr('disabled', true);
                                    }

                                    if (options.display === "DATETIME") {
                                        self.nodes.timezoneField = $('<span class="label">');
                                        if (self.model.get(self.attribute)) {
                                            self.nodes.timezoneField.text(date.Local.getTTInfoLocal(self.model.get(self.attribute)).abbr);
                                        } else {
                                            self.nodes.timezoneField.text(date.Local.getTTInfoLocal(_.now()).abbr);
                                        }
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
                this.nodes.dayField.datepicker({
                    format: dateFormat,
                    weekStart: date.locale.weekStart,
                    parentEl: self.nodes.controlGroup,
                    todayHighlight: true,
                    todayBtn: true
                });

                if (options.display === "DATETIME") {
                    this.nodes.timeField.combobox(comboboxHours);
                    this.nodes.timeField.on("change", _.bind(this.updateModelTime, this));
                }

                this.nodes.dayField.on("change", _.bind(this.updateModelDate, this));

                if (options.overwritePositioning) {
                    this.nodes.dayField.on('focus', _.bind(this.repositioning, this));
                }

                return this;
            },

            repositioning: function () {
                var element = this.nodes.controlGroup;

                this.nodes.controlGroup.find('.datepicker.dropdown-menu').css({
                    top: $(element)[0].offsetTop + $(element)[0].offsetHeight,
                    left: $(element)[0].offsetLeft
                });
            },
            setValueInField: function () {
                var value = this.model.get(this.attribute);
                if (value && options.display === "DATETIME") {
                    this.nodes.timezoneField.text(date.Local.getTTInfoLocal(value).abbr);
                } else if (options.display === "DATETIME") {
                    this.nodes.timezoneField.text(date.Local.getTTInfoLocal(_.now()).abbr);
                }
                this.nodes.dayField.val(BinderUtils.convertDate('ModelToView', value, this.attribute, this.model));

                if (options.display === "DATETIME") {
                    this.nodes.timeField.val(BinderUtils.convertTime('ModelToView', value, this.attribute, this.model));
                }
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
        SelectControlGroup: SelectControlGroup,
        DateControlGroup: DateControlGroup,
        Section: Section,
        Header: Header,
        InputField: InputField,
        CheckBoxField: CheckBoxField,
        SelectBoxField: SelectBoxField,
        SectionLegend: SectionLegend,
        DatePicker: DatePicker
    };

    return forms;
});

