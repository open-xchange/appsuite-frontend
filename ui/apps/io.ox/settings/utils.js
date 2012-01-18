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
        createApplicationIcon: function (icon) {
            return $('<img />')
                      .css({ float: 'left', padding: '0 1em 1em 0' })
                      .attr('src', icon);
        },
        createApplicationTitle: function (title) {
            return $('<div />')
                      .addClass('clear-title')
                      .text(title);
        },
        createSettingsHead: function (app) {
            return $('<div />')
                      .append(utils.createApplicationIcon(app.icon))
                      .append(utils.createApplicationTitle(app.title))
                      .append(utils.createSectionDelimiter());
        },
        createCheckbox: function (dataid, txt, checked) {
            var cb = $('<div>').addClass('checkbox');
            var label = cb.append('<label>');

            label.append(
              $('<input type="checkbox" data-item-id="'+ dataid +'"/>')
                .attr('checked', checked)
            );

            label.append(
              $('<span>')
                .text(txt)
            );

            return cb;
        },
        createSelectbox: function (dataid, labelText, labelValues, selectedVal) {
            var label = $('<label>').addClass('select');
            label.append(
              $('<span>').text(labelText)
            );
            var sb = $('<select>');
            sb.attr('data-item-id', dataid);
            _.each(labelValues, function (val, key) {
              sb.append(
                $('<option>').attr('value', val).text(key)
              );
            });
            sb.find('option[value="'+selectedVal+'"]').attr('selected', 'selected');

            label.append(sb.get());
            return label;
        },
        createInfoText: function (str) {
            return $('<div>')
              .addClass('informational-text')
              .html(str);
        },
        createSection: function () {
          return $('<div>').addClass('section');
        },
        createSectionTitle: function (titleStr) {
          return $('<div>').addClass('sectiontitle').text(titleStr);
        },
        createSectionContent: function () {
          return $('<div>').addClass('sectioncontent');
        },
        createSectionGroup: function () {
          return $('<div>').addClass('section-group');
        },
        createText: function (txt) {
          return $('<span>').text(txt);
        },
        createLabel: function () {
          return $('<label>');
        },
        createRadioButton: function (dataid, labelText, groupName, val, currentValue) {
          var radioDiv = $('<div>').addClass('radio');
          var label = radioDiv.append($('<label>'));
          var radio = $('<input type="radio">')
                        .attr('name', groupName)
                        .attr('data-item-id', dataid)
                        .val(val);
          if (currentValue === val) {
            radio.attr('checked', 'checked');
          }

          label.append(radio);
          label.append(
            $('<span>')
                .text(labelText)
          );

          return radioDiv;
        },
        createTextField: function (dataid, value, maxlength) {
          maxlength = maxlength || 20;
          var tfdiv = $('<div>');
          var tf = $('<input type="text" maxlength="'+maxlength+'">');
          tf.attr('data-item-id', dataid);
          tf.val(value);
          tfdiv.append(tf);
          return tfdiv;
        },
        createLabeledTextField: function (options) {
          var l = utils.createLabel().css({width: '100%', display: 'inline-block'});
          l.append(utils.createText(options.label));
          l.append(utils.createTextField(options.dataId, options.value).css({ width: options.width + 'px', display: 'inline-block'}));
          return l;
        },
        createPasswordField: function (dataid, value, maxlength) {
          maxlength = maxlength || 20;
          var tfdiv = $('<div>');
          var tf = $('<input type="password" maxlength="'+maxlength+'">');
          tf.attr('data-item-id', dataid);
          tf.val(value);
          tfdiv.append(tf);
          return tfdiv;
        },
        createLabeledPasswordField: function (options) {
          var l = utils.createLabel().css({width: '100%', display: 'inline-block'});
          l.append(utils.createText(options.label));
          l.append(utils.createPasswordField(options.dataId, options.value).css({ width: options.width + 'px', display: 'inline-block'}));
          return l;
        },
        createListBox: function () {
          return $('<div>').addClass('listbox');
        },
        createListItem: function (options) {
          options.classStr = options.classStr || 'deletable-item';
          var item = $('<div>');
          item.addClass(options.classStr);
          item.attr('data-item-id', options.dataId);

          item.append($('<div>').text(options.content));

          item.append(
            $('<button>')
              .addClass('close-button')
          );
          return item;
        },
        createListSpacer: function () {
          return $('<div>').addClass('spacer').css({height: '0px'});
        },
        createButton: function (str) {
          return $('<button>').text(str);
        }


    };
    return utils;
});
