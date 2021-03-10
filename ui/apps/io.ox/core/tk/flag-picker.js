/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/flag-picker', [
    'io.ox/mail/api',
    'io.ox/core/folder/api',
    'gettext!io.ox/mail',
    'io.ox/backbone/mini-views/dropdown',
    'less!io.ox/core/tk/flag-picker'
], function (api, folderAPI, gt, Dropdown) {

    'use strict';

    var colorNames = {
        NONE:       gt('None'),
        RED:        gt('Red'),
        BLUE:       gt('Blue'),
        GREEN:      gt('Green'),
        GRAY:       gt('Gray'),
        PURPLE:     gt('Purple'),
        LIGHTGREEN: gt('Light green'),
        ORANGE:     gt('Orange'),
        PINK:       gt('Pink'),
        LIGHTBLUE:  gt('Light blue'),
        YELLOW:     gt('Yellow')
    };

    var order = {
        NONE:        0,
        RED:         1,
        BLUE:        2,
        GREEN:       3,
        GRAY:        4,
        PURPLE:      5,
        LIGHTGREEN:  6,
        ORANGE:      7,
        PINK:        8,
        LIGHTBLUE:   9,
        YELLOW:     10
    };

    var colorLabelIconEmpty = 'fa fa-bookmark-o',
        colorLabelIcon = 'fa fa-bookmark';

    var preParsed = {
        div: $('<div>'),
        list: $('<ul class="dropdown-menu" role="menu">'),
        listItem: $('<li>'),
        menuItemLink: $('<a href="#" role="menuitem" class="io-ox-action-link">'),
        flag: $('<span class="flag-example" aria-hidden="true">'),
        setColorLink: $('<a href="#">').attr('aria-label', gt('Set color')),
        dropdownIcon: $('<i class="flag-dropdown-icon" aria-hidden="true">').attr('title', gt('Set color'))
    };

    var that = {

        appendDropdown: function (node, data) {
            node.addClass('dropdown-toggle');
            node.parent().addClass('dropdown flag-picker');

            var list = preParsed.list.clone()
                .on('click', 'a', { data: data }, that.change)
                .append(
                    _(order).map(function (index, color) {
                        // alternative: api.COLORS for rainbow colors
                        return preParsed.listItem.clone().append(
                            preParsed.menuItemLink.clone().append(
                                index > 0 ? preParsed.flag.clone().addClass('flag_bg_' + index) : $(),
                                $.txt(colorNames[color])
                            )
                            .attr({
                                'data-color': index,
                                'data-action': 'color-' + color.toLowerCase()
                            })
                        );
                    })
                );

            new Dropdown({
                el: node.parent(),
                $toggle: node,
                $ul: list
            }).render();
        },

        draw: function (node, baton) {

            var data = baton.data,
                // to fix buggy -1
                color = Math.max(0, data.color_label || 0),
                link;

            node.append(
                preParsed.div.clone().append(
                    link = preParsed.setColorLink.clone()
                    .append(
                        preParsed.dropdownIcon.clone().attr({
                            'data-color': color,
                            'title': gt('Set color')
                        })
                        .addClass('flag_' + color + ' ' + (color ? colorLabelIcon : colorLabelIconEmpty))
                    )
                )
            );

            this.appendDropdown(link, data);

            // listen for change event
            if (baton.view) baton.view.listenTo(baton.model, 'change:color_label', this.update);
        },

        change: function (e) {
            e.preventDefault();

            var data = e.data.data,
                color = $(e.currentTarget).attr('data-color') || '0';

            data = folderAPI.ignoreSentItems(data);
            api.changeColor(data, color).then(function () {
                if (e.clientX && e.clientY) return;
                $('.io-ox-mail-window:visible .list-item[tabindex="0"]').trigger('focus');
            });
        },

        update: function (model) {
            // set proper icon class
            var color = Math.max(0, model.get('color_label') || 0);
            var className = 'flag-dropdown-icon ';
            className += color === 0 ? colorLabelIconEmpty : colorLabelIcon;
            className += ' flag_' + color;
            this.$el.find('.flag-dropdown-icon').attr({ 'class': className, 'data-color': color });
        },

        // attach flag-picker behavior on existing node
        attach: function (node, options) {
            this.appendDropdown(node, options.data);
        },

        colorName: function (val) {
            if (!_.isNumber(val)) return;
            return colorNames[_.invert(order)[val]];
        }
    };

    return that;
});
