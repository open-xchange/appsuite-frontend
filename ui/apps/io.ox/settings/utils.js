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
         // just for the calendar app in here
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
        }

    };

    return utils;
});
