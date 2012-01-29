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
define('io.ox/core/tk/forms', [], function () {

    'use strict';

    /**
    options = {
        class
        update
        name
        model
        validator
        dataid
        id
    }
*/

    // local handlers
    var boxChange = function () {
            var self = $(this), dataid = self.attr('name'), value = self.prop('checked');
            self.trigger('update', { dataid: dataid, value: value });
        },
        boxChangeByModel = function (e, value) {
            $(this).prop('checked', !!value);
        },
        selectChange = function () {
            var self = $(this), dataid = self.attr('name'), value = self.val();
            self.trigger('update', { dataid: dataid, value: value });
        },
        selectChangeByModel = function (e, value) {
            $(this).val(value);
        },
        radioChange = selectChange,
        radioChangeByModel = function (e, value) {
            var self = $(this);
            self.prop('checked', self.attr('value') === value);
        },
        textChange = selectChange,
        textChangeByModel = selectChangeByModel;

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
            .attr({ 'data-item-id': o.dataid, name: o.dataid, id: o.id })
            .on('change', onChange)
            .addClass(o.classes);
    };

    Field.prototype.applyModel = function (handler) {
        var o = this.options, model = o.model;
        if (model !== undefined) {
            handler = $.proxy(handler, this.node.get(0));
            handler({}, model.get(o.dataid));
            $(model).on(o.dataid + '.changed', handler);
        }
    };

    Field.prototype.finish = function (order, classes) {
        // local reference
        var o = this.options, node = this.node;
        // wrap label tag around field
        if (o.label !== false) {
            var label = $('<label>', { 'for': o.id }),
                text = $.txt(o.label || '');
            node = label.append.apply(label, order === 'append' ? [node, text] : [text, node]);
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
            // set value
            f.node.attr('value', options.value);
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
                .append(utils.createTextField({ dataid: options.dataid, value: options.value, model: options.model, validator: options.validator})
                        .css({ width: options.width + 'px', display: 'inline-block' })
                );
        },

        createLabeledPasswordField: function (options) {
            var l = utils.createLabel().css({width: '100%', display: 'inline-block'});
            l.append(utils.createText({text: options.label}));
            l.append(utils.createPasswordField({dataid: options.dataid, value: options.value, model: options.model, validator: options.validator}).css({ width: options.width + 'px', display: 'inline-block'}));
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
                    textContainer.html(options.model.get(options.dataid));
                } else {
                    textContainer.text(options.model.get(options.dataid));
                }
            };

            if (options.model) {
                updateText();
                $(options.model).on(options.dataid + '.changed', updateText);
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
