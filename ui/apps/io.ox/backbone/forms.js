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
    [
     'less!io.ox/backbone/forms'
    ], function () {

    'use strict';

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

        // May override any of the above aspects
        _.extend(this, options);
    }

    function SelectControlGroup(options) {
        _.extend(this, new ControlGroup(options), {
            buildElement: function () {
                var self = this,
                    guid = _.uniqueId('form-control-label-');
                if (this.nodes.element) {
                    return this.nodes.element;
                }
                this.nodes.label.attr('for', guid);
                this.nodes.element = $('<select>').attr({ tabindex: options.tabindex || 1, id: guid}).addClass('form-control');
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


    function CheckControlGroup(options) {
        _.extend(this, new ControlGroup(options), {
            buildElement: function () {
                var self = this;
                if (this.nodes.element) {
                    return this.nodes.element;
                }
                this.nodes.element = $('<label class="checkbox">')
                    .addClass(this.labelClassName || '')
                    .append(
                        this.nodes.checkbox = $('<input tabindex="1" type="checkbox">'),
                        this.label
                    );
                if (this.model.get(this.attribute)) {
                    this.nodes.checkbox.prop('checked', true);
                }
                this.nodes.checkbox.prop('checked', this.model.get(this.attribute));
                this.nodes.checkbox.on('change', function () {
                    self.model.set(self.attribute, self.nodes.checkbox.prop('checked'), {validate: true});
                });
                this.nodes.label.empty();
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
                var errorId = _.uniqueId('error-help_'),
                    inputField = this.$el.find('input');

                this.$el.find('.help-block').remove();
                var helpBlock = $('<div class="help-block error" aria-live="assertive" role="alert">').attr('id', errorId);
                _(messages).each(function (msg) {
                    helpBlock.append($.txt(msg));
                });
                this.$el.append(helpBlock);
                this.$el.addClass('error');
                inputField.attr({
                    'aria-invalid': 'true',
                    'aria-describedby': errorId
                });
                inputField.focus();
            },
            clearError: function () {
                var inputField = this.$el.find('input');
                inputField.removeAttr('aria-invalid aria-describedby');
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
            tagName: options.header ? 'fieldset' : 'div',
            modelEvents: modelEvents,
            render: function () {
                var self = this;
                this.nodes = {};
                if (this.header) {
                    this.$el.append($('<legend>').addClass(this.headerClassName || '').text(this.header));
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
                var self = this,
                    guid = _.uniqueId('form-control-label-');
                this.nodes = {};
                this.nodes.select = $('<select class="form-control">').attr({ id: guid, tabindex: 1 });
                if (options.multiple) {
                    this.nodes.select.prop('multiple', true);
                }
                _(this.selectOptions).each(function (label, value) {
                    self.nodes.select.append(
                        $('<option>', {value: value}).text(label)
                    );
                });
                this.$el.append($('<label>').attr('for', guid).addClass(this.labelClassName || '').text(this.label)).append(this.nodes.select);
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
            tagName: 'fieldset',
            render: function () {
                this.nodes = {};
                this.$el.append(this.nodes.legend = $('<legend>').text(this.label).addClass('sectiontitle'));
            }
        }, options);
    }

    var forms = {
        ControlGroup: ControlGroup,
        SelectControlGroup: SelectControlGroup,
        InputField: InputField,
        CheckBoxField: CheckBoxField,
        CheckControlGroup: CheckControlGroup,
        SelectBoxField: SelectBoxField,
        SectionLegend: SectionLegend
    };

    return forms;
});
