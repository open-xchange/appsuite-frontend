/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/sub/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/core/sub/model',
    'io.ox/backbone/views',
    'io.ox/core/folder/api',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/tk/dialogs',
    'io.ox/core/yell',
    'io.ox/core/capabilities',
    'gettext!io.ox/core/sub',
    'less!io.ox/core/sub/style'
], function (ext, model, views, folderAPI, BreadcrumbView, dialogs, yell, capabilities, gt) {

    'use strict';

    var point = views.point('io.ox/core/sub/settings/list'),
        SettingView = point.createView({ className: 'sub settings' }),
        filter, folderState;

    function openFileDetailView(popup, e, target) {
        e.preventDefault();
        var cid = target.attr('data-cid'), obj = _.cid(cid);
        popup.busy();
        // TODO: replace by new viewer
        if (ox.debug) console.error('No clue how to get here.', cid, obj);
    }

    ext.point('io.ox/core/sub/settings/detail').extend({
        index: 100,
        id: 'extensions',
        draw: function (baton) {

            filter = {};

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
                view.render().$el
            );
            // add side popup for single file publications
            new dialogs.SidePopup().delegate(this, '.file-detail-link', openFileDetailView);
        }
    });

    function createPathInformation(model) {
        var folder,
            breadcrumb;

        if (model.has('folder')) {
            // subscriptions have a folder on top-level
            folder = model.get('folder');
        } else {
            // publications have a property 'entity'
            folder = model.get('entity').folder;
        }

        breadcrumb = new BreadcrumbView({
            folder: folder,
            exclude: ['9'],
            notail: true,
            isLast: true
        });
        breadcrumb.handler = function (id) {
            // launch files and set/change folder
            ox.launch('io.ox/files/main', { folder: id }).done(function () {
                this.folder.set(id);
            });
        };

        return breadcrumb.render().$el;
    }

    var getSiteNameRegex = /^http[^?]+\/(\w+)\?/,
        getShortUrlRegex = /\?secret=.+$/;

    function getSiteName(url) {
        if (!url) return;
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
        return getSiteName(data.displayName) || data.displayName || gt('Unnamed subscription');
    }

    function isDestructiveRefresh(data) {
        return isDestructiveRefresh.needsWarning[data.source];
    }

    isDestructiveRefresh.needsWarning = {
        'com.openexchange.subscribe.crawler.google.calendar': true
    };

    function refreshWarning(data) {
        if (isDestructiveRefresh(data)) {
            return $('<span class="text-warning"></span>').text(gt('Note: Refreshing this subscription will replace the calendar content with the external content. Changes you have made inside appsuite will be overwritten'));
        }
        return $();
    }

    ext.point('io.ox/core/sub/settings/list/itemview').extend({
        id: 'itemview',
        draw: function (baton) {

            var data = baton.model.toJSON(),
                enabled = data.enabled,
                dynamicAction,
                url,
                displayName = getDisplayName(data) || '\u00A0';

            this[enabled ? 'removeClass' : 'addClass']('disabled');

            if (data.source && (baton.model.refreshState() === 'ready')) {
                // this is a subscription
                dynamicAction = $('<a>').attr({
                    href: '#',
                    tabindex: '1',
                    class: 'action',
                    'data-action': 'refresh',
                    'aria-label': displayName + ', ' + gt('Refresh')
                }).text(gt('Refresh'));
                if (isDestructiveRefresh(data)) {
                    dynamicAction.addClass('text-error');
                }
            } else if (data.source && (baton.model.refreshState() !== 'pending')) {
                // this is a subscription and refresh should be disabled
                dynamicAction = $('<span>');
            }

            url = getUrl(data);

            this.addClass('widget-settings-view').append(
                $('<div class="widget-controls">').append(
                    enabled ? dynamicAction : '',
                    data.source ? $('<a>').attr({
                        href: '#',
                        tabindex: '1',
                        class: 'action',
                        'data-action': 'toggle',
                        'aria-label': displayName + ', ' + (enabled ? gt('Disable') : gt('Enable'))
                    }).text(enabled ? gt('Disable') : gt('Enable')) : '',
                    $('<a class="remove">').attr({
                        href: '#',
                        tabindex: 1,
                        role: 'button',
                        title: gt('Delete'),
                        'data-action': 'remove',
                        'aria-label': displayName + ', ' + gt('Delete')
                    })
                    .append($('<i class="fa fa-trash-o">'))
                ),
                $('<span class="content">').append(
                    $('<span data-property="displayName" class="list-title pull-left">')
                    .text(displayName),
                    $('<div class="url">').append(
                        enabled ?
                            $('<a tabindex="1" target="_blank">').attr('href', url).text(getShortUrl(url) || '\u00A0') :
                            $('<i>').text(getShortUrl(url))
                    ),
                    createPathInformation(baton.model),
                    refreshWarning(data)

                )
            );

            if (data.source && (baton.model.refreshState() === 'pending')) {
                // this is a subscription and we are refreshing
                this.find('.name').append(
                    $('<i class="fa fa-refresh fa-spin">')
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

    var SubItem = Backbone.View.extend({
        tagName: 'li',
        className: '',
        initialize: function () {
            this.listenTo(this.model, 'change', performRender);

            this.listenTo(this.model, 'remove', performRemove);
        },
        events: {
            'click [data-action="toggle"]': 'onToggle',
            'click [data-action="refresh"]': 'onRefresh',
            'click [data-action="remove"]': 'onRemove'
        },
        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });
            ext.point('io.ox/core/sub/settings/list/itemview').invoke('draw', this.$el.empty(), baton);
            return this;
        },
        onToggle: function (ev) {
            var model = this.model;
            ev.preventDefault();

            model.set('enabled', !model.get('enabled'), { validate: true }).save().fail(function () {
                model.set('enabled', !model.get('enabled'), { validate: true });
            });
            this.render();
        },
        onRefresh: function (ev) {
            var baton = ext.Baton({ model: this.model, view: this });
            ev.preventDefault();
            yell({
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
        onRemove: function (e) {
            e.preventDefault();
            this.model.destroy();
        },
        close: function () {
            this.stopListening();
        }
    });

    function createSubItem(model) {
        return new SubItem({ model: model });
    }

    /**
     * Setup a new sub collection
     *
     * @private
     * @param {$element} - jQuery list node element
     * @param {object} - model behind the list
     */
    function setupList(node, collection, type) {

        var filteredList = collection.forFolder(filter),
            hintNode, hint;

        if (!capabilities.has(type)) {
            //node.after($('<div class="empty">').text(gt('This feature is deactivated') + '.'));
            return;
        }

        _.each(filteredList, function (model) {
            node.append(
                createSubItem(model).render().el
            );
        });

        collection.on('add', function (model, collection) {
            var filteredIndex = _.chain(collection.forFolder(filter))
                .map(function (e) { return e.id; })
                .indexOf(model.id)
                .value();
            if (filteredIndex < 0) { return; }

            var item = createSubItem(model).render().el;

            if (hintNode) { hintNode.remove(); }

            if (filteredIndex === 0) {
                node.prepend(item);
            } else {
                node.children('li:nth-child(' + collection.indexOf(model) + ')').after(item);
            }
        });

        // handle empty lists

        collection.on('remove', function (model, collection) {
            if (collection.length === 0) {
                addHint();
            }
        });

        function getHint() {
            filteredList = collection.forFolder(filter);
            var isEmpty = filteredList.length === 0,
                isFiltered = !!filter.folder,
                hasPublications = folderState.isPublished && type === 'publication',
                hasSubscriptions = folderState.isSubscribed && type === 'subscription',
                notAccessible = isEmpty && (hasPublications || hasSubscriptions);

            if (notAccessible) {
                if (hasPublications) return gt('This folder has publications but you are not allowed to view or edit them');
                if (hasSubscriptions) return gt('This folder has subscriptions but you are not allowed to view or edit them');
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
                node.append(hintNode = $('<li class="empty">').text(hint + '.'));
            }
        }

        addHint();
    }

    point.extend({
        id: 'content',
        render: function () {

            var baton = this.baton, both = capabilities.has('publication') && capabilities.has('subscription');

            if (capabilities.has('publication')) {
                this.$el.append(
                    $('<fieldset>').append(
                        // pub
                        both ? $('<legend class="pane-headline sectiontitle">').text(gt('Publications')) : $(),
                        baton.pubListNode = $('<ul class="list-unstyled publications list-group widget-list">')
                    )
                );
                setupList(baton.pubListNode.empty(), baton.publications, 'publication');
            }

            if (capabilities.has('subscription')) {
                this.$el.append(
                    $('<fieldset>').append(
                        both ? $('<legend class="pane-headline sectiontitle">').text(gt('Subscriptions')) : $(),
                        baton.subListNode = $('<ul class="list-unstyled subscriptions list-group widget-list">')
                    )
                );
                setupList(baton.subListNode.empty(), baton.subscriptions, 'subscription');
            }
        }
    });
});
