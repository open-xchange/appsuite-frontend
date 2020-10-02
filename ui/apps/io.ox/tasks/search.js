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

define('io.ox/tasks/search', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/search',
    'io.ox/core/http',
    'gettext!io.ox/tasks'
], function (ext, SearchView, http, gt) {

    'use strict';

    ext.point('io.ox/tasks/mediator').extend({
        id: 'top-search',
        index: 10000,
        setup: function (app) {

            var view = new SearchView({
                app: app,
                placeholder: gt('Search tasks'),
                point: 'io.ox/tasks/search/dropdown'
            })
            .build(function () {
                app.getWindow()
                    .on('show', this.show.bind(this))
                    .on('hide', this.hide.bind(this));
                app.on('folder:change', this.cancel.bind(this));
                app.folderView.tree.$el.on('click', this.cancel.bind(this));
            })
            .on('search', function (criteria) {
                deriveFilter(criteria);
                app.grid.setMode('search');
            })
            .on('cancel', function () {
                app.grid.setMode('all');
            });

            $('#io-ox-topsearch').append(view.render().$el);

            var filters = {};

            // search: all request
            app.grid.setAllRequest('search', function () {
                // result: contains a amount of data somewhere between the usual all and list responses
                return http.wait().then(function () {
                    return http.PUT({
                        module: 'tasks',
                        params: {
                            action: 'search',
                            columns: '1,2,5,20,101,200,203,220,221,300,301,309,316,317,401',
                            sort: '317',
                            order: 'asc',
                            timezone: 'utc'
                        },
                        data: filters
                    });
                });
            });

            // forward ids (no explicit all/list request in find/search api)
            app.grid.setListRequest('search', function (ids) {
                var args = [ids];
                return $.Deferred().resolveWith(app, args);
            });

            function deriveFilter(criteria) {
                filters = {};
                if (criteria.words) filters.pattern = criteria.words;
                if (criteria.folder === 'current') filters.folder = app.folder.get();
                if (criteria.after) filters.start = criteria.after;
                if (criteria.before) filters.end = criteria.before;
            }
        }
    });

    ext.point('io.ox/tasks/search/dropdown').extend({
        id: 'default',
        index: 100,
        render: function () {
            this.model.set('folder', 'current');
            this.$dropdown.append(
                this.select('folder', gt('Search in'), [{ value: 'current', label: gt('Current list') }, { value: 'all', label: gt('All lists') }]),
                this.input('words', gt('Contains words')),
                this.dateRange(),
                this.button()
            );
        }
    });
});

