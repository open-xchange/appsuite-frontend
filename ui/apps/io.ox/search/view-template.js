/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/search/view-template', [
    'gettext!io.ox/core',
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'io.ox/search/autocomplete/view',
    'io.ox/search/facets/view'
], function (gt, ext, settings) {

    'use strict';

    /**
     * fullscreen:  io.ox/search/view
     * mobile:      io.ox/search/view/mobile
     */

    var point = ext.point('io.ox/search/view');

    // input field
    point.extend({
        id: 'query',
        index: 100,
        row: '0',
        draw: function (baton) {
            var mobile = this.find('.mobile-dropdown'), cell;

            //add mobile container
            baton.$.container = mobile.length ? mobile : undefined;

            $('<div class="row query">').append(
                //$('<label class="maillabel col-xs-2">').text(gt('Search') + ':'),
                //
                $('<div class="col-xs-1 recipient-actions">').append(

                    // search icon
                    $('<a href="#" class="btn-search maillabel col-xs-2">').append(
                        $('<i class="fa fa-search" aria-hidden="true">')
                    ),
                    // clear icon/button
                    $('<a href="#" class="btn-clear" role="button">').attr('title', gt('Clear field')).append(
                        $('<i class="fa fa-times" aria-hidden="true">')
                    )
                ),
                cell = $('<div class="col-xs-11">')
            ).appendTo(this);

            ext.point('io.ox/search/autocomplete/searchfield').invoke('draw', cell, baton);
            ext.point('io.ox/search/autocomplete/tokenfield').invoke('draw', cell, baton);
        }
    });

    // dropdown button
    point.extend({
        id: 'apps',
        index: 200,
        row: '0',
        draw: function (baton) {
            var cell = $('<div class="apps col-xs-6 dropdown">'),
                row = $('<div class="row applications">').append(cell),
                id = baton.model.getApp(),
                opt = baton.model.getOptions(),
                items = [],
                titles = {},
                // apply mapping (infostore-files-drive chameleon)
                apps = _.map(settings.get('search/modules') || [], function (module) {
                    var id = 'io.ox/' + module;
                    return opt.mapping[id] || id;
                }),
                supported = apps.indexOf(id) > -1,
                elem;

            // create dropdown menu entries
            _(apps).each(function (id) {
                var app = ox.ui.apps.get(id),
                    title = app ? app.get('title') : '';

                if (app) titles[app.id] = title;

                items.push(
                    $('<li>').append(
                        $('<a href="#" role="button" tabindex="-1">')
                            .attr({
                                'title': title,
                                'data-app': id
                            })
                            .append(
                                $('<i class="fa fa-fw icon" aria-hidden="true"></i>'),
                                $('<span>').text(title),
                                // countpart to keep title centered
                                $('<i class="fa fa-fw" aria-hidden="true"></i>')
                            )
                    )
                );
            });

            // create button and append dropdown menue
            cell.append(
                $('<a href="#" type="button" class="dropdown-toggle pull-left" data-toggle="dropdown" role="menuitemcheckbox">')
                    .append(
                        $('<span class="name">'),
                        $('<span class="caret">')
                    ),
                $('<ul class="dropdown dropdown-menu app-dropdown">').append(items)
            );

            // apply a11y
            cell.find('.dropdown-toggle')
                .dropdown();

            // apply fallback (part 1)
            id = supported ? id : apps[0];

            // add icon
            cell.find('[data-app="' + id + '"]')
                    .find('.icon')
                    .removeClass('fa-none')
                    .addClass('fa-check');
            // add name
            cell.find('.name').text(titles[id]);

            // delegate handler
            $('body').on('click', '.app-dropdown a', function (e) {
                var cell = $(e.target),
                    next = cell.closest('a').attr('data-app');

                if (next && next !== id) {
                    baton.model.setModule(next);
                }
            });

            //append or replace
            elem = this.find('.row.applications');
            if (elem.length) {
                elem.replaceWith(row);
            } else {
                this.append(row);
            }
            ext.point('io.ox/search/facets/facets').invoke('draw', row, baton);

            // apply fallback (part 2)
            if (!supported) baton.model.setModule(id);
        }
    });

    // register select handler for facet option click event
    point.extend({
        id: 'handler',
        index: 260,
        draw: function (baton) {
            ext.point('io.ox/search/facets/options-handler').invoke('draw', this, baton);
        }
    });

    point.extend({
        id: 'info',
        index: 300,
        draw: function (baton) {
            var items = baton.model.get('items'),
                count = items.length - baton.model.get('extra'),
                row = items.length <= baton.model.get('size') ?
                    $('<div class="info">').hide() :
                    $('<div class="info">').append(
                        $('<span class="info-item">').append(
                            gt('More than the currently displayed %1$s items were found', count)
                        )
                    ),
                elem = this.find('.info');

            if (elem.length) {
                elem.replaceWith(row);
            } else {
                this.append(row);
            }
        }
    });

    point.extend({
        id: 'busy',
        index: 500,
        draw: function () {
            this.append(
                $('<div class="row busy">').append(
                    $('<div class="col-xs-12 io-ox-busy">').css('min-height', '50px')
                )
            );
        }
    });

    // inline dropdown
    ext.point('io.ox/search/view/mobile').extend({
        id: 'dropdown',
        index: 100,
        draw: function () {
            // when exisiting autocomplete dropdown is rendered into this (autocompelte tk container)
            $('<div class="mobile-dropdown col-xs-12">')
                .hide()
                .appendTo(this);
        }
    });

    ext.point('io.ox/search/view/mobile').extend({
        id: 'app',
        index: 100,
        draw: function () {
            // overwrite app
        }
    });

});
