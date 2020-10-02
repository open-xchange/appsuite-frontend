/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/files/search', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/search',
    'io.ox/core/api/collection-loader',
    'io.ox/files/api',
    'io.ox/core/api/account',
    'io.ox/core/http',
    'gettext!io.ox/files'
], function (ext, SearchView, CollectionLoader, api, accountAPI, http, gt) {

    'use strict';

    ext.point('io.ox/files/mediator').extend({
        id: 'top-search',
        index: 10000,
        setup: function (app) {

            var listView = app.listView;

            var collectionLoader = new CollectionLoader({
                module: 'files',
                mode: 'search',
                useLimit: false,
                getQueryParams: function (params) {
                    return {
                        action: 'search',
                        // folder: getFolder(criteria.folder),
                        columns: api.search.columns,
                        sort: '4',
                        order: 'desc',
                        timezone: 'utc',
                        data: {
                            pattern: String(params.criteria.words || '').trim() + '*'
                        }
                    };
                },
                isBad: _.constant(false),
                fetch: function (params) {
                    return http.wait().then(function () {
                        return http.PUT({
                            module: 'files',
                            params: _(params).omit('data'),
                            data: params.data
                        });
                    });
                },
                each: function (obj) {
                    api.pool.add('detail', obj);
                },
                PRIMARY_PAGE_SIZE: 100,
                SECONDARY_PAGE_SIZE: 100
            });

            var view = new SearchView({
                app: app,
                placeholder: gt('Search files'),
                point: 'io.ox/files/search/dropdown'
            })
            .build(function () {
                app.getWindow()
                    .on('show', this.show.bind(this))
                    .on('hide', this.hide.bind(this));
                app.on('folder:change', this.cancel.bind(this));
                app.folderView.tree.$el.on('click', this.cancel.bind(this));
            })
            .on('search', function (criteria) {
                listView.connect(collectionLoader);
                listView.model.set({ criteria: criteria, thread: false, sort: 661, order: 'desc' });
                listView.$el.parent().find('.grid-options [data-name="thread"]').addClass('disabled');
            })
            .on('cancel', function () {
                var gridOptions = listView.$el.parent().find('.grid-options [data-name="thread"]');
                if (!gridOptions.hasClass('disabled')) return;
                listView.connect(api.collectionLoader);
                listView.model.unset('criteria');
                gridOptions.removeClass('disabled');
            });

            $('#io-ox-topsearch').append(view.render().$el);
        }
    });

    ext.point('io.ox/files/search/dropdown').extend({
        id: 'default',
        index: 100,
        render: function () {
            this.model.set('folder', 'current');
            this.$dropdown.append(
                this.input('filename', gt('File name')),
                this.button()
            );
        }
    });
});

