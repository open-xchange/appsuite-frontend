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
define('io.ox/backbone/forms', ['io.ox/core/extensions', 'io.ox/core/event', 'io.ox/core/date', 'gettext!io.ox/backbone/forms', 'less!io.ox/backbone/forms.less'], function (ext, Events, date, gt) {

    "use strict";

    // Error Alert

    function ErrorAlert(options) {
        _.extend(this, {

            tagName: 'div',
            className: 'error-alerts',

            init: function () {
                var self = this;

                function showBackendError(error) {
                    var alert = $.alert(self.errorTitle, self.formatError(error));
                    self.$el.append(alert);

                    alert.find('.close').on('click', function () {
                        alert.remove();
                    });
                }

                this.observeModel('backendError', showBackendError);
            },

            errorTitle: gt('An error occurred'),

            formatError: function (error) {
                return gt("An error occurred. Please try again later");
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
            console.log("ON VALIDATION ERROR");
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
                helpBlock.empty();
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
                this.$el.append($('<label>').text(this.label), this.nodes.inputField = $(this.control || '<input type="text">'));
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
                    this.$el.append($('<label>').text(this.header));
                }
                this.$el.append(
                        $('<label class="checkbox">')
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

                this.$el.append($('<label>').text(this.label), this.nodes.select);

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
        _.extend(this, {

            tagName: 'div',
            className: 'section',

            init: function () {
                Events.extend(this);
                this.nodes = {};
            },

            point: function () {
                return ext.point(this.ref);
            },

            render: function () {
                var self = this;
                var anyHidden = false;
                var anyVisible = false;

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

                $('<span class="sectiontitle offset2 span4">').text(this.title).appendTo(this.nodes.header);
                if (this.state === 'allVisible') {
                    return;
                }

                this.nodes.toggleLink = $('<a href="#" class="span6">').on('click', function () {
                    if (self.state === 'mixed') {
                        self.more();
                    } else if (self.state === 'allVisible') {
                        self.less();
                    }
                }).appendTo(this.nodes.header);

                if (this.state === 'collapsed') {
                    this.nodes.collapsedHeader = $('<div class="row sectionheader collapsed">').appendTo(this.$el);
                    $('<span class="offset2 span4">').append(
                        $('<i class="icon-plus-sign">'),
                        $('<a href="#">').text(this.title).on('click', function () {
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

    var forms = {
        ErrorAlert: ErrorAlert,
        ControlGroup: ControlGroup,
        Section: Section,
        InputField: InputField,
        CheckBoxField: CheckBoxField,
        SelectBoxField: SelectBoxField,
        SectionLegend: SectionLegend,
        utils: {
            string2date: function (string) {
                var reg = /((\d{2})|(\d))\.((\d{2})|(\d))\.((\d{4})|(\d{2}))/;

                if (string !== '' && reg.test(string)) {
                    var dateArray = string.split('.');
                    return Date.UTC(dateArray[2], (--dateArray[1]), (dateArray[0]));
                } else {
                    return string;
                }
            },
            date2string: function (value) {
                if (_.isNumber(value)) {
                    return new date.Local(date.Local.utc(value)).format(date.DATE);
                }
                return value;
            },


            controlGroup: {
                date: {
                    setValueInElement: function (valueFromModel) {
                        this.nodes.element.val(forms.utils.date2string(valueFromModel));
                    },

                    setValueInModel: function (valueFromElement) {
                        if (this.model.set(this.attribute, forms.utils.string2date(valueFromElement))) {
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

