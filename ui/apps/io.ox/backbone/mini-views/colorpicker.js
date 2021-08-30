/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/backbone/mini-views/colorpicker', [
    'io.ox/backbone/mini-views/dropdown',
    'gettext!io.ox/core',
    'less!io.ox/backbone/mini-views/colorpicker'
], function (DropdownView, gt) {

    'use strict';

    var defaultColors = [
            // smaller palette without bright colors that don't have enough contrast
            //#. color names for screenreaders
            { value: '#000000', name: gt('Black') }, { value: '#993300', name: gt('Burnt orange') }, { value: '#333300', name: gt('Dark olive') }, { value: '#003300', name: gt('Dark green') }, { value: '#003366', name: gt('Dark azure') }, { value: '#000080', name: gt('Navy Blue') }, { value: '#333399', name: gt('Indigo') }, { value: '#333333', name: gt('Very dark gray') },
            { value: '#800000', name: gt('Maroon') }, { value: '#FF6600', name: gt('Orange') }, { value: '#808000', name: gt('Olive') }, { value: '#008000', name: gt('Green') }, { value: '#008080', name: gt('Teal') }, { value: '#0000FF', name: gt('Blue') }, { value: '#666699', name: gt('Grayish blue') }, { value: '#808080', name: gt('Gray') },
            { value: '#FF0000', name: gt('Red') }, { value: '#FF9900', name: gt('Amber') }, { value: '#99CC00', name: gt('Yellow green') }, { value: '#339966', name: gt('Sea green') }, { value: '#33CCCC', name: gt('Turquoise') }, { value: '#3366FF', name: gt('Royal blue') }, { value: '#800080', name: gt('Purple') }, { value: '#999999', name: gt('Medium gray') },
            { value: '#FF00FF', name: gt('Magenta') }, { value: '#FFCC00', name: gt('Gold') }, { value: '#00CCFF', name: gt('Sky blue') }, { value: '#993366', name: gt('Red violet') },
            { value: '#FF99CC', name: gt('Pink') }, { value: '#99CCFF', name: gt('Light sky blue') }, { value: '#CC99FF', name: gt('Plum') }, { value: 'transparent', name: gt('No color') }
            /* full tiny mce color palette
            { value: '#000000', name: gt('Black') }, { value: '#993300', name: gt('Burnt orange') }, { value: '#333300', name: gt('Dark olive') }, { value: '#003300', name: gt('Dark green') }, { value: '#003366', name: gt('Dark azure') }, { value: '#000080', name: gt('Navy Blue') }, { value: '#333399', name: gt('Indigo') }, { value: '#333333', name: gt('Very dark gray') },
            { value: '#800000', name: gt('Maroon') }, { value: '#FF6600', name: gt('Orange') }, { value: '#808000', name: gt('Olive') }, { value: '#008000', name: gt('Green') }, { value: '#008080', name: gt('Teal') }, { value: '#0000FF', name: gt('Blue') }, { value: '#666699', name: gt('Grayish blue') }, { value: '#808080', name: gt('Gray') },
            { value: '#FF0000', name: gt('Red') }, { value: '#FF9900', name: gt('Amber') }, { value: '#99CC00', name: gt('Yellow green') }, { value: '#339966', name: gt('Sea green') }, { value: '#33CCCC', name: gt('Turquoise') }, { value: '#3366FF', name: gt('Royal blue') }, { value: '#800080', name: gt('Purple') }, { value: '#999999', name: gt('Medium gray') },
            { value: '#FF00FF', name: gt('Magenta') }, { value: '#FFCC00', name: gt('Gold') }, { value: '#FFFF00', name: gt('Yellow') }, { value: '#00FF00', name: gt('Lime') }, { value: '#00FFFF', name: gt('Aqua') }, { value: '#00CCFF', name: gt('Sky blue') }, { value: '#993366', name: gt('Red violet') }, { value: '#FFFFFF', name: gt('White') },
            { value: '#FF99CC', name: gt('Pink') }, { value: '#FFCC99', name: gt('Peach') }, { value: '#FFFF99', name: gt('Light yellow') }, { value: '#CCFFCC', name: gt('Pale green') }, { value: '#CCFFFF', name: gt('Pale cyan') }, { value: '#99CCFF', name: gt('Light sky blue') }, { value: '#CC99FF', name: gt('Plum') }, { value: 'transparent', name: gt('No color') }*/
        ],
        colorpicker = DropdownView.extend({
            setup: function (options) {
                var grid = $('<tbody>');
                options.$ul = $('<table class="dropdown-menu colorpicker-table" role="list">').append(grid);
                // dropdown does detach and attach to ensure event bubbling, but this breaks the event listeners (every color can only be selected once), so prevent it.
                options.noDetach = true;

                // call parent function
                colorpicker.__super__.setup.call(this, options);

                this.options = _.extend({ defaultColors: defaultColors, itemsPerRow: 8 }, options);
                var rows = [];
                for (var row = 0; row < this.options.defaultColors.length / this.options.itemsPerRow; row++) {
                    rows.push($('<tr role="presentation">'));
                    for (var i = 0; i < this.options.itemsPerRow; i++) {
                        var color = this.options.defaultColors[row * this.options.itemsPerRow + i];
                        if (!color) break;
                        var item;
                        rows[row].append(
                            $('<td role="listitem">').append(
                                item = $('<div tabindex="-1" class="colorpicker-item" role="option">')
                                    .data('value', color.value)
                                    .attr({ 'data-name': this.name, title: color.name, 'data-value': color.value })
                                    .css('background-color', color.value)
                            )
                        );
                        if (color.value === 'transparent') item.append($('<i class="fa fa-times" aria-hidden="true">'));
                    }
                }
                grid.append(rows);
                this.$ul.on('click', 'td .colorpicker-item', this.onClick.bind(this));
                this.$ul.on('keydown', 'td .colorpicker-item', this.onKeydownItem.bind(this));
            },
            setDropdownOverlay: function () {
                colorpicker.__super__.setDropdownOverlay.call(this);
                // use defer or dropdown toggle focusses the togglebutton again. This results in the closing of the dropdown.
                _.defer(function () {
                    var list = this.$ul.find('td .colorpicker-item'),
                        selected = this.model ? list.filter('[data-value="' + this.model.get(this.name) + '"]') : list;
                    return $(selected.length ? selected : list).first().focus();
                }.bind(this));
            },
            onKeydownItem: function (e) {
                if (e.which === 13) return $(e.target).trigger('click');

                // grid works like a list, same as tinymce color picker.
                if (!/(9|37|38|39|40)/.test(e.which)) return;

                var $target = $(e.target),
                    $list = this.$ul.find('td .colorpicker-item'),
                    index = $list.index($target);

                if (e.which === 37 || e.which === 38 || (e.which === 9 && e.shiftKey)) index--;
                if (e.which === 39 || e.which === 40 || (e.which === 9 && !e.shiftKey)) index++;
                // picker is a tab trap
                if (e.which === 9) e.preventDefault();

                if (index < 0) index += $list.length;
                if (index >= $list.length) index -= $list.length;

                _.defer(function () {
                    $list.eq(index).focus();
                });
            }
        });
    return colorpicker;

});
