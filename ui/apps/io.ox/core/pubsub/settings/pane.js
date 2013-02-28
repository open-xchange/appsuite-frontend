/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2013
 * Mail: info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/pubsub/settings/pane',
        ['io.ox/core/extensions',
         'io.ox/core/pubsub/model',
         'io.ox/backbone/views',
         'settings!io.ox/core/pubsub',
         'gettext!io.ox/core/pubsub',
         'less!io.ox/core/pubsub/style.less'
        ],
         function (ext, model, views, settings, gt) {

    'use strict';

    var point = views.point('io.ox/core/pubsub/settings/list'),
        SettingView = point.createView({className: 'pubsub settings'}),
        items = new model.PubSubItems();

    ext.point('io.ox/core/pubsub/settings/detail').extend({
        index: 100,
        id: 'extensions',
        draw: function (point) {
            this.append(
                $('<div class="clear-title">').text(point.title),
                $('<div class="settings sectiondelimiter">')
            );
            new SettingView({model: items.fetch()}).render().$el.appendTo(this);
        }
    });

    ext.point('io.ox/core/pubsub/settings/list/itemview').extend({
        id: 'itemview',
        draw: function (baton) {
            var data = baton.model.toJSON();

            this[data.enabled ? 'removeClass' : 'addClass']('disabled');

            this.append(
                $('<span>').addClass('content pull-left')
                .addClass(data.enabled ? '' : 'disabled').append(
                    $('<div>').text(data.displayName),
                    $('<div>').text(data.folder)
                ),
                $('<a href="#" class="close" data-action="remove">').html('&times;')
            );

            if (data.enabled) {
                this.append(
                    $('<a href="#" class="action" data-action="toggle">').text(gt('Disable'))
                );
            } else {
                this.append(
                    $('<a href="#" class="action" data-action="toggle">').text(gt('Enable'))
                );
            }
        }
    });

    var PubSubItem = Backbone.View.extend({
        tagName: 'li',
        className: '',
        events: {
            'click [data-action="toggle"]': 'onToggle',
            'click [data-action="remove"]': 'onRemove'
        },
        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });
            ext.point('io.ox/core/pubsub/settings/list/itemview').invoke('draw', this.$el.empty(), baton);
            return this;
        },
        onToggle: function (ev) {
            ev.preventDefault();
            this.model.set('enabled', !this.model.get('enabled')).save().fail(function (res) {
                res.model.set('enabled', !res.model.get('enabled'));
            });
            this.render();
        },
        onRemove: function (ev) {
            ev.preventDefault();
            this.model.collection.remove(this.model);
            this.remove();
        }
    });

    function createPubSubItem(model) {
        return new PubSubItem({model: model});
    }

    point.extend({
        id: 'content',
        render: function () {
            var listNode = $('<ul>');

            this.model.done(function (res) {
                res.each(function (obj) {
                    listNode.append(
                        createPubSubItem(obj).render().el
                    );
                });
            });
            listNode.appendTo(this.$el);
        }
    });
});
