/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/administration/groups/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/disposable',
    'io.ox/core/api/backbone',
    'io.ox/core/tk/list',
    'io.ox/core/api/group',
    'plugins/administration/groups/settings/members',
    'plugins/administration/groups/settings/toolbar',
    'gettext!io.ox/core',
    'less!plugins/administration/groups/settings/style'
], function (ext, DisposableView, backbone, ListView, groupAPI, members, toolbar, gt) {

    'use strict';

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
            if (id === '0') return;
            require(['plugins/administration/groups/settings/edit'], function (edit) {
                edit.open({ id: id });
            });
        },

        initialize: function () {

            // define list view component
            this.listView = new ListView({ ignoreFocus: true, pagination: false, ref: 'administration/groups/listview' });
            this.listView.toggleCheckboxes(false);
            this.listView.getCID = function (model) { return model.id; };

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
                this.$('.detail-pane h1').text(model.get('display_name'));
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
                // // last modified
                // $('<div class="last_modified">').text(gt('Last modified: %1$s', '21.02.2015'))
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
                    gt.format(gt.ngettext('%1$d member', '%1$d members', length), length)
                )
            );
        }
    });

});
