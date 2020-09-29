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

define('io.ox/mail/search', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/search',
    'io.ox/core/api/collection-loader',
    'io.ox/mail/api',
    'io.ox/core/http',
    'gettext!io.ox/mail'
], function (ext, SearchView, CollectionLoader, api, http, gt) {

    'use strict';

    ext.point('io.ox/mail/mediator').extend({
        id: 'top-search',
        index: 10000,
        setup: function (app) {

            if (!$('#io-ox-topsearch').is(':empty')) return;
            var $container = $('<div class="search-container">');
            $('#io-ox-topsearch').append($container);

            var listView = app.listView;

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
                            if (!from) {
                                filters.push(['or', ['=', { field: 'from' }, address]]);
                                from = true;
                            } else {
                                filters.push(['or', ['=', { field: 'to' }, address], ['=', { field: 'cc' }, address], ['=', { field: 'bcc' }, address]]);
                            }
                        });
                    }
                    if (criteria.attachment === 'true') filters.push(['=', { field: 'content_type' }, 'multipart/mixed']);
                    if (criteria.after) filters.push(['>', { field: 'date' }, String(criteria.after)]);
                    if (criteria.before) filters.push(['<', { field: 'date' }, String(criteria.before)]);

                    var folder = criteria.folder === 'all' ? api.allMessagesFolder : app.folder.get();

                    return {
                        action: 'search',
                        folder: folder,
                        columns: '102,600,601,602,603,604,605,606,607,608,610,611,614,652,656,661,662,X-Open-Xchange-Share-URL',
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
                    api.pool.add('detail', obj);
                },
                PRIMARY_PAGE_SIZE: 100,
                SECONDARY_PAGE_SIZE: 100
            });

            new SearchView({
                el: $container[0],
                placeholder: gt('Search mail'),
                point: 'io.ox/mail/search/dropdown'
            })
            .build(function () {
                var view = this;
                app.on('folder:change', function () {
                    view.cancel();
                });
                app.folderView.tree.$el.on('click', function () {
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
                listView.connect(api.collectionLoader);
                listView.model.unset('criteria');
                gridOptions.removeClass('disabled');
            })
            .render();
        }
    });

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
});

