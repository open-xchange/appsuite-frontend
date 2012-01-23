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
define('io.ox/settings/utils',
      ['less!io.ox/settings/style.css'], function () {
   
    'use strict';
    var utils = {
        createSectionDelimiter: function () {
            return $('<div />')
                      .addClass('settings sectiondelimiter');
        },
        createApplicationIcon: function (options) {
            return $('<img />')
                      .css({ float: 'left', padding: '0 1em 1em 0' })
                      .attr('src', options.icon);
        },
        createApplicationTitle: function (options) {
            return $('<div />')
                      .addClass('clear-title')
                      .text(options.text);
        },
        createSettingsHead: function (app) {
            return $('<div />')
                      .append(utils.createApplicationIcon({icon: app.icon}))
                      .append(utils.createApplicationTitle({text: app.title}))
                      .append(utils.createSectionDelimiter());
        },
        createCheckbox: function (options) {
            var cbdiv = $('<div>').addClass('checkbox');
            var label = cbdiv.append('<label>');
            var cb = $('<input type="checkbox" data-item-id="' + options.dataid + '"/>')
                        .attr('checked', options.model.get(options.dataid));

            cb.on('change', function (evt) {
                var val =  (typeof cb.attr('checked') !== 'undefined') ? true: false;
                console.log(options.dataid + ":" + val);
                options.model.set(options.dataid, val);
            });

            label.append(cb);
            label.append(
              $('<span>')
                .text(options.label)
            );

            return cbdiv;
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
        createInfoText: function (options) {
            var d = $('<div>').addClass('informational-text');
            if(options.html) {
                d.html(options.html);
            } else {
                d.text(options.text);
            }
            return d;
        },
        createSection: function () {
          return $('<div>').addClass('section');
        },
        createSectionTitle: function (options) {
          return $('<div>').addClass('sectiontitle').text(options.text);
        },
        createSectionContent: function () {
          return $('<div>').addClass('sectioncontent');
        },
        createSectionGroup: function () {
          return $('<div>').addClass('section-group');
        },
        createText: function (options) {
          return $('<span>').text(options.text);
        },
        createLabel: function () {
          return $('<label>');
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
        createLabeledPasswordField: function (options) {
            var l = utils.createLabel().css({width: '100%', display: 'inline-block'});
            l.append(utils.createText({text: options.label}));
            l.append(utils.createPasswordField({dataid: options.dataid, value: options.value, model: options.model, validator: options.validator}).css({ width: options.width + 'px', display: 'inline-block'}));
            return l;
        },
        createListBox: function (options) {
            var ldiv = $('<div>').addClass('listbox');
            ldiv.append(utils.createListSpacer());
            _.each(options.model.get(options.dataid), function (item, k) {
                console.log(k + ':' + item.dataid);
                ldiv.append(utils.createListItem({dataid: item.dataid, html: item.html}));
            });
            ldiv.append(utils.createListSpacer());
            return ldiv;
        },

        createListItem: function (options) {
            options.classStr = options.classStr || 'deletable-item';
            var item = $('<div>');
            item.addClass(options.classStr);
            item.attr('data-item-id', options.dataid);

            item.append($('<div>').html(options.html));

            item.append(
              $('<button>')
                .addClass('close-button')
            );

            item.on('click', function () {
                console.log('click');
                item.parent().find('div[selected="selected"]').attr('selected', null);
                item.attr('selected', 'selected');
            });


            return item;
        },
        createListSpacer: function () {
            return $('<div>').addClass('spacer').css({height: '0px'});
        },
        createButton: function (options) {
            return $('<button>').text(options.label);
        }


    };
    return utils;
});
