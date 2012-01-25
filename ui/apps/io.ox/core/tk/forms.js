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
    var utils = {
        createCheckbox: function (options) {
            var checkboxDiv,
                label,
                checkbox,
                container;

            container = checkboxDiv = $('<div>').addClass('checkbox');
            if (options.classes) {
                checkboxDiv.addClass(options.classes);
            }
            if (options.label) {
                label = $('<label>');
                checkboxDiv.append(label);
                container = label;
            }

            checkbox = $('<input type="checkbox" data-item-id="' + options.dataid + '"/>');

            options.id = options.id || _.uniqueId('c');
            checkbox.attr('id', options.id);


            container.append(checkbox);
            if (options.label) {
                label.append($('<span>').text(options.label));
            }

            checkbox.on('change', function (evt) {
                checkbox.trigger('update', {dataid: options.dataid, value: ((typeof checkbox.attr('checked') !== 'undefined') ? true: false)});
            });

            if (options.model !== undefined) {
                checkbox.attr('checked', options.model.get(options.dataid));
                $(options.model).on(options.dataid + '.changed', function (evt, value) {
                    if (checkbox.attr('checked') !== value) {
                        checkbox.attr('checked', value);
                    }
                });
            }
            return checkboxDiv;
        },
        createSelectbox: function (options) {
            var selectboxDiv,
                label,
                selectbox,
                container;

            container = selectboxDiv = $('<div>').addClass('select');
            if (options.classes) {
                selectboxDiv.addClass(options.classes);
            }

            if (options.label) {
                label = $('<label>')
                          .append($('<span>').text(options.label));
                selectboxDiv.append(label);
                container = label;
            }
            selectbox = $('<select>');

            selectbox.attr('data-item-id', options.dataid);
            _.each(options.items, function (val, key) {
                var opt =  $('<option>').attr('value', val).text(key);
                selectbox.append(opt);
            });

            selectbox.on('change', function (evt) {
                selectbox.trigger('update', {dataid: options.dataid, value: selectbox.val()});
            });

            if (options.model !== undefined) {
                selectbox.find('option[value="' + options.model.get(options.dataid) + '"]').attr('selected', 'selected');
                $(options.model).on(options.dataid + '.changed', function (evt, value) {
                    selectbox.find('option[value="' + value + '"]').attr('selected', 'selected');
                });
            }

            container.append(selectbox);
            return selectboxDiv;
        },
        createRadioButton: function (options) {
            var radioDiv,
                label,
                radio,
                container;

            options.id = options.id || _.uniqueId('c');

            container = radioDiv = $('<div>').addClass('radio');
            if (options.classes) {
                radioDiv.addClass(options.classes);
            }
            if (options.label) {
                label = $('<label>');
                radioDiv.append(label);
                container = label;
            }



            radio = $('<input type="radio">');
            radio.attr({
                'name': options.name,
                'data-item-id': options.dataid,
                'id': options.id
            });
            if (options.value) {
                radio.attr('value', options.value);
            }

            container.append(radio);
            if (options.label) {
                label.append($('<span>').text(options.label));
            }


            radio.on('change', function () {
                var val = $('input[name="' + options.name + '"]:checked').val();
                radio.trigger('update', {dataid: options.dataid, value: val});
            });

            if (options.model !== undefined) {
                radio.attr('checked', (options.model.get(options.dataid) === options.value) ? 'checked' : null);
                $(options.model).on(options.dataid + '.changed', function (evt, value) {
                    console.log(value + ':' + options.value);
                    if (value === options.value) {
                        radio.attr('checked', 'checked');
                    }
                });
            }
            return radioDiv;
        },


        createTextField: function (options) {
            var textfieldDiv,
                textfield,
                label,
                container;

            options.id = options.id || _.uniqueId('c');
            options.maxlength = options.maxlength || 20;
            container = textfieldDiv = $('<div>').addClass('input');
            if (options.classes) {
                textfieldDiv.addClass(options.classes);
            }

            if (options.label) {
                label = $('<label>');
                textfieldDiv.append(label);
                container = label;
            }

            textfield = $('<input type="text" maxlength="' + options.maxlength + '">');

            textfield.attr({
                'data-item-id': options.dataid,
                'id': options.id
            });


            textfield.on('change', function () {
                textfield.trigger('update', {dataid: options.dataid, value: textfield.val()});
            });

            if (options.model !== undefined) {
                textfield.val(options.model.get(options.dataid));
                $(options.model).on(options.dataid + '.changed', function (evt, value) {
                    textfield.val(value);
                });
            }

            container.append(textfield);
            return textfieldDiv;
        },
        createPasswordField: function (options) {
            options.maxlength = options.maxlength || 20;
            var tfdiv = $('<div>');
            var tf = $('<input type="password" maxlength="' + options.maxlength + '">');
            tf.attr('data-item-id', options.dataid);

            tf.val(options.model.get(options.dataid));
            tf.on('change', function () {
                options.model.set(options.dataid, tf.val());
            });

            tfdiv.append(tf);
            return tfdiv;
        },
        createLabeledTextField: function (options) {
            var l = utils.createLabel().css({width: '100%', display: 'inline-block'});
            l.append(utils.createText({text: options.label}));
            l.append(utils.createTextField({dataid: options.dataid, value: options.value, model: options.model, validator: options.validator}).css({ width: options.width + 'px', display: 'inline-block'}));
            return l;
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
            if(options.classes) {
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
        }
    };

    return utils;
});
