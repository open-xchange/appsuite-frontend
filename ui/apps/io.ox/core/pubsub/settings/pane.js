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
        draw: function (point) {
            this.append(
                $('<div class="clear-title">').text(point.title),
                $('<div class="settings sectiondelimiter">')
            );
            new SettingView({publications: model.publications(), subscriptions: model.subscriptions()}).render().$el.appendTo(this);
        }
    });


    function createPathInformation(model) {
        var opts = {
                handler: function (id) {
                    folderAPI.get({folder: id}).done(function (folder) {
                        //TODO: do something with the folder here
                    });
                },
                subfolder: false, //don’t show subfolders for last item
                last: false // make last item a link (responding to handler function)
            };

        return folderAPI.getBreadcrumb(model.get('folder') || model.get('entity').folder, opts);
    }

    ext.point('io.ox/core/pubsub/settings/list/itemview').extend({
        id: 'itemview',
        draw: function (baton) {
            var data = baton.model.toJSON(),
                controls = $('<div>').addClass('actions');

            this[data.enabled ? 'removeClass' : 'addClass']('disabled');

            $('<a href="#" class="action" data-action="edit">').text(gt('Edit')).appendTo(controls);
            $('<a href="#" class="close" data-action="remove">').html('&times;').appendTo(controls);

            this.append(
                $('<div>').addClass('content')
                .addClass(data.enabled ? '' : 'disabled').append(
                    $('<div>').addClass('name').append(
                        $('<a>', {href: baton.model.url()}).text(data.displayName)
                    ),
                    createPathInformation(baton.model)
                )
            );

            if (data.enabled) {
                controls.append(
                    $('<a href="#" class="action" data-action="toggle">').text(gt('Disable'))
                );
            } else {
                controls.append(
                    $('<a href="#" class="action" data-action="toggle">').text(gt('Enable'))
                );
            }
            controls.appendTo(this);
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
        model.on('add', function (model) {
            node.append(
                createPubSubItem(model).render().el
            );
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
