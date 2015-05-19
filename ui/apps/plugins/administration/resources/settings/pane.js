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

define('plugins/administration/resources/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/disposable',
    'io.ox/core/api/backbone',
    'io.ox/core/tk/list',
    'io.ox/core/api/resource',
    'plugins/administration/resources/settings/toolbar',
    'gettext!io.ox/core',
    'less!plugins/administration/resources/settings/style'
], function (ext, DisposableView, backbone, ListView, resourceAPI, toolbar, gt) {

    'use strict';

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
            this.listView = new ListView({ ignoreFocus: true, pagination: false, ref: 'administration/resources/listview' });
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

});
