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

define('io.ox/calendar/search', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/search',
    'io.ox/core/api/collection-loader',
    'io.ox/calendar/api',
    'io.ox/calendar/model',
    'io.ox/core/http',
    'gettext!io.ox/calendar'
], function (ext, SearchView, CollectionLoader, api, model, http, gt) {

    'use strict';

    ext.point('io.ox/calendar/mediator').extend({
        id: 'top-search',
        index: 10000,
        setup: function (app) {

            var collectionLoader = new CollectionLoader({
                module: 'calendar',
                mode: 'search',
                getDefaultCollection: function () {
                    return new model.Collection();
                },
                getQueryParams: function (params) {
                    var filter = {};
                    var criteria = params.criteria;
                    if (criteria.words) filter.pattern = criteria.words;
                    return {
                        action: 'search',
                        // folder: getFolder(criteria.folder),
                        columns: '1,20,5,101,102,206,207,201,200,202,400,401,402,221,224,227,2,209,212,213,214,215,222,216,220',
                        timezone: 'utc',
                        data: filter
                    };
                },
                isBad: function () {
                    // we don't need a folder
                    return false;
                },
                fetch: function (params) {
                    return http.wait().then(function () {
                        return http.PUT({
                            module: 'calendar',
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
                placeholder: gt('Search appointments'),
                point: 'io.ox/calendar/search/dropdown'
            })
            .build(function () {
                app.getWindow()
                    .on('show', this.show.bind(this))
                    .on('hide', this.hide.bind(this));
                app.on('folder:change', this.cancel.bind(this));
                app.folderView.tree.$el.on('click', this.cancel.bind(this));
            })
            .on('search', function (criteria) {
                // fluent option: do not write to user settings
                this.previousLayout = app.props.get('layout');
                if (this.previousLayout !== 'list') app.props.set('layout', 'list', { fluent: true });
                app.listView.connect(collectionLoader);
                app.listView.model.set({ criteria: criteria });
            })
            .on('cancel', function () {
                if (this.previousLayout !== 'list') app.props.set('layout', this.previousLayout, { fluent: true });
                app.listView.connect(api.collectionLoader);
                app.listView.model.unset('criteria');
            });

            $('#io-ox-topsearch').append(view.render().$el);
        }
    });

    ext.point('io.ox/calendar/search/dropdown').extend({
        id: 'default',
        index: 100,
        render: function () {
            this.$dropdown.append(
                this.input('subject', gt('Subject')),
                this.input('location', gt('Location')),
                this.input('description', gt('Description')),
                this.input('participants', gt('Participants')),
                this.dateRange(),
                this.button()
            );
        }
    });
});

