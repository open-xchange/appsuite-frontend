/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/search/view-template', [
    'gettext!io.ox/core',
    'io.ox/core/extensions',
    'io.ox/core/api/apps',
    'settings!io.ox/core',
    'io.ox/search/autocomplete/view',
    'io.ox/search/facets/view'
], function (gt, ext, appAPI, settings) {

    'use strict';

    /**
     * fullscreen:  io.ox/search/view
     * mobile:      io.ox/search/view/mobile
     */

    var point = ext.point('io.ox/search/view');

    // input field
    point.extend({
        id: 'query',
        index: 200,
        row: '0',
        draw: function (baton) {
            var row,
                mobile = this.find('.mobile-dropdown');

            //add mobile container
            baton.$.container = mobile.length ? mobile : undefined;

            $('<div class="row query">').append(
                row = $('<div class="col-xs-12">')
            ).appendTo(this);

            ext.point('io.ox/search/autocomplete/searchfield-mobile').invoke('draw', row, baton);
        }
    });

    // dropdown button
    point.extend({
        id: 'apps',
        index: 100,
        row: '0',
        draw: function (baton) {
            var cell = $('<div class="btn-group col-xs-12">'),
                row = $('<div class="row applications">').append(cell),
                id = baton.model.getApp(),
                opt = baton.model.getOptions(),
                row, cell,
                items = [],
                titles = {},
                apps = settings.get('search/modules', []),
                elem;

            // apply mapping (infostore-files-drive chameleon)
            apps = _.map(apps, function (module) {
                var id = 'io.ox/' + module;
                return opt.mapping[id] || id;
            });

            // create dropdown menu entries
            _(apps).each(function (id) {
                var title = titles[id] = (ox.manifests.apps[id + '/main'] || {}).title;
                items.push(
                    $('<li>').append(
                        $('<a href="#">')
                            .attr({
                                'title': title,
                                'data-app': id,
                                'tabindex': '-1',
                                'role': 'button'
                            })
                            .append(
                                $('<i class="fa fa-fw"></i>'),
                                $('<span>').text(title)
                            )
                    )
                );
            });

            // create button and append dropdown menue
            cell.append(
                $('<a href="#" type="button" class="btn btn-primary dropdown-toggle">')
                    .attr({
                        'data-toggle': 'dropdown',
                        'role': 'menuitemcheckbox'
                    })
                    .append(
                        $('<span class="name">'),
                        $('<span class="caret">')
                    ),
                $('<ul class="dropdown dropdown-menu app-dropdown">').append(items)
            );

            // apply a11y
            cell.find('.dropdown-toggle')
                .dropdown();

            // current app
            if (id !== '') {
                // add icon
                cell.find('[data-app="' + id + '"]')
                    .find('.fa')
                    .removeClass('fa-none')
                    .addClass('fa-check');
                // add name
                cell.find('.name').text(titles[id]);
            }

            // delegate handler
            $('body').delegate('.app-dropdown a', 'click', function (e) {
                var cell = $(e.target),
                    next = cell.closest('a').attr('data-app');

                if (next && next !== id)
                    baton.model.setModule(next);
            });

            //append or replace
            elem = this.find('.row.applications');
            if (elem.length) {
                elem.replaceWith(row);
            } else {
                this.append(row);
            }
        }
    });

    point.extend({
        id: 'facets',
        index: 250,
        row: '0',
        draw: function (baton) {
            var row, cell, elem;

            row = $('<div class="row facets">').append(
                cell = $('<ul class="col-xs-12 list-unstyled search-facets">')
            );

            ext.point('io.ox/search/facets/facets').invoke('draw', cell, baton);

            elem = this.find('.row.facets');
            if (elem.length) {
                elem.replaceWith(row);
            } else {
                this.append(row);
            }
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
                    $('<div class="col-xs-12 io-ox-busy">')
                        .css('min-height', '50px')
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
