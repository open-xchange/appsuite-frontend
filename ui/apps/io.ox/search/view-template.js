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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/search/view-template',
    ['gettext!io.ox/core',
     'io.ox/core/extensions',
     'io.ox/core/api/apps',
     'io.ox/core/tk/autocomplete',
     'io.ox/search/view-template'
    ], function (gt, ext, appAPI) {

    'use strict';

    /**
     * widget:      io.ox/search/view/widget
     * fullscreen:  io.ox/search/view/window
     * mobile:      io.ox/search/view/window/mobile
     */

    var point = ext.point('io.ox/search/view/window'),
        dropdown = function (baton) {
            var ref,
                app = baton.app,
                model = baton.model,
                node = $('<div class="col-sm-12 query">');

            ref = $('<input name="app-search" id="app-search" type="text">')
                .autocomplete({
                    api: app.apiproxy,
                    minLength: 3,
                    mode: 'search',
                    model: model,
                    //TODO: would be nice to have this move to control
                    source: function (val) {
                        return app.apiproxy
                                .search(val)
                                .then(function (data) {
                                    return $.extend(data, {hits: 0});
                                });
                    },
                    draw: function (item) {
                        var node = $(this),
                            query = model.get('query'),
                            text = item.type === 'query' ? query + ' <span class="label">in ' + item.label + '</span>' : item.label;
                        node.html(text);
                        node.data(item);
                    },
                    stringify: function () {
                        //keep input value when item selected
                        return $(ref).val();
                    },
                    click: function (e) {
                        //apply selected filter
                        var node = $(e.target).closest('.autocomplete-item'),
                            data = node.data();
                        model.addFilter(data);
                    }
                })
                .on('selected', function () {
                    //clean input
                    $(ref).val('');
                });

            return node.append(ref);
        };

    //widget mode
    ext.point('io.ox/search/view/widget').extend({
        id: 'query',
        index: 200,
        row: '0',
        draw: function (baton) {
            this.append(
                dropdown(baton)
            );
        }
    });

    //window mode
    point.extend({
        id: 'headline',
        index: 100,
        row: '0',
        draw: function () {
            this.append($('<div class="col-lg-12 headline">').append(
                    $('<h1 class="clear-title">').text(gt('Search'))
                )
            );
        }
    });

    point.extend({
        id: 'apps',
        index: 100,
        row: '0',
        draw: function (baton) {
            var module = baton.model.getModule(),
                node = $('<ul class="col-lg-12 apps">');

            _(appAPI.getFavorites()).each(function (app) {
                node.append(
                    $('<li>')
                    .attr('data-app', app.id)
                    .text(gt.pgettext('app', app.title))
                );
            });
            //mark as active
            if (module !== '') {
                node.find('[data-app="' + module + '"]').addClass('active');
            }
            //register click handler
            node.find('li').on('click', function (e) {
                var node = $(e.target);
                baton.model.setModule(node.attr('class'));
            });

            this.append(node);
        }
    });

    point.extend({
        id: 'query',
        index: 200,
        row: '0',
        draw: function (baton) {
            this.append(dropdown(baton));
        }
    });

    point.extend({
        id: 'facets',
        index: 250,
        row: '0',
        redraw: function (baton) {
            $(baton.$).find('.facets').empty();
            this.draw.call(baton.$, baton);
        },
        draw: function (baton) {
            var node = $('<div class="col-lg-12 facets">'),
                model = baton.model,
                data = model.get('active');

            _.each(data, function (facet) {
                node.append(
                    $('<span>').text(facet.label)
                        .append(
                            $('<i class="fa fa-times action">')
                            .on('click', function () {
                                baton.model.removeFilter(facet);
                            })
                        )
                );
            });
            this.append(node);
        }
    });

    point.extend({
        id: 'delim',
        index: 300,
        row: '0',
        draw: function (baton) {
            this.append(
                $('<div class="delim">').append(
                    $('<i class="fa fa-angle-left action" style="float: left">')
                        .on('click', function () {
                            var start = baton.model.get('start');
                            start = Math.max(start - baton.model.get('size'), 0);
                            baton.model.set('start', start);

                        }),
                    $('<i class="fa fa-angle-right action" style="float: right">')
                            .on('click', function () {
                                var start = baton.model.get('start');
                                start = start + baton.model.get('size');
                                baton.model.set('start', start);
                            }),
                    $('<hr style="clear: both">')
                )
            );
        }
    });

    point.extend({
        id: 'results',
        index: 400,
        row: '0',
        draw: function (baton) {
            var node = $('<div class="col-lg-12 result">'),
                data = baton.model.get('data').results;

            _.each(data, function (item) {
                var tmp = $('<div class="item">');
                switch (baton.model.getModule()) {
                case 'mail':
                    tmp.append(
                        $('<div class="line1">').text('(' + item.id + ') ' + item.subject),
                        $('<div class="line1">').text('folder: ' + item.folder_id)
                    );
                    break;
                case 'contacts':
                    tmp.append(
                        $('<div class="line1">').text('(' + item.id + ') ' + item.display_name),
                        $('<div class="line1">').text(item.email1)
                    );
                    break;
                case 'tasks':
                    tmp.append(
                        $('<div class="line1">').text('(' + item.id + ') ' + item.title),
                        $('<div class="line1">').text('folder: ' + item.folder_id)
                    );
                    break;
                case 'infostore':
                    tmp.append(
                        $('<div class="line1">').text('please define in search/view-template.js'),
                        $('<div class="line1">').text('')
                    );
                    break;
                case 'calendar':
                    tmp.append(
                        $('<div class="line1">').text('please define in search/view-template.js'),
                        $('<div class="line1">').text('')
                    );
                    break;
                }
                node.append(tmp);
            });

            if (data.length === 0) {
                node.append(
                    $('<div class="item">').append(
                        $('<div class="line1">').text('No results')
                    )
                );
            }
            this.append(node);
        }
    });

    point.extend({
        id: 'statusbar',
        index: 400,
        row: '0',
        draw: function (baton) {
            this.parent().find('.window-statusbar').remove();

            var node = $('<footer class="window-statusbar">').append(
                $('<span>').text('current:' + baton.model.get('data').results.length),
                $('<span>').text('start:' + baton.model.get('data').start + '(' + baton.model.get('start') + ')'),
                $('<span>').text('size:' + baton.model.get('data').size + '(' + baton.model.get('size') + ')')
            );
            this.parent().append(node);
        }
    });

    // mobile botton toolbar
    ext.point('io.ox/search/view/window/mobile').extend({
        id: 'toolbar',
        index: 2500,
        draw: function (baton) {
            // must be on a non overflow container to work with position:fixed
            var node = $.extend(baton.app.attributes.window.nodes.body),
                toolbar;
            node.append(toolbar = $('<div class="app-bottom-toolbar">'));
        }
    });

    //just used to clean up the view class
    return null;
});
