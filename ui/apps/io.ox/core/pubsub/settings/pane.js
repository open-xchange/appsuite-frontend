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
        SettingView = point.createView({className: 'pubsub settings'});

    ext.point('io.ox/core/pubsub/settings/detail').extend({
        index: 100,
        id: 'extensions',
        draw: function (point) {
            this.append(
                $('<div class="clear-title">').text(point.title),
                $('<div class="settings sectiondelimiter">')
            );
            new SettingView({publications: model.publications(), subscriptions: model.subscriptions()}).render().$el.appendTo(this);
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
                $('<a href="#" class="action" data-action="edit">').text(gt('Edit')),
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
            'click [data-action="edit"]': 'onEdit',
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
        onEdit: function (ev) {
            var baton = ext.Baton({model: this.model, view: this});
            ev.preventDefault();
            require(['io.ox/core/pubsub/publications'], function (pubsubViews) {
                pubsubViews.buildPublishDialog(baton);
            });
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
            var baton = this.baton;
            baton.pubListNode = $('<ul>').addClass('publications');
            baton.subListNode = $('<ul>').addClass('subscriptions');
            this.$el.append(baton.pubListNode);
            this.$el.append(baton.subListNode);

            this.baton.publications.done(function (model) {
                model.on('add', function (model) {
                    baton.pubListNode.append(
                        createPubSubItem(model).render().el
                    );
                });
            });
            this.baton.subscriptions.done(function (model) {
                model.on('add', function (model) {
                    baton.subListNode.append(
                        createPubSubItem(model).render().el
                    );
                });
            });
        }
    });
});
