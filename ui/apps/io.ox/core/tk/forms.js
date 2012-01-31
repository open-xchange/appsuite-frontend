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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */
/*global
define: true
*/
define('io.ox/core/tk/forms',
      ['io.ox/core/i18n'], function (i18n) {

    'use strict';

    /**
    options = {
        class
        update
        name
        model
        validator
        property
        id
    }
*/

    // local handlers
    var boxChange = function () {
            var self = $(this);
            self.trigger('update.model', { property: self.attr('data-property'), value: self.prop('checked') });
        },
        boxChangeByModel = function (e, value) {
            $(this).prop('checked', !!value);
        },
        selectChange = function () {
            var self = $(this);
            console.log('field:change: trigger update model');
            self.trigger('update.model', { property: self.attr('data-property'), value: self.val() });
        },
        selectChangeByModel = function (e, value) {
            console.log('field:model change');
            $(this).val(value);
        },
        radioChange = selectChange,
        radioChangeByModel = function (e, value) {
            var self = $(this);
            self.prop('checked', self.attr('value') === value);
        },
        textChange = selectChange,
        textChangeByModel = selectChangeByModel,
        invalid = function (e) {
            var node = $(this)
                .addClass('invalid-value').css({
                    backgroundColor: '#fee',
                    borderColor: '#a00'
                })
                .focus();
            setTimeout(function () {
                node.removeClass('invalid-value').css({
                    backgroundColor: '',
                    borderColor: ''
                });
                node = null;
            }, 5000);
        };

    /**
     * Very simple helper class to avoid always passing node & options around
     */
    var Field = function (options, type) {
        // store options
        this.options = options || {};
        this.options.id = this.options.id || _.uniqueId(type);
        // node
        this.node = null;
    };

    Field.prototype.create = function (tag, onChange) {
        var o = this.options;
        this.node = $(tag)
            .attr({ 'data-property': o.property, name: o.name, id: o.id, value: o.value })
            .on('change', onChange)
            .addClass(o.classes);
    };

    Field.prototype.applyModel = function (handler) {
        var o = this.options, model = o.model, val = o.initialValue;
        if ((model || val) !== undefined) {
            this.node
                .on('invalid', invalid)
                .on('update.field', handler)
                .triggerHandler('update.field', model !== undefined ? model.get(o.property) : val);
        }
    };

    Field.prototype.finish = function (order, classes) {
        // local reference
        var o = this.options, node = this.node;
        // wrap label tag around field
        if (o.label !== false) {
            var label = $('<label>', { 'for': o.id }),
                space = $.txt(' '),
                text = $.txt(o.label || '');
            node = label.append.apply(label, order === 'append' ? [node, space, text] : [text, space, node]);
        }
        // wrap DIV around field & label
        if (this.options.wrap !== false) {
            node = $('<div>').addClass(classes).append(node);
        }
        // clean up
        this.node = this.options = o = null;
        return node;
    };

    var utils = {

        createCheckbox: function (options) {
            var f = new Field(options, 'box');
            f.create('<input type="checkbox">', boxChange);
            f.applyModel(boxChangeByModel);
            return f.finish('append', 'checkbox');
        },

        createSelectbox: function (options) {
            var f = new Field(options, 'select');
            f.create('<select size="1">', selectChange);
            // add options
            f.node.append(_(options.items).inject(function (memo, text, value) {
                return memo.add($('<option>').attr('value', value).text(text));
            }, $()));
            f.applyModel(selectChangeByModel);
            return f.finish('prepend');
        },

        createRadioButton: function (options) {
            var f = new Field(options, 'radio');
            f.create('<input type="radio">', radioChange);
            f.applyModel(radioChangeByModel);
            return f.finish('append', 'radio');
        },

        createTextField: function (options) {
            var f = new Field(options, 'text');
            f.create('<input type="text">', textChange);
            f.applyModel(textChangeByModel);
            return f.finish('prepend', 'input');
        },

        createPasswordField: function (options) {
            var f = new Field(options, 'text');
            f.create('<input type="password">', textChange);
            f.applyModel(textChangeByModel);
            return f.finish('prepend');
        },

        createLabeledTextField: function (options) {
            return utils.createLabel()
                .css({ width: '100%', display: 'inline-block' })
                .append(utils.createText({ text: options.label }))
                .append(utils.createTextField({ property: options.property, value: options.value, model: options.model, validator: options.validator})
                        .css({ width: options.width + 'px', display: 'inline-block' })
                );
        },

        createLabeledPasswordField: function (options) {
            var l = utils.createLabel().css({width: '100%', display: 'inline-block'});
            l.append(utils.createText({text: options.label}));
            l.append(utils.createPasswordField({property: options.property, value: options.value, model: options.model, validator: options.validator}).css({ width: options.width + 'px', display: 'inline-block'}));
            return l;
        },

        createLabel: function (options) {
            var labelDiv,
                label;
            options.id = options.id || _.uniqueId('c');
            options.text = options.text || "";

            labelDiv = $('<div>');
            labelDiv.addClass('label');
            if (options.classes) {
                labelDiv.addClass(options.classes);
            }

            label = $('<label>');
            label.attr('for', options.id);
            label.text(options.text);

            labelDiv.append(label);

            return labelDiv;
        },

        createText: function (options) {
            var textContainer;
            options.id = options.id || _.uniqueId('c');
            textContainer = $('<span>');
            textContainer.addClass('text');

            if (options.classes) {
                textContainer.addClass(options.classes);
            }

            var updateText = function () {
                if (options.html === true) {
                    textContainer.html(options.model.get(options.property));
                } else {
                    textContainer.text(options.model.get(options.property));
                }
            };

            if (options.model) {
                updateText();
                $(options.model).on('change' + options.property, updateText);
            }

            return textContainer;
        },

        createSection: function (options) {
            return $('<div>').addClass('section');
        },

        createSectionTitle: function (options) {
            return $('<div>').addClass('sectiontitle').text(options.text);
        },

        createSectionContent: function (options) {
            return $('<div>').addClass('sectioncontent');
        },

        createSectionGroup: function (options) {
            return $('<div>').addClass('section-group');
        },

        createSectionDelimiter: function () {
            return $('<div>').addClass('settings sectiondelimiter');
        }
    };

    return utils;
});
