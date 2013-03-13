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
         'io.ox/core/api/folder',
         'settings!io.ox/core/pubsub',
         'gettext!io.ox/core/pubsub',
         'less!io.ox/core/pubsub/style.less'
        ],
         function (ext, model, views, folderAPI, settings, gt) {

    'use strict';

    var point = views.point('io.ox/core/pubsub/settings/list'),
        SettingView = point.createView({className: 'pubsub settings'});

    ext.point('io.ox/core/pubsub/settings/detail').extend({
        index: 100,
        id: 'extensions',
        draw: function (baton) {
            this.append(
                $('<div class="clear-title">').text(baton.data.title),
                $('<div class="settings sectiondelimiter">')
            );

            new SettingView({
                publications: model.publications().forFolder({folder: baton.options.folder}),
                subscriptions: model.subscriptions().forFolder({folder: baton.options.folder})
            }).render().$el.appendTo(this);
        }
    });

    // module mapping
    var mapping = { contacts: 'io.ox/contacts', calendar: 'io.ox/calendar', infostore: 'io.ox/files' };

    function createPathInformation(model) {
        var opts = {
            handler: function (id, data) {
                ox.launch(mapping[data.module] + '/main', { folder: id }).done(function () {
                    this.folder.set(id);
                });
            },
            exclude: ['9'], // root folder is useless
            subfolder: false, //don’t show subfolders for last item
            last: false // make last item a link (responding to handler function)
        };

        return folderAPI.getBreadcrumb(model.get('folder') || model.get('entity').folder, opts);
    }

    ext.point('io.ox/core/pubsub/settings/list/itemview').extend({
        id: 'itemview',
        draw: function (baton) {

            var data = baton.model.toJSON(),
                enabled = data.enabled;

            this[enabled ? 'removeClass' : 'addClass']('disabled');

            this.addClass('item').append(
                $('<div class="actions">').append(
                    $('<a href="#" class="close" data-action="remove">').html('&times;'),
                    $('<a href="#" class="action" data-action="edit">').text(gt('Edit')),
                    $('<a href="#" class="action" data-action="toggle">').text(enabled ? gt('Disable') : gt('Enable'))
                ),
                $('<div class="content">').append(
                    $('<div class="name">').append(
                        enabled ?
                            $('<a>', { href: baton.model.url(), target: '_blank' }).text(data.displayName) :
                            $('<span class="disabled">').text(data.displayName)
                    ),
                    createPathInformation(baton.model)
                )
            );
        }
    });

    var PubSubItem = Backbone.View.extend({
        tagName: 'li',
        className: '',
        initialize: function () {
            var baton = ext.Baton({ model: this.model, view: this });

            this.model.on('change', function () {
                baton.view.render();
            });

            this.model.on('remove', function () {
                baton.view.remove();
            });
        },
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
        }
    });

    function createPubSubItem(model) {
        return new PubSubItem({model: model});
    }

    /**
     * Setup a new pubsub collection
     *
     * @private
     * @param {$element} - jQuery list node element
     * @param {object} - model behind the list
     */
    function setupList(node, model) {
        model.each(function (model) {
            node.append(
                createPubSubItem(model).render().el
            );
        });
        model.on('add', function (model, collection, options) {
            var item = createPubSubItem(model).render().el;

            if (options.index === 0) {
                node.prepend(item);
            } else {
                node.children('li:nth-child(' + options.index + ')').after(item);
            }
        });
    }

    point.extend({
        id: 'content',
        render: function () {
            var baton = this.baton;
            baton.pubListNode = $('<ul>').addClass('publications');
            baton.subListNode = $('<ul>').addClass('subscriptions');
            this.$el.append(
                $('<legend>').text(gt('Publications')),
                baton.pubListNode
            );
            this.$el.append(
                $('<legend>').text(gt('Subscriptions')),
                baton.subListNode
            );

            setupList(baton.pubListNode.empty(), baton.publications);
            setupList(baton.subListNode.empty(), baton.subscriptions);
        }
    });
});
