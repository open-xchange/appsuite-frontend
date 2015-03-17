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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */
/*global
define: true
*/
define('io.ox/core/tk/forms', ['io.ox/core/date'], function (date) {

    'use strict';

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
            self.trigger('update.model', { property: self.attr('data-property'), value: self.val() });
        },

        selectChangeByModel = function (e, value) {
            $(this).val(value);
        },

        dateChange = function () {
            var self = $(this),
                reg = /((\d{2})|(\d))\.((\d{2})|(\d))\.((\d{4})|(\d{2}))/;
            if (self.val() !== '' && reg.test(self.val())) {
                var dateArray = self.val().split('.'),
                date =  Date.UTC(dateArray[2], (--dateArray[1]), (dateArray[0]));
                self.trigger('update.model', { property: self.attr('data-property'), value: date });
            } else {
                self.trigger('update.model', { property: self.attr('data-property'), value: self.val() });
            }
        },
        dateChangeByModel = function (e, value) {
            if (_.isNumber(value)) {
                value = new date.Local(date.Local.utc(value)).format(date.DATE);
            }
            $(this).val(value);
        },

        radioChange = selectChange,

        radioChangeByModel = function (e, value) {
            var self = $(this);
            self.prop('checked', self.attr('value') === value);
        },

        textChange = selectChange,

        textChangeByModel = selectChangeByModel,

        nodeChangeByModel = function (e, value) {
            $(this).text(value);
        },

        invalid = function () {
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
        this.options.id = this.options.id;
        // node
        this.node = null;
        this.options.fieldtype = type;
    };

    Field.prototype.create = function (tag, onChange) {
        var o = this.options,

            id = utils.connectLabelToField(o.id),

            element = $(tag)
            .attr({
                'data-property': o.property,
                name: o.name,

                id: id,
                value: o.value
            })
            .on('change', onChange)
            .addClass(o.classes);
        this.node = element;

    };

    Field.prototype.applyModel = function (handler) {
        var o = this.options, model = o.model, val = o.initialValue;
        if ((model || val) !== undefined) {
            this.node
                .on('invalid', invalid)
                .on('update.view', handler)
                .triggerHandler('update.view', model !== undefined ? model.get(o.property) : val);
        }
    };

    Field.prototype.wrapLabel = function () {
        var o = this.options;
        if (o.label !== false) {
            var label = $('<label>').addClass(o.fieldtype),
                text = $.txt(o.label || '');
            this.node = label.append(text, this.node);
        }
    };

    // allows global lookup
    var lastLabelId = '';

    var utils = {

        createCheckbox: function (options) {
            var f = new Field(options, 'checkbox');
            f.create('<input type="checkbox">', boxChange);
            f.applyModel(boxChangeByModel);
            f.wrapLabel();
            return f.node;
        },

        createSelectbox: function (options) {
            var f = new Field(options, 'select');
            f.create('<select>', selectChange);
            // add options
            f.node.append(_(options.items).inject(function (memo, text, value) {
                return memo.add($('<option>').attr('value', value).text(text));
            }, $()));
            f.applyModel(selectChangeByModel);
            f.wrapLabel();
            return f.node;
        },

        createRadioButton: function (options) {
            var f = new Field(options, 'radio');
            f.create('<input type="radio">', radioChange);
            f.applyModel(radioChangeByModel);
            f.wrapLabel();
            return f.node;
        },

        createTextField: function (options) {
            var f = new Field(options, 'text');
            f.create('<input type="text">', textChange);
            f.applyModel(textChangeByModel);
            f.wrapLabel();
            return f.node;
        },

        createTextArea: function (options) {
            var f = new Field(options, 'text');
            f.create('<textarea>', textChange);
            f.applyModel(textChangeByModel);
            f.wrapLabel();
            return f.node;
        },

        createDateField: function (options) {
            var f = new Field(options, 'date');
            // changed to text again for validation reasons
            f.create('<input type="text">', dateChange);
            f.applyModel(dateChangeByModel);
            f.wrapLabel();
            return f.node;
        },

        createPasswordField: function (options) {
            var f = new Field(options, 'text');
            f.create('<input type="password">', textChange);
            f.applyModel(textChangeByModel);
            f.wrapLabel();
            return f.node;
        },

        createFileField: function (options) {
            var f = new Field(options, 'file');
            f.create('<input type="file">', textChange);
            f.node.attr({
                'accept': options.accept
            });
            f.applyModel(textChangeByModel);
            f.wrapLabel();
            return f.node;
        },

        createLabeledTextField: function (options) {
            return utils.createLabel(options)
                .css({ width: '100%', display: 'inline-block' })
                .append(utils.createText({ text: options.label }))
                .append(utils.createTextField({ property: options.property, value: options.value, model: options.model, span: options.span})
                        .css({ width: options.width + 'px', display: 'inline-block' })
                );
        },

        createLabeledPasswordField: function (options) {
            var l = utils.createLabel(options).css({width: '100%', display: 'inline-block'});
            l.append(utils.createText({text: options.label}));
            l.append(utils.createPasswordField({property: options.property, value: options.value, model: options.model, validator: options.validator}).css({ width: options.width + 'px', display: 'inline-block'}));
            return l;
        },

        createLabel: function (options) {
            var label,
                forTag = utils.connectLabelToField(options['for']);
            options.text = options.text || '';

            label = $('<label>');
            label.attr('for', forTag);
            label.text(options.text);

            return label;
        },

        createText: function (options) {
            var node = $('<span>')
                .addClass('text')
                .addClass(options.classes)
                .text(options.text || '');

            if (options.model && options.property) {
                node.attr('data-property', options.property)
                    .on('update.view', nodeChangeByModel)
                    .triggerHandler('update.view', options.model.get(options.property));
            }
            return node;
        },

        createInfoText: function (options) {
            var d = $('<div>').addClass('informational-text');
            if (options.html) {
                d.html(options.html);
            } else {
                d.text(options.text);
            }
            return d;
        },

        // settings

        createSectionDelimiter: function () {
            return $('<div>')
                .addClass('settings sectiondelimiter');
        },

        createApplicationTitle: function (options) {
            return $('<div>')
                .addClass('clear-title')
                .text(options.text);
        },

        createSettingsHead: function (app) {
            return $('<div>')
                .append(utils.createApplicationTitle({ text: app.title }))
                .append(utils.createSectionDelimiter());
        },

        createSection: function () {
            return $('<div>').addClass('section');
        },

        createSectionTitle: function (options) {
            return $('<legend>').addClass('sectiontitle').text(options.text);
        },

        createSectionContent: function () {
            return $('<div>').addClass('sectioncontent');
        },

        createSectionGroup: function () {
            return $('<div>').addClass('section-group');
        },

        createSectionHorizontalWrapper: function () {
            return $('<div>').addClass('form-horizontal');
        },

        createControlGroup: function () {
            return $('<div>').addClass('control-group');
        },

        createInlineControlGroup: function () {
            return $('<div>').addClass('control-group form-inline');
        },

        createControlGroupLabel: function (options) {
            if (options) {
                var forTag = utils.connectLabelToField(options['for']);

                return $('<label>', {'for': forTag})
                .text(options.text).addClass('control-label');
            } else {
                return $('<label>');
            }
        },

        createControlsWrapper: function () {
            return $('<div>').addClass('controls');
        },

        createPicUpload: function (options) {
            var o = _.extend({
                target: 'picture-upload',
                name: 'picture-upload-file'
            }, options);
            // make target unique
            o.target += '-' + _.now();
            return $('<form>', {
                    'accept-charset': 'UTF-8',
                    enctype: 'multipart/form-data',
                    method: 'POST',
                    target: o.target
                })
                .append(
                    utils.createFileField({
                        wrap: false,
                        accept: 'image/*',
                        'data-property': o.name,
                        name: o.name
                    })
                )
                .append(
                    $('<iframe>', {
                        name: o.target,
                        src: 'blank.html'
                    }).hide()
                );
        },

        getLastLabelId: function () {
            return lastLabelId;
        },

        connectLabelToField: function (tagValue) {
            var CreatedId;
            if (tagValue === 'auto') {
                CreatedId = lastLabelId = _.uniqueId('label_');
                return CreatedId;
            } else if (tagValue === 'last') {
                return utils.getLastLabelId();
            } else {
                return tagValue;
            }
        },

        createListItem: function (options) {
            options.classStr = options.classStr || 'deletable-item';
            var item = $('<div>').addClass(options.classStr).attr('data-item-id', options.dataid)
                .append(
                    $('<a>').html('&times;').addClass('close'),
                    $('<div>').html(options.html)
                )
                .on('click', function () {
                // console.log('click');
                    item.parent().find('div[selected="selected"]').prop('selected', false);
                    item.prop('selected', true);
                });
            return item;
        },

        createListSpacer: function () {
            return $('<div>').addClass('spacer').css({height: '0px'});
        },

        createButton: function (options) {
            return $('<button type="button">').addClass(options.btnclass).text(options.label);
        }

    };

    return utils;
});
