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

define('io.ox/contacts/search', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/search',
    'io.ox/core/http',
    'gettext!io.ox/contacts'
], function (ext, SearchView, http, gt) {

    'use strict';

    ext.point('io.ox/contacts/mediator').extend({
        id: 'top-search',
        index: 10000,
        setup: function (app) {

            var view = new SearchView({
                app: app,
                placeholder: gt('Search contacts'),
                point: 'io.ox/contacts/search/dropdown'
            })
            .inject({
                getPhraseFromAutoComplete: function (item) {
                    var f = item.first_name, l = item.last_name;
                    if (f && l) return 'first:' + f + ' last:' + l;
                    if (l) return 'last:' + l;
                    if (f) return 'first:' + f;
                    var c = item.company;
                    if (c) return 'company:' + c;
                    var d = item.display_name;
                    if (d) return d;
                }
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

            var filters = [];

            // search: all request
            app.grid.setAllRequest('search', function () {
                // result: contains a amount of data somewhere between the usual all and list responses
                return http.wait().then(function () {
                    return http.PUT({
                        module: 'contacts',
                        params: {
                            action: 'advancedSearch',
                            columns: '20,1,101,500,501,502,505,508,510,519,520,524,526,528,555,556,557,569,592,597,602,606,607,616,617,5,2',
                            sort: '609',
                            timezone: 'utc'
                        },
                        data: { filter: ['and'].concat(filters) }
                    });
                });
            });

            // forward ids (no explicit all/list request in find/search api)
            app.grid.setListRequest('search', function (ids) {
                var args = [ids];
                return $.Deferred().resolveWith(app, args);
            });

            function deriveFilter(criteria) {

                filters = [];

                var first = criteria.f || criteria.first || criteria.firstname || criteria.vorname;
                map(first, 'first_name');

                var last = criteria.l || criteria.last || criteria.lastname || criteria.nachname;
                map(last, 'last_name');

                var company = criteria.co || criteria.company || criteria.firma;
                map(company, 'company');

                var department = criteria.dep || criteria.department || criteria.abteilung;
                map(department, 'department');

                var addresses = criteria.addresses.split(' ');
                if (criteria.email) addresses = addresses.concat(criteria.email.split(' '));
                addresses.forEach(function (address) {
                    filters.push(or(['email1', 'email2', 'email3'], address + '*'));
                });

                if (criteria.words) {
                    _(criteria.words.split(' ')).each(function (word) {
                        filters.push(or(['first_name', 'last_name', 'display_name', 'nickname'], word + '*'));
                    });
                }

                var city = criteria.c || criteria.city || criteria.stadt;
                if (city) {
                    if (/^\d+$/.test(city)) {
                        filters.push(or(['postal_code_business', 'postal_code_home', 'postal_code_other'], city + '*'));
                    } else {
                        filters.push(or(['city_business', 'city_home', 'city_other'], city + '*'));
                    }
                }
            }

            function map(value, field) {
                if (!value) return;
                filters.push(['=', { field: field }, value + '*']);
            }

            function or(fields, value) {
                return ['or'].concat(fields.map(function (field) {
                    return ['=', { field: field }, value];
                }));
            }
        }
    });

    ext.point('io.ox/contacts/search/dropdown').extend({
        id: 'default',
        index: 100,
        render: function () {
            this.$dropdown.append(
                this.input('first', gt('First name'), getOptions('first_name')),
                this.input('last', gt('Last name'), getOptions('last_name')),
                this.input('email', gt('Email'), getOptions('email')),
                this.input('company', gt('Company'), getOptions('company')),
                this.input('department', gt('Department'), getOptions('department')),
                this.input('city', gt('City'), getOptions('city')),
                this.button()
            );
        }
    });

    function getOptions(field) {
        return function () {
            var hash = {};
            SearchView.picker.cache.items.forEach(function (item) {
                if (item[field]) hash[item[field]] = true;
            });
            var option = document.createElement('option');
            return Object.keys(hash).map(function (value) {
                var el = option.cloneNode();
                el.setAttribute('value', value);
                return el;
            });
        };
    }
});
