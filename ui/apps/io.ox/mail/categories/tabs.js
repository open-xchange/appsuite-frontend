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

define('io.ox/mail/categories/tabs', [
    'io.ox/mail/categories/api',
    'io.ox/mail/api',
    'io.ox/backbone/mini-views/helplink',
    'io.ox/core/yell',
    'io.ox/core/tk/list-dnd',
    'gettext!io.ox/mail'
], function (api, mailAPI, HelpLinkView, yell, dnd, gt) {

    'use strict';

    var TabView = Backbone.View.extend({

        tagName: 'ul',
        className: 'classic-toolbar categories',

        events: {
            'click .category button': 'onChangeTab',
            'contextmenu': 'onConfigureCategories',
            'dblclick': 'onConfigureCategories',
            'selection:drop': 'onMove',
            'mousedown .category button': 'respondToNonKeyboardFocus',
            'blur .category button': 'respondToNonKeyboardFocus'
        },

        initialize: function (options) {

            // reference to app props
            this.props = options.props;
            this.collection = api.collection;

            // a11y
            this.$el.attr({ 'role': 'toolbar', 'aria-label': gt('Inbox categories') });

            // dnd
            dnd.enable({ draggable: true, container: this.$el, selection: this.selection, delegate: true, dropzone: true, dropzoneSelector: '.category' });

            // register events
            this.listenTo(api, 'move', this.openTrainNotification);
            this.listenTo(this.collection, 'update reset change', _.debounce(this.render, 200));
            this.listenTo(this.props, 'change:category_id', this.onCategoryChange);
        },

        respondToNonKeyboardFocus: function (e) {
            if (e.type === 'focusout') return $(e.currentTarget).removeAttr('style');
            // blur event won't get triggered so we reset style for all first
            this.$('.category button').removeAttr('style');
            $(e.currentTarget).css({
                'border-bottom': '1px solid white',
                'background': 'white'
            });
        },

        render: function () {

            var current = this.props.get('category_id');

            this.$el.empty().append(
                this.collection.map(function (model) {
                    return $('<li class="category" role="presentation">').append(
                        $('<button type="button" class="btn btn-link" draggable="false" tabindex="-1">').append(
                            $('<span class="category-name">').text(model.get('name')),
                            $('<span class="category-counter">').append(
                                $('<span class="counter">').text(model.getCount()),
                                $('<span class="sr-only">').text(gt('Unread messages'))
                            )
                        ),
                        $('<div class="category-drop-helper" aria-hidden="true">').text(gt('Drop here'))
                    )
                    .toggle(model.isEnabled())
                    .toggleClass('selected', model.get('id') === current)
                    .attr({ 'data-id': model.get('id') });
                }),
                $('<li class="free-space" aria-hidden="true">'),
                this.getHelpViewIcon()

            );
            this.$el.find('li:first > button').removeAttr('tabindex');
            return this;
        },

        getHelpViewIcon: function () {
            return $('<li class="help" role="presentation">').append(
                new HelpLinkView({
                    href: 'ox.appsuite.user.sect.email.manage.categories.html',
                    context: gt('Inbox categories')
                })
                .render().$el
            );
        },

        onChangeTab: function (e) {
            var id = $(e.currentTarget).parent().attr('data-id');
            this.props.set('category_id', id);
        },

        onCategoryChange: function (props, id) {
            this.$('.category.selected').removeClass('selected');
            this.$('.category[data-id="' + id + '"]').addClass('selected');
        },

        onConfigureCategories: function (e) {
            e.preventDefault();
            require(['io.ox/mail/categories/edit'], function (dialog) {
                dialog.open();
            });
        },

        onMove: function (e, baton) {

            // prevent execution of copy/move handler
            e.stopPropagation();

            var source = this.props.get('category_id'),
                target = baton.target,
                options = {
                    data: mailAPI.resolve(baton.data),
                    source: source,
                    sourcename: this.collection.get(source).get('name'),
                    target: target,
                    targetname: this.collection.get(target).get('name')
                };

            api.move(options).fail(yell);
        },

        openTrainNotification: function (options) {
            require(['io.ox/mail/categories/train'], function (dialog) {
                dialog.open(options);
            });
        }
    });

    return TabView;
});
