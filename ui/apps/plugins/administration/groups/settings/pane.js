/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('plugins/administration/groups/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/disposable',
    'io.ox/core/api/backbone',
    'io.ox/core/tk/list',
    'io.ox/core/api/group',
    'plugins/administration/groups/settings/members',
    'plugins/administration/groups/settings/toolbar',
    'io.ox/core/tk/list-contextmenu',
    'gettext!io.ox/core',
    'less!plugins/administration/groups/settings/style'
], function (ext, DisposableView, backbone, ListView, groupAPI, members, toolbar, Contextmenu, gt) {

    'use strict';

    var GroupListView = ListView.extend(Contextmenu);

    //
    // Entry point
    //

    ext.point('plugins/administration/groups/settings/detail').extend({
        draw: function () {
            this.removeClass('scrollable-pane').addClass('abs').append(
                new View().render().$el
            );
        }
    });

    //
    // Main view
    //

    var View = DisposableView.extend({

        className: 'group-administration',

        events: {
            'dblclick .list-item': 'onDoubleClick'
        },

        onDoubleClick: function (e) {
            var id = $(e.currentTarget).attr('data-cid');
            // "All users" and "Guests" cannot be edited
            if (id === '0' || id === '2147483647') return;
            require(['plugins/administration/groups/settings/edit'], function (edit) {
                edit.open({ id: id });
            });
        },

        initialize: function () {

            // define list view component
            this.listView = new GroupListView({ ignoreFocus: true, pagination: false, ref: 'administration/groups/listview' });
            this.listView.toggleCheckboxes(false);
            this.listView.getCompositeKey = function (model) { return model.id; };

            // load all groups
            this.listView.setCollection(groupAPI.collection);
            this.load();

            // respond to selection change
            this.listenTo(this.listView, 'selection:change', function (items) {
                this.show(items);
                this.toolbar.update(items);
            });

            // respond to model change
            this.listenTo(groupAPI.collection, 'change', function (model) {
                this.$('.detail-pane h2').text(model.get('display_name'));
            });

            // toolbar
            this.toolbar = toolbar.create();

            this.on('dispose', function () {
                this.$el.parent().addClass('scrollable-pane').removeClass('abs');
            });
        },

        load: function () {
            groupAPI.getAll({ columns: '1,700,701,702' }, false).done(function (list) {
                if (this.disposed) return;
                groupAPI.collection.reset(list, { parse: true });
            }.bind(this));
        },

        show: function (items) {

            if (items.length !== 1) return;
            var model = groupAPI.getModel(items[0]);

            this.$('.detail-pane').empty().append(
                // display name
                $('<h2>').text(model.get('display_name')),
                // members
                new members.View({ model: model }).render().$el
            );
        },

        render: function () {
            this.$el.append(
                // headline
                $('<h1>').text(gt('Groups')),
                // toolbar
                this.toolbar.render().update().$el,
                // below toolbar
                $('<div class="abs below-toolbar">').append(
                    this.listView.render().$el.addClass('leftside'),
                    $('<div class="rightside detail-pane">')
                )
            );
            return this;
        }
    });

    //
    // List view item
    //

    ext.point('administration/groups/listview/item').extend({
        draw: function (baton) {

            var length = baton.model.get('members').length;

            this.append(
                // display name
                $('<div class="bold">').text(baton.model.get('display_name')),
                // number of members
                $('<div class="gray">').text(
                    //#. %1$d is the number of members
                    gt.ngettext('%1$d member', '%1$d members', length, length)
                )
            );
        }
    });

    //
    // Context menu
    //

    var items = [
        { id: 'administration/groups/edit', section: 'organize', title: gt('Edit') },
        { id: 'administration/groups/delete', section: 'organize', title: gt('Delete') }
    ];

    ext.point('administration/groups/listview/contextmenu').extend(
        items.map(function (item, index) {
            return _.extend({
                id: item.id,
                index: (index + 1) * 100,
                title: item.title,
                ref: item.id,
                section: item.section
            }, item);
        })
    );

});
