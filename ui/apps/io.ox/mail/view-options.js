/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/mail/view-options', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/api/account',
    'gettext!io.ox/mail',
    'io.ox/core/commons',
    'io.ox/core/folder/contextmenu',
    'io.ox/core/api/collection-loader',
    'io.ox/core/http',
    'io.ox/mail/api',
    'io.ox/core/folder/api',
    'settings!io.ox/mail'
], function (ext, Dropdown, mini, account, gt, commons, contextmenu, CollectionLoader, http, mailAPI, folderAPI, settings) {

    'use strict';

    //
    // Top
    //
    var searchPrototype = {

        id: 'search',
        index: 100,
        draw: function (baton) {

            var listView = baton.app.listView;

            var collectionLoader = new CollectionLoader({
                module: 'mail',
                mode: 'search',
                getQueryParams: function (params) {

                    var criteria = params.criteria, filters = [], start, end,
                        // special support for main languages (en, de, fr, es)
                        from = criteria.from || criteria.von || criteria.de,
                        to = criteria.to || criteria.an || criteria.a || criteria.para,
                        subject = criteria.subject || criteria.betreff || criteria.sujet || criteria.asunto,
                        year = criteria.year || criteria.y || criteria.jahr || criteria.ano;

                    if (from) filters.push(['=', { field: 'from' }, from]);
                    if (to) filters.push(['or', ['=', { field: 'to' }, to], ['=', { field: 'cc' }, to], ['=', { field: 'bcc' }, to]]);
                    if (subject) filters.push(['=', { field: 'subject' }, subject]);
                    if (year) {
                        start = Date.UTC(year, 0, 1);
                        end = Date.UTC(year, 11, 31);
                        filters.push(['and', ['>', { field: 'date' }, String(start)], ['<', { field: 'date' }, String(end)]]);
                    }
                    if (criteria.words) {
                        _(criteria.words.split(' ')).each(function (word) {
                            filters.push(['or', ['=', { field: 'content' }, word], ['=', { field: 'subject' }, word]]);
                        });
                    }
                    if (criteria.addresses) {
                        _(criteria.addresses.split(' ')).each(function (address) {
                            filters.push(['or', ['=', { field: 'to' }, address], ['=', { field: 'cc' }, address], ['=', { field: 'bcc' }, address], ['=', { field: 'content' }, address]]);
                        });
                    }
                    if (criteria.attachment === 'true') filters.push(['=', { field: 'content_type' }, 'multipart/mixed']);
                    if (criteria.after) filters.push(['>', { field: 'date' }, String(criteria.after)]);
                    if (criteria.before) filters.push(['<', { field: 'date' }, String(criteria.before)]);

                    var folder = criteria.folder === 'all' ? mailAPI.allMessagesFolder : baton.app.folder.get();

                    return {
                        action: 'search',
                        folder: folder,
                        columns: '102,600,601,602,603,604,605,606,607,608,610,611,614,652,656,661,X-Open-Xchange-Share-URL',
                        sort: params.sort || '661',
                        order: params.order || 'desc',
                        timezone: 'utc',
                        data: { filter: ['and'].concat(filters) }
                    };
                },
                fetch: function (params) {
                    return http.wait().then(function () {
                        return http.PUT({
                            module: 'mail',
                            params: _(params).omit('data'),
                            data: params.data
                        });
                    });
                },
                each: function (obj) {
                    mailAPI.pool.add('detail', obj);
                },
                PRIMARY_PAGE_SIZE: 100,
                SECONDARY_PAGE_SIZE: 100
            });

            var $el = $('<div class="_hurz">').appendTo(this);

            require(['io.ox/backbone/views/search'], function (SearchView) {

                new SearchView({ el: $el[0], point: 'io.ox/mail/search/dropdown' })
                .build(function () {
                    var view = this;
                    baton.app.on('folder:change', function () {
                        view.cancel();
                    });
                    baton.app.folderView.tree.$el.on('click', function () {
                        view.cancel();
                    });
                })
                .on('search', function (criteria) {
                    listView.connect(collectionLoader);
                    listView.model.set({ criteria: criteria, thread: false, sort: 661, order: 'desc' });
                    listView.$el.parent().find('.grid-options [data-name="thread"]').addClass('disabled');
                })
                .on('cancel', function () {
                    var gridOptions = listView.$el.parent().find('.grid-options [data-name="thread"]');
                    if (!gridOptions.hasClass('disabled')) return;
                    listView.connect(mailAPI.collectionLoader);
                    listView.model.unset('criteria');
                    gridOptions.removeClass('disabled');
                })
                .render();
            });
        }
    };

    // search-prototype: changed "false" to "true"
    var useSearchPrototype = _.device('desktop') && !navigator.webdriver && settings.get('prototypes/search', false);
    if (useSearchPrototype) {
        ext.point('io.ox/mail/list-view/toolbar/top').extend(searchPrototype);
    }

    ext.point('io.ox/mail/search/dropdown').extend({
        id: 'default',
        index: 100,
        render: function () {
            this.model.set('folder', 'current');
            this.$dropdown.append(
                this.select('folder', gt('Search in'), [{ value: 'current', label: gt('Current folder') }, { value: 'all', label: gt('All folders') }]),
                this.input('subject', gt('Subject')),
                this.input('from', gt('From')),
                this.input('to', gt('To')),
                //#. Context: mail search. Label for <input>.
                this.input('words', gt('Contains words')),
                this.dateRange(),
                //#. Context: mail search. Label for checbbox.
                this.checkbox('attachment', gt('Has attachments')),
                this.button()
            );
        }
    });

    ext.point('io.ox/mail/view-options').extend({
        id: 'sort',
        index: 100,
        draw: function (baton) {
            var view = this.data('view'),
                folder = baton.app.folder.get();

            view.listenTo(baton.app, 'folder:change', onFolderChange);

            view.option('sort', 661, gt('Date'), { radio: true })
                .option('sort', 'from-to', account.is('sent|drafts', folder) ? gt('To') : gt('From'), { radio: true })
                .option('sort', 651, gt('Unread'), { radio: true })
                .option('sort', 608, gt('Size'), { radio: true })
                .option('sort', 607, gt('Subject'), { radio: true });

            //#. Sort by messages that have attachments
            if (folderAPI.pool.getModel(folder).supports('ATTACHMENT_MARKER')) view.option('sort', 602, gt('Attachments'), { radio: true });
            // color flags
            if (settings.get('features/flag/color')) this.data('view').option('sort', 102, gt('Color'), { radio: true });
            // sort by /flagged messages, internal naming is "star"
            //#. Sort by messages which are flagged, "Flag" is used in dropdown
            if (settings.get('features/flag/star')) this.data('view').option('sort', 660, gt('Flag'), { radio: true });

            function onFolderChange() {
                var folder = baton.app.folder.get(), link, textNode;
                // toggle from-to label by folder type
                link = view.$('a[data-value="from-to"]');
                textNode = link.contents().last();
                textNode.replaceWith(account.is('sent|drafts', folder) ? gt('To') : gt('From'));
                // toggle visibily of 'has attachments'
                link = view.$('a[data-value="602"]');
                link.toggleClass('hidden', !folderAPI.pool.getModel(folder).supports('ATTACHMENT_MARKER'));
            }
        }
    });

    ext.point('io.ox/mail/view-options').extend({
        id: 'order',
        index: 200,
        draw: function () {
            this.data('view')
                .divider()
                .option('order', 'asc', gt('Ascending'), { radio: true })
                .option('order', 'desc', gt('Descending'), { radio: true });
        }
    });

    ext.point('io.ox/mail/view-options').extend({
        id: 'thread',
        index: 300,
        draw: function (baton) {
            // don't add if thread view is disabled server-side
            if (baton.app.settings.get('threadSupport', true) === false) return;
            this.data('view')
                .divider()
                .option('thread', true, gt('Conversations'));
        }
    });

    function toggleByState(app, node) {
        if (app.folder.get() === 'virtual/all-unseen') return node.hide();
        node.toggle(!app.props.get('find-result'));
    }

    ext.point('io.ox/mail/list-view/toolbar/' + (useSearchPrototype ? 'bottom' : 'top')).extend({
        id: 'dropdown',
        index: 1000,
        draw: function (baton) {

            var app = baton.app, model = app.props;

            var dropdown = new Dropdown({
                tagName: 'li',
                className: 'dropdown grid-options toolbar-item margin-auto',
                attributes: { role: 'presentation' },
                caret: true,
                //#. Sort options drop-down
                label: gt.pgettext('dropdown', 'Sort'),
                dataAction: 'sort',
                model: model,
                tabindex: -1
            });

            ext.point('io.ox/mail/view-options').invoke('draw', dropdown.$el, baton);
            this.append(
                dropdown.render().$el
                    .find('.dropdown-menu')
                    .addClass('dropdown-menu-right')
                    .end()
                    .on('dblclick', function (e) { e.stopPropagation(); })
            );

            // hide in all-unseen folder and for search results
            var toggle = _.partial(toggleByState, app, dropdown.$el);
            app.props.on('change:find-result', toggle);
            app.on('folder:change', toggle);
            toggle();
        }
    });

    ext.point('io.ox/mail/all-options').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {

            var app = baton.app,
                extensions = contextmenu.extensions,
                node = this.$ul,
                actions = ['markFolderSeen', 'moveAllMessages', 'archive', 'divider', 'empty'];

            // show a generic select all action for all-unseen, searchresults and when using categories
            if (app.folder.get() === 'virtual/all-unseen' || app.props.get('find-result') || app.props.get('categories')) {
                actions = ['selectAll'];
            } else {
                this.header(gt('All messages in this folder'));
            }

            app.folder.getData().done(function (data) {
                var baton = new ext.Baton({ data: data, module: 'mail', listView: app.listView });
                actions.forEach(function (id) {
                    extensions[id].call(node, baton);
                });
            });
        }
    });

    ext.point('io.ox/mail/list-view/toolbar/' + (useSearchPrototype ? 'bottom' : 'top')).extend({
        id: 'all',
        index: 200,
        draw: function (baton) {

            var app = baton.app, model = app.props;

            var dropdown = new Dropdown({
                tagName: 'li',
                attributes: { role: 'presentation' },
                className: 'dropdown grid-options toolbar-item',
                caret: true,
                //#. 'All' options drop-down (lead to 'Delete ALL messages', 'Mark ALL messages as read', etc.)
                label: gt.pgettext('dropdown', 'All'),
                dataAction: 'all',
                model: model
            });

            ext.point('io.ox/mail/all-options').invoke('draw', dropdown, baton);

            this.append(dropdown.render().$el.on('dblclick', function (e) {
                e.stopPropagation();
            }));

            app.props.on('change:find-result change:categories', redraw);
            app.on('folder:change', redraw);

            function redraw() {
                // cleanup menu
                dropdown.prepareReuse().render();
                // redraw options with current folder data / search state
                ext.point('io.ox/mail/all-options').invoke('draw', dropdown, baton);
            }
        }
    });

    function toggleFolderView(e) {
        var state = !!e.data.state;
        e.data.app.folderView.forceOpen = state;
        e.data.app.props.set('folderview', state);

        // keep focus
        if (!!e.data.state) {
            e.data.app.folderView.tree.getNodeView(e.data.app.folder.get()).$el.focus();
        } else {
            var listView = e.data.app.listView,
                node = listView.selection.get().reduce(function (memo, item) {
                    if (memo) return memo;
                    return listView.selection.getNode(item);
                }, null);

            if (node) listView.selection.focus(0, node);
            else {
                var util = require('io.ox/mail/util'),
                    mailCollection = listView.selection.view.collection,
                    firstUnreadMail = mailCollection.models.find(function (e) {
                        return !util.isUnseen(e.get('flags'));
                    });

                if (firstUnreadMail) return listView.selection.select(mailCollection.indexOf(firstUnreadMail));

                listView.$el.focus();
            }
        }
    }

    function onFolderViewOpen(app) {
        app.getWindow().nodes.sidepanel.show();
        if (useSearchPrototype) {
            app.getWindow().nodes.main.find('.toolbar-item[data-action="open-folder-view"]').hide();
        } else {
            app.getWindow().nodes.main.find('.list-view-control').removeClass('toolbar-bottom-visible');
        }
    }

    function onFolderViewClose(app) {
        // hide sidepanel so invisible objects are not tabbable
        app.getWindow().nodes.sidepanel.hide();
        if (useSearchPrototype) {
            app.getWindow().nodes.main.find('.toolbar-item[data-action="open-folder-view"]').show();
        } else {
            app.getWindow().nodes.main.find('.list-view-control').addClass('toolbar-bottom-visible');
        }
    }

    ext.point('io.ox/mail/list-view/toolbar/bottom').extend({
        id: 'toggle-folderview',
        index: 100,
        draw: function (baton) {

            this.append(
                $('<button type="button" class="btn btn-link toolbar-item pull-left" data-action="open-folder-view">').attr('aria-label', gt('Open folder view')).append(
                    $('<i class="fa fa-angle-double-right" aria-hidden="true">').attr('title', gt('Open folder view'))
                )
                .on('click', { app: baton.app, state: true }, toggleFolderView)
            );

            if (useSearchPrototype) {
                baton.app.getWindow().nodes.main.find('.list-view-control').removeClass('toolbar-bottom-visible');
            }

            baton.app.on({
                'folderview:open': onFolderViewOpen.bind(null, baton.app),
                'folderview:close': onFolderViewClose.bind(null, baton.app)
            });

            if (baton.app.folderViewIsVisible()) _.defer(onFolderViewOpen, baton.app);
        }
    });

    ext.point('io.ox/mail/sidepanel').extend({
        id: 'toggle-folderview',
        index: 1000,
        draw: function (baton) {
            var guid = _.uniqueId('control');
            this.addClass('bottom-toolbar').append(
                $('<div class="generic-toolbar bottom visual-focus" role="region">').attr('aria-labelledby', guid).append(
                    $('<button type="button" class="btn btn-link toolbar-item" data-action="close-folder-view">').attr({
                        id: guid,
                        'aria-label': gt('Close folder view')
                    }).append(
                        $('<i class="fa fa-angle-double-left" aria-hidden="true">').attr('title', gt('Close folder view'))
                    ).on('click', { app: baton.app, state: false }, toggleFolderView)
                )
            );
        }
    });

    ext.point('io.ox/mail/sidepanel').extend({
        id: 'help',
        index: 1100,
        draw: commons.help
    });

    ext.point('io.ox/mail/sidepanel').extend({
        id: 'premium-area',
        index: 10000,
        draw: function (baton) {
            this.append(
                commons.addPremiumFeatures(baton.app, {
                    append: false,
                    upsellId: 'folderview/mail/bottom',
                    upsellRequires: 'active_sync'
                })
            );
        }
    });
});
