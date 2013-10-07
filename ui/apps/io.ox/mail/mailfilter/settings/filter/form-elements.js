/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/filter/form-elements', ['gettext!io.ox/settings/settings'], function (gt) {

    'use strict';

    return {
        drawInputfieldTest: function (activeValue) {
            return $('<input class="form-control">').attr({ type: 'text', 'data-action': 'change-text-test', 'tabindex': '1'}).val(activeValue);
        },

        drawInputfieldTestSecond: function (activeValue, label) {
            var inputid = _.uniqueId('change-text-test-second');
            return [
                $('<label>').attr('for', inputid).text(label = label ? label : ''),
                $('<div>').addClass('first-label inline-input ').append(
                    $('<input class="form-control">').attr({ id: inputid, type: 'text', 'data-action': 'change-text-test-second', 'tabindex': '1'}).val(activeValue)
                )
            ];
        },

        drawInputfieldAction: function (activeValue) {
            return $('<input class="form-control">').attr({ type: 'text', 'data-action': 'change-text-action', 'tabindex': '1'}).val(activeValue);
        },

        drawDisabledInputfield: function (activeValue) {
            return $('<input class="form-control">').attr({ type: 'text', disabled: 'disabled', title: activeValue, 'data-action': 'change-text-action', 'tabindex': '1'}).val(activeValue);
        },

        drawFolderSelect: function () {
            return $('<a href="#" tabindex="1">').addClass('folderselect').text(gt('Select folder'));
        },

        drawDeleteButton: function (type) {
            return $('<a href="#" class="remove" tabindex="1" data-action="remove-' + type + '">').append($('<i class="icon-trash">'));
        },

        drawOptions: function (activeValue, values) {

            var active = values[activeValue];
            return $('<div class="action dropdown value">').append(
                $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="1">').text(active),
                $('<ul class="dropdown-menu" role="menu">').append(
                    _(values).map(function (name, value) {
                        return $('<li>').append(
                            $('<a>', { href: '#', 'data-action': 'change-value', 'data-value': value, 'tabindex': '1'}).append(
                                $.txt(name)
                            )
                        );
                    })
                )
            );
        },

        drawOptionsExtern: function (activeValue, values, options) {

            var active = values[activeValue] || activeValue;
            if (options.caret) {
                active = active + '<b class="caret">';
            }
            return $('<div class="action ' + options.toggle + ' value ">').addClass(options.classes).append(
                $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="1">').html(active),
                $('<ul class="dropdown-menu" role="menu">').append(
                    _(values).map(function (name, value) {
                        return $('<li>').append(
                            $('<a>', { href: '#', 'data-action': 'change-value-extern', 'data-value': value, 'tabindex': '1'}).data(options).append(
                                $.txt(name)
                            )
                        );
                    })
                )
            );
        },

        drawOptionsActions: function (activeValue, values, classes) {

            var active = values[activeValue];
            classes = classes ? classes : '';
            return $('<div class="action dropdown value ' + classes + '">').append(
                $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="1">').text(active),
                $('<ul class="dropdown-menu">').append(
                    _(values).map(function (name, value) {
                        return $('<li>').append(
                            $('<a>', { href: '#', 'data-action': 'change-value-actions', 'data-value': value, 'tabindex': '1'}).append(
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
                $('<a href="#" class="abs dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="1">'),
                // drop down
                $('<ul class="dropdown-menu" role="menu">')
                .append(
                    _(colors).map(function (colorObject) {
                        return $('<li>').append(
                            $('<a href="#">').attr({'data-action': 'change-color', 'tabindex': '1'}).append(
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
            return $('<div>').addClass('control-group mailfilter').append(
                $('<div>').addClass('controls'),
                $('<label>').addClass('checkbox').text(gt('Process subsequent rules')).append(
                    $('<input type="checkbox" tabindex="1   ">').attr({'data-action': 'check-for-stop', 'checked': value})
                )
            );
        }
    };
});
