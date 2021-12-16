/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/find/extensions-facets', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/toolbar',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/helplink',
    'gettext!io.ox/core'
], function (ext, Toolbar, Dropdown, HelpLinkView, gt) {

    'use strict';

    var extensions = {

        toolbar: function (baton) {
            if (_.device('smartphone')) return;
            // rightside place for dropdowns
            var toolbar = new Toolbar({ title: gt('Search') }),
                // clone empty toolbar
                $list = toolbar.render().$list.clone();
            this.append($list);
            ext.point('io.ox/find/facets/list').invoke('draw', $list, baton);
        },

        list: function (baton) {
            var model = baton.model,
                self = this, list, advanced = [];

            // only toolbar
            list = model.manager.filter(function (facet) {
                return facet.is('toolbar');
            });

            // build hash of disabled (conflicting)
            baton.options.conflicting = {};
            _.each(list, function (facet) {
                if (!facet.getValue().isActive()) return;
                _.each(facet.getConflicting(), function (flag) {
                    baton.options.conflicting[flag] = true;
                });
            });

            _.each(list, function (facet) {
                // get active value
                if (!facet.is('toolbar')) return;

                // all non folder facets
                var id = facet.get('id'),
                    special = ext.point('io.ox/find/facets/dropdown/' + id);

                if (special.list().length > 0) {
                    // additional actions per id/type
                    special.invoke('draw', self, baton, facet);
                } else {
                    advanced.push(facet);
                }
            });

            if (advanced.length) {
                ext.point('io.ox/find/facets/dropdown/default').invoke('draw', this, baton, advanced);
            }
            ext.point('io.ox/find/facets/help').invoke('draw', this, baton, advanced);
        },

        dropdownDefault: function (baton, list) {
            var ddmodel = new Backbone.Model(),
                dropdown = new Dropdown({
                    model: ddmodel,
                    tagName: 'li',
                    className: 'facets dropdown pull-left',
                    attributes: {
                        'data-dropdown': 'view',
                        role: 'presentation'
                    },
                    caret: true,
                    label: gt('Options')
                });

            // add facet options to dropdown
            _.each(list, function (facet) {
                ext.point('io.ox/find/facets/dropdown/default/item').invoke('draw', dropdown, baton, facet);
            });

            // listen for option changes
            ddmodel.on('change', function (model) {
                var facet = Object.keys(model.changed)[0],
                    value = model.get(facet + ':value'),
                    option = model.get(facet);
                baton.model.manager.activate(facet, value, option);
            });

            // dom
            this.append(dropdown.render().$el);
        },

        item: function (baton, facet) {
            var dropdown = this,
                ddmodel = dropdown.model,
                id = facet.id,
                conflicting = baton.options.conflicting[id];

            // divider label
            dropdown.$ul.append(
                $('<li class="dropdown-header">').text(facet.getName())
            );

            _.each(facet.get('values').models, function (value) {
                // ensure (in case option is not set yet)
                value.set(id, value.getOption().id);
                ddmodel.set(id, value.getOption().id);
                ddmodel.set(id + ':value', value.id);

                // create dropdown items
                _.each(value.get('options'), function (option) {

                    if (option.hidden) return;

                    var label = (option.item || option).name;

                    // option vs. link
                    dropdown.option(id, option.id, label);

                    if (conflicting) dropdown.$ul.children().last().find('a').addClass('disabled');
                });
            });
        },

        dropdownFolder: function (baton, facet) {
            var value = facet.get('values').first(),
                option = value.getOption().id,
                ddmodel = new Backbone.Model({ option: option }),
                dropdown = new Dropdown({
                    model: ddmodel,
                    tagName: 'li',
                    caret: true,
                    label: value.getOption().name || value.getDisplayName(),
                    attributes: {
                        'data-facet': facet.get('id'),
                        'data-dropdown': 'view',
                        role: 'presentation'
                    },
                    className: 'facets dropdown pull-left'
                }),
                last;

            // disable facet when other conflicting facet is active
            if (baton.options.conflicting[facet.id]) {
                dropdown.$el.addClass('conflicting');
            }

            // use some mapping here to avoid unnecessary dividers
            var mapping = {
                'default': 'standard'
            };

            // ensure (in case option is not set yet)
            value.set('option', option);

            // activate
            ddmodel.on('change:option', function (model, option) {
                baton.view.userchange();
                value.activate(option);
            });

            // create dropdown items
            _.each(value.get('options'), function (option) {

                if (option.hidden) return;
                var label = (option.item || option).name,
                    type = option.account || option.type,
                    facetview = baton.view.ui.facets;

                // add divider for every 'type-block'
                if (last && (mapping[type] || type !== last)) {
                    dropdown.divider();

                    // divider label
                    if (option.item && option.item.detail) {
                        dropdown.$ul.append(
                            $('<li class="dropdown-header">').text(option.item.detail)
                        );
                    }
                }
                last = mapping[type] || type;

                // option vs. link
                if (type !== 'link') {
                    dropdown.option('option', option.id, label);
                } else {
                    dropdown.link('link', label, _.bind(facetview[option.callback], facetview));
                }
            });

            // dom
            this.append(dropdown.render().$el);
        },

        help: (function () {
            var links = {
                'mail': 'ox.appsuite.user.sect.email.search.html',
                'contacts': 'ox.appsuite.user.sect.contacts.search.html',
                'calendar': 'ox.appsuite.user.sect.calendar.search.html',
                'tasks': 'ox.appsuite.user.sect.tasks.search.html',
                'files': 'ox.appsuite.user.sect.drive.search.html'
            };
            return function (baton) {
                var target = links[baton.app.getModuleParam()];
                if (!target) return;
                var helpView = new HelpLinkView({ href: target });
                if (helpView.$el.hasClass('hidden')) return;
                this.append($('<li class="pull-right" role="presentation">').append(
                    helpView.render().$el
                ));
            };
        })()
    };

    return extensions;
});
