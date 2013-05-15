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
         'io.ox/core/tk/dialogs',
         'io.ox/core/notifications',
         'io.ox/core/capabilities',
         'settings!io.ox/core/pubsub',
         'gettext!io.ox/core/pubsub',
         'less!io.ox/core/pubsub/style.less'
        ],
         function (ext, model, views, folderAPI, dialogs, notifications, capabilities, settings, gt) {

    'use strict';

    var point = views.point('io.ox/core/pubsub/settings/list'),
        SettingView = point.createView({ className: 'pubsub settings' }),
        filter, folderState, dialog;

    function openFileDetailView(popup, e, target) {
        e.preventDefault();
        var cid = target.attr('data-cid'), obj = _.cid(cid);
        popup.busy();
        require(['io.ox/files/api', 'io.ox/files/list/view-detail'], function (api, view) {
            api.get(obj).done(function (data) {
                popup.idle().append(view.draw(data));
            });
            api.on('delete.version', function () {
                // Close dialog after delete
                dialog.close();
            });
        });
    }

    function drawFilterInfo(folder, view) {

        if (!folder) return $();

        var node = $('<div class="alert alert-info pubsub settings">');

        function removeFilter(e) {
            e.preventDefault();
            $(this).closest('.alert').remove();
            filter = {};
            view.$el.empty();
            view.render();
        }

        folderAPI.getPath({folder: folder}).done(function (folder) {

            var folderPath = _(folder).pluck('title').join('/');

            node.append(
                $('<div class="folder">').text(
                    gt('Only showing items related to folder "%1$s"', folderPath)
                ),
                $('<a href="#" class="remove-filter" data-action="remove-filter">').text(gt('Show all items'))
                .on('click', removeFilter)
            );
        });

        return node;
    }

    ext.point('io.ox/core/pubsub/settings/detail').extend({
        index: 100,
        id: 'extensions',
        draw: function (baton) {

            filter = { folder: baton.options.folder };

            folderState = {
                isPublished: folderAPI.is('published', baton.options.data || {}),
                isSubscribed: folderAPI.is('subscribed', baton.options.data || {})
            };

            var view = new SettingView({
                publications: model.publications(),
                subscriptions: model.subscriptions()
            });

            this.append(
                $('<h1 class="pane-headline">').text(baton.data.title),
                drawFilterInfo(baton.options.folder, view),
                view.render().$el
            );
            // add side popup for single file publications
            dialog = new dialogs.SidePopup().delegate(this, '.file-detail-link', openFileDetailView);
        }
    });

    // module mapping
    var mapping = { contacts: 'io.ox/contacts', calendar: 'io.ox/calendar', infostore: 'io.ox/files' };

    function createPathInformation(model) {

        var options = {
            handler: function (id, data) {
                ox.launch(mapping[data.module] + '/main', { folder: id }).done(function () {
                    this.folder.set(id);
                });
            },
            exclude: ['9'], // root folder is useless
            subfolder: false, //don’t show subfolders for last item
            last: false // make last item a link (responding to handler function)
        };

        var folder, entity;

        if (model.has('folder')) {
            // subscriptions have a folder on top-level
            folder = model.get('folder');
        } else {
            // publications have a property 'entity'
            entity = model.get('entity');
            if (entity.id) {
                // single file
                options.leaf = $('<a href="#" class="file-detail-link">').attr('data-cid', _.cid(entity)).text(model.get('displayName'));
            }
            folder = entity.folder;
        }

        return folderAPI.getBreadcrumb(folder, options);
    }

    function drawDisplayName(name, url) {
        var nameNode = $('<span>').text(name);

        if (!url) {
            return nameNode.addClass('disabled');
        }

        return nameNode.after(' (', $('<a>', { href: url, target: '_blank' }).text(gt('Link')), ')');
    }

    var getSiteNameRegex = /^http[^?]+\/(\w+)\?/,
        getShortUrlRegex = /\?secret=.+$/;

    function getSiteName(url) {
        return (url = url.match(getSiteNameRegex)) ? url[1] : '';
    }

    var getUrl = (function () {

        var linkedIn = 'com.openexchange.subscribe.socialplugin.linkedin';

        return function (data) {
            if (linkedIn in data) return 'http://www.linkedin.com';
            if ('target' in data) return (data[data.target] || {}).url || '';
            if ('source' in data) return (data[data.source] || {}).url || '';
            return '';
        };

    }());

    function getShortUrl(url) {
        return url.replace(getShortUrlRegex, '...');
    }

    function getDisplayName(data) {
        return getSiteName(data.displayName) || data.displayName || '';
    }

    ext.point('io.ox/core/pubsub/settings/list/itemview').extend({
        id: 'itemview',
        draw: function (baton) {

            var data = baton.model.toJSON(),
                enabled = data.enabled,
                dynamicAction,
                url;

            this[enabled ? 'removeClass' : 'addClass']('disabled');

            if (data.source && (baton.model.refreshState() === 'ready')) {
                // this is a subscription
                dynamicAction = $('<a href="#" class="action" data-action="refresh">').text(gt('Refresh'));
            } else if (data.source && (baton.model.refreshState() !== 'pending')) {
                // this is a subscription and refresh should be disabled
                dynamicAction = $('<span>');
            } else if (data.target) {
                // this is a publication
                dynamicAction = $('<a href="#" class="action" data-action="edit">').text(gt('Edit'));
            }

            url = getUrl(data);

            this.addClass('item').append(
                $('<div class="actions">').append(
                    $('<a href="#" class="close" data-action="remove">').html('&times;'),
                    enabled ? dynamicAction : '',
                    $('<a href="#" class="action" data-action="toggle">').text(enabled ? gt('Disable') : gt('Enable'))
                ),
                $('<div class="content">').append(
                    $('<div class="name">').text(getDisplayName(data) || '\u00A0'),
                    $('<div class="url">').append(
                        enabled ?
                            $('<a target="_blank">').attr('href', url).text(getShortUrl(url) || '\u00A0') :
                            $('<i>').text(getShortUrl(url))
                    ),
                    createPathInformation(baton.model)
                )
            );

            if (data.source && (baton.model.refreshState() === 'pending')) {
                // this is a subscription and we are refreshing
                this.find('.name').append(
                    $('<i class="icon-refresh icon-spin">')
                );
            }
        }
    });

    function performRender() {
        this.render();
    }

    function performRemove() {
        this.remove();
    }

    var PubSubItem = Backbone.View.extend({
        tagName: 'li',
        className: '',
        initialize: function () {
            //TODO:switch to listenTo here, once backbone is up to date
            //see [1](http://blog.rjzaworski.com/2013/01/why-listento-in-backbone/)
            this.model.off('change', performRender);
            this.model.on('change', performRender, this);

            this.model.off('remove', performRemove, this);
            this.model.on('remove', performRemove, this);
        },
        events: {
            'click [data-action="toggle"]': 'onToggle',
            'click [data-action="edit"]': 'onEdit',
            'click [data-action="refresh"]': 'onRefresh',
            'click [data-action="remove"]': 'onRemove'
        },
        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });
            ext.point('io.ox/core/pubsub/settings/list/itemview').invoke('draw', this.$el.empty(), baton);
            return this;
        },
        onToggle: function (ev) {
            var model = this.model;
            ev.preventDefault();

            model.set('enabled', !model.get('enabled'), {validate: true}).save().fail(function (res) {
                model.set('enabled', !model.get('enabled'), {validate: true});
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
        onRefresh: function (ev) {
            var baton = ext.Baton({ model: this.model, view: this });
            ev.preventDefault();
            notifications.yell({
                type: 'info',
                headline: gt('Subscription refresh'),
                message: gt(
                    'A refresh takes some time, so please be patient, while the refresh runs in the background. ' +
                    'Only one refresh per subscription and per session is allowed.'
                )
            });
            this.model.performRefresh().done(function () {
                baton.view.render();
            });
            baton.view.render();
        },
        onRemove: function (ev) {
            ev.preventDefault();
            this.model.destroy();
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
    function setupList(node, collection, type) {

        var filteredList = collection.forFolder(filter),
            hintNode, hint;

        if (!capabilities.has(type)) {
            node.after($('<div class="empty">').text(gt('This feature is deactivated') + '.'));
            return;
        }

        _.each(filteredList, function (model) {
            node.append(
                createPubSubItem(model).render().el
            );
        });

        collection.on('add', function (model, collection, options) {
            var filteredIndex = _.chain(collection.forFolder(filter))
                .map(function (e) { return e.id; })
                .indexOf(model.id)
                .value();
            if (filteredIndex < 0) { return; }

            var item = createPubSubItem(model).render().el;

            if (hintNode) { hintNode.remove(); }

            if (filteredIndex === 0) {
                node.prepend(item);
            } else {
                node.children('li:nth-child(' + options.index + ')').after(item);
            }
        });

        // handle empty lists

        collection.on('remove', function (model, collection, options) {
            if (collection.length === 0) {
                addHint();
            }
        });

        function getHint() {

            var isEmpty = filteredList.length === 0,
                isFiltered = !!filter.folder,
                hasPublications = folderState.isPublished && type === 'publication',
                hasSubscriptions = folderState.isSubscribed && type === 'subscription',
                notAccessible = isEmpty && (hasPublications || hasSubscriptions);

            if (notAccessible) {
                if (hasPublications)
                    return gt('This folder has publications but you are not allowed to view or edit them');
                if (hasSubscriptions)
                    return gt('This folder has subscriptions but you are not allowed to view or edit them');
            }

            if (isEmpty) {
                if (isFiltered) {
                    return type === 'publication' ?
                        gt('This folder has no publications') :
                        gt('This folder has no subscriptions');
                }
                return type === 'publication' ?
                    gt('You don\'t have any publications yet') :
                    gt('You don\'t have any subscriptions yet');
            }

            return '';
        }

        function addHint() {
            if ((hint = getHint())) {
                // add node
                node.after(hintNode = $('<div class="empty">').text(hint + '.'));
            }
        }

        addHint();
    }

    point.extend({
        id: 'content',
        render: function () {

            var baton = this.baton;

            this.$el.append(
                // pub
                $('<h2 class="pane-headline">').text(gt('Publications')),
                baton.pubListNode = $('<ul class="publications">'),
                // sub
                $('<h2 class="pane-headline">').text(gt('Subscriptions')),
                baton.subListNode = $('<ul class="subscriptions">')
            );

            setupList(baton.pubListNode.empty(), baton.publications, 'publication');
            setupList(baton.subListNode.empty(), baton.subscriptions, 'subscription');
        }
    });
});
