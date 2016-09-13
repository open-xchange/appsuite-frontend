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

define('io.ox/mail/categories/picker', [
    'io.ox/core/extPatterns/actions',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'less!io.ox/core/tk/flag-picker'
], function (actions, settings, gt) {

    'use strict';

    var preParsed = {
        div: $('<div>'),
        list: $('<ul class="dropdown-menu" role="menu">'),
        listItem: $('<li>'),
        menuItemAction: $('<a href="#" role="menuitem" class="category">'),
        menuItemLink: $('<a href="#" role="menuitem" class="link">'),
        dropdownIcon: $('<i class="fa fa-fw">')
    };

    var that = {

        intitialize: function (options) {
            if (that.app) return;
            _.extend(that, options);
        },

        isReady: function () {
            return !!(that.app && that.app.categories && that.app.categories.initialized);
        },

        appendDropdown: function (node, data) {
            if (!that.isReady()) return;

            var list = _.filter(settings.get('categories/list'), function (item) {
                return item.active;
            });
            var current = that.app.categories.props.get('selected');

            node.after(
                // drop down
                preParsed.list.clone()
                .on('click', 'a.category', { data: data }, that.change)
                .on('click', 'a.link', { data: data }, that.link)
                .append($('<li class="dropdown-header" role="separator">').text(gt('Move to category')))
                .append(
                    _(list).map(function (category) {
                        // alternative: api.COLORS for rainbow colors
                        return preParsed.listItem.clone().append(
                            preParsed.menuItemAction.clone().append(
                                $.txt(category.name)
                            )
                            .attr('data-category', category.id)
                            .addClass(category.id === current ? 'disabled' : '')
                        );
                    })
                )
                .append('<li class="divider" role="separator">')
                .append(
                    preParsed.listItem.clone().append(
                        preParsed.menuItemLink.clone().append(
                            //#. term is followed by a space and three dots (' …')
                            gt('Move to folder') + ' …'
                        )
                    )
                )
            );

            node.addClass('dropdown-toggle').attr({
                'aria-haspopup': 'true',
                'data-toggle': 'dropdown',
                'role': 'button'
            });

            node.parent().addClass('dropdown category-picker');
        },

        link: function (e) {
            if (!that.isReady()) return;
            var baton = e.data;
            actions.check('io.ox/mail/actions/move', baton.data).done(function () {
                actions.invoke('io.ox/mail/actions/move', null, baton);
            });

            e.preventDefault();
        },

        change: function (e) {
            if (!that.isReady()) return;

            e.preventDefault();
            if ($(e.target).hasClass('disabled')) return;

            var data = e.data.data,
                category = $(e.currentTarget).attr('data-category') || '0',
                name = $(e.currentTarget).text(),
                node = $(this).closest('.category-picker');
            that.app.categories.move({ data: data, target: category, targetname: name });

            node.find('.dropdown-toggle').focus();
        },

        // attach flag-picker behavior on existing node
        attach: function (node, options) {
            this.intitialize(options);
            this.appendDropdown(node, [].concat(options.data));
        }
    };

    return that;
});
