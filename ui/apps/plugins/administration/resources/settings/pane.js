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

define('plugins/administration/resources/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/disposable',
    'io.ox/core/api/backbone',
    'io.ox/core/tk/list',
    'io.ox/core/api/resource',
    'plugins/administration/resources/settings/toolbar',
    'io.ox/core/tk/list-contextmenu',
    'gettext!io.ox/core',
    'less!plugins/administration/resources/settings/style'
], function (ext, DisposableView, backbone, ListView, resourceAPI, toolbar, Contextmenu, gt) {

    'use strict';

    var GroupListView = ListView.extend(Contextmenu);

    //
    // Entry point
    //

    ext.point('plugins/administration/resources/settings/detail').extend({
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

        className: 'resource-administration',

        events: {
            'dblclick .list-item': 'onDoubleClick'
        },

        onDoubleClick: function (e) {
            var id = $(e.currentTarget).attr('data-cid');
            if (id === '0') return;
            require(['plugins/administration/resources/settings/edit'], function (edit) {
                edit.open({ id: id });
            });
        },

        initialize: function () {

            // define list view component
            this.listView = new GroupListView({ ignoreFocus: true, pagination: false, ref: 'administration/resources/listview' });
            this.listView.toggleCheckboxes(false);
            this.listView.getCompositeKey = function (model) { return model.id; };

            // load all resources
            this.listView.setCollection(resourceAPI.collection);
            this.load();

            // respond to selection change
            this.listenTo(this.listView, 'selection:change', function (items) {
                this.show(items);
                this.toolbar.update(items);
            });

            // respond to model change
            this.listenTo(resourceAPI.collection, 'change', function (model) {
                if (this.model === model) this.renderDetails();
            });

            // toolbar
            this.toolbar = toolbar.create();

            this.on('dispose', function () {
                this.$el.parent().addClass('scrollable-pane').removeClass('abs');
            });
        },

        load: function () {
            // hands up for API consistency; action=all doesn't accept columns. therefore we search for '*'.
            resourceAPI.search('*').done(function (list) {
                if (this.disposed) return;
                resourceAPI.collection.reset(list, { parse: true });
            }.bind(this));
        },

        show: function (items) {
            if (items.length !== 1) return;
            this.model = resourceAPI.getModel(items[0]);
            this.renderDetails();
        },

        renderDetails: function () {

            var description = this.model.get('description'),
                address = (this.model.get('mailaddress') || '').toLowerCase();

            this.$('.detail-pane').empty().append(
                // display name
                $('<h2>').text(this.model.get('display_name')),
                // description
                description ? $('<p style="white-space: pre-line">').text(description) : [],
                // mail address
                address ? $('<p>').append($('<a>').attr('href', 'mailto:' + address).text(address)) : []
            );
        },

        render: function () {
            this.$el.append(
                // headline
                $('<h1>').text(gt('Resources')),
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

    ext.point('administration/resources/listview/item').extend({
        draw: function (baton) {
            this.append(
                $('<div class="bold">').text(baton.model.get('display_name'))
            );
        }
    });

    //
    // Context menu
    //

    var items = [
        { id: 'administration/resources/edit', section: 'organize', title: gt('Edit') },
        { id: 'administration/resources/delete', section: 'organize', title: gt('Delete') }
    ];

    ext.point('administration/resources/listview/contextmenu').extend(
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
