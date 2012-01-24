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
                checkbox;

            checkboxDiv = $('<div>').addClass('checkbox');
            if (options.classes) {
                checkboxDiv.addClass(options.classes);
            }
            if (options.label) {
                label = $('<label>');
                label.addClass('checkbox');
                checkboxDiv.append(label);
                checkboxDiv = label;
            }
            
            checkbox = $('<input type="checkbox" data-item-id="' + options.dataid + '"/>');
            
            if (options.id !== undefined) {
                checkbox.attr('id', options.id);
            } else {
                checkbox.attr('id', _.uniqueId('c'));
            }

            checkboxDiv.append(checkbox);
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
            var label = $('<label>').addClass('select');
            label.append(
              $('<span>').text(options.label)
            );
            var sb = $('<select>');
            sb.attr('data-item-id', options.dataid);
            _.each(options.items, function (val, key) {
                sb.append(
                  $('<option>').attr('value', val).text(key)
                );
            });
            sb.find('option[value="' + options.model.get(options.dataid) + '"]').attr('selected', 'selected');
            sb.on('change', function (evt) {
                console.log(options.dataid + ':' + sb.val());
                console.log(typeof sb.val());
                options.model.set(options.dataid, sb.val());
            });

            label.append(sb.get());
            return label;
        },
        createRadioButton: function (options) {
            var radioDiv = $('<div>').addClass('radio');
            var label = radioDiv.append($('<label>'));
            var radio = $('<input type="radio">')
                          .attr('name', options.name)
                          .attr('data-item-id', options.dataid)
                          .val(options.value);
            if (options.model.get(options.dataid) === options.value) {
                radio.attr('checked', 'checked');
            }

            radio.on('change', function () {
                var val = $('input[name="' + options.name + '"]:checked').val();
                options.model.set(options.dataid, val);
            });

            label.append(radio);
            label.append(
              $('<span>')
                  .text(options.label)
            );

            return radioDiv;
        },
        createTextField: function (options) {
            options.maxlength = options.maxlength || 20;
            var tfdiv = $('<div>');
            var tf = $('<input type="text" maxlength="' + options.maxlength + '">');
            tf.attr('data-item-id', options.dataid);
            tf.val(options.model.get(options.dataid));
            tf.addClass('nice-input');
            tf.css({ fontSize: '14px', width: '300px', paddingTop: '0.25em', paddingBottom: '0.25em', webkitBorderRadius: 0, webkitAppearance: 'none' });

            tf.on('change', function () {
                options.model.set(options.dataid, tf.val());
            });

            tfdiv.append(tf);
            return tfdiv;
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
            return $('<label>');
        },
        createText: function (options) {
            return $('<span>').text(options.text);
        }
    };

    return utils;
});
