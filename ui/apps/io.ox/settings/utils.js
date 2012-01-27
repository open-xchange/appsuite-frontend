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
            return $('<div>')
                      .addClass('settings sectiondelimiter');
        },
        createApplicationIcon: function (options) {
            return $('<img>')
                      .css({ float: 'left', padding: '0 1em 1em 0' })
                      .attr('src', options.icon);
        },
        createApplicationTitle: function (options) {
            return $('<div>')
                      .addClass('clear-title')
                      .text(options.text);
        },
        createSettingsHead: function (app) {
            return $('<div>')
                      .append(utils.createApplicationIcon({icon: app.icon}))
                      .append(utils.createApplicationTitle({text: app.title}))
                      .append(utils.createSectionDelimiter());
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
