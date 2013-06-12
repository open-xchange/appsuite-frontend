/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/filter/form-elements',
    ['gettext!io.ox/settings/settings'], function (gt) {

    'use strict';

    return {
        drawInputfieldTest: function (activeValue) {
            return $('<input>').attr({ type: 'text', 'data-action': 'change-text-test'}).val(activeValue);
        },

        drawInputfieldTestSecond: function (activeValue, label) {
            return $('<label>').text(label = label ? label : '').append(
                $('<input>').attr({ type: 'text', 'data-action': 'change-text-test-second'}).val(activeValue)
            );
        },

        drawInputfieldAction: function (activeValue) {
            return $('<input>').attr({ type: 'text', 'data-action': 'change-text-action'}).val(activeValue);
        },

        drawDisabledInputfield: function (activeValue) {
            return $('<input>').attr({ type: 'text', disabled: 'disabled', title: activeValue, 'data-action': 'change-text-action'}).val(activeValue);
        },

        drawFolderSelect: function () {
            return $('<a href="#">').addClass('folderselect').text('Select folder');
        },

        drawDeleteButton: function (type) {
            return $('<a href="#" class="close" data-action="remove-' + type + '">').append($('<i class="icon-trash"/>'));
        },

        drawOptions: function (activeValue, values) {

            var active = values[activeValue];
            return $('<div class="action dropdown value">').append(
                $('<a href="#" class="dropdown-toggle" data-toggle="dropdown">').text(active),
                $('<ul class="dropdown-menu" role="menu">').append(
                    _(values).map(function (name, value) {
                        return $('<li>').append(
                            $('<a>', { href: '#', 'data-action': 'change-value', 'data-value': value}).append(
                                $.txt(name)
                            )
                        );
                    })
                )
            );
        },

        drawOptionsExtern: function (activeValue, values, options) {

            var active = values[activeValue] || activeValue;
            return $('<div class="action ' + options.toggle + ' value ">').addClass(options.classes).append(
                $('<a href="#" class="dropdown-toggle" data-toggle="dropdown">').text(active),
                $('<ul class="dropdown-menu" role="menu">').append(
                    _(values).map(function (name, value) {
                        return $('<li>').append(
                            $('<a>', { href: '#', 'data-action': 'change-value-extern', 'data-value': value}).data(options).append(
                                $.txt(name)
                            )
                        );
                    })
                )
            );
        },

        drawOptionsActions: function (activeValue, values) {

            var active = values[activeValue];
            return $('<div class="action dropdown value">').append(
                $('<a href="#" class="dropdown-toggle" data-toggle="dropdown">').text(active),
                $('<ul class="dropdown-menu">').append(
                    _(values).map(function (name, value) {
                        return $('<li>').append(
                            $('<a>', { href: '#', 'data-action': 'change-value-actions', 'data-value': value}).append(
                                $.txt(name)
                            )
                        );
                    })
                )
            );
        },

        drawColorDropdown: function (activeColor, colors, colorflags) {

            function changeLabel(e) {
                e.preventDefault();
                $(this).closest('.flag-dropdown').attr('data-color-value', e.data.color).removeClass(e.data.flagclass).addClass('flag_' + e.data.color);
            }

            var flagclass = 'flag_' + colorflags[activeColor];
            return $('<div class="dropdown flag-dropdown clear-title flag">').attr({'data-color-value': activeColor})
            .addClass(flagclass)
            .append(
                // box
                $('<a href="#" class="abs dropdown-toggle" data-toggle="dropdown">'),
                // drop down
                $('<ul class="dropdown-menu" role="menu">')
                .append(
                    _(colors).map(function (colorObject) {
                        return $('<li>').append(
                            $('<a href="#">').attr({'data-action': 'change-color'}).append(
                                colorObject.value > 0 ? $('<span class="flag-example">').addClass('flag_' + colorObject.value) : $(),
                                $.txt(colorObject.text)
                            )
                            .on('click', { color: colorObject.value, flagclass: flagclass }, changeLabel)
                        );
                    })
                )
            );
        },

        drawcheckbox: function (value) {
            return $('<div>').addClass('control-group').append(
                $('<div>').addClass('controls'),
                $('<label>').addClass('checkbox').text(gt('Process subsequent rules even when this rule matches')).append(
                $('<input type="checkbox">').attr({'data-action': 'check-for-stop', 'checked': value})
                )
            );
        }
    };
});