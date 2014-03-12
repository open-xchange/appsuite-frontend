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
                        return app.apiproxy.search(val);
                    },
                    draw: function (value) {
                        $(this)
                            .data(value)
                            .html(value.display_name);
                    },
                    stringify: function () {
                        //keep input value when item selected
                        return $(ref).val();
                    },
                    click: function (e) {
                        //apply selected filter
                        var node = $(e.target).closest('.autocomplete-item'),
                            value = node.data();
                        model.add(value.facet, value.id);
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
                list = model.get('poollist'),
                value, tmp;

            _.each(list, function (item) {
                //get active value
                value = model.get('pool')[item.facet].values[item.value];

                node.append(
                    tmp = $('<span>').html(value.display_name)
                );
                //general stuff
                ext.point('io.ox/search/view/window/facets')
                    .invoke('draw', tmp, value, baton);

                //addiotional actions per id/type
                ext.point('io.ox/search/view/window/facets/' + value.facet)
                    .invoke('draw', tmp, value, baton);

                //remove action
                tmp.append(
                    $('<i class="fa fa-times action">')
                    .on('click', function () {
                        baton.model.remove(value.facet, value.id);
                        //baton.model.removeValue(value);
                    })
                );
            });
            this.append(node);
        }
    });

    ext.point('io.ox/search/view/window/facets').extend({
        draw: function (value, baton) {
            var facet = baton.model.getFacet(value.facet),
                filters = facet ? facet.values[0].options || [] : [],
                self = this,
                node, menu;
            if (filters.length) {
                menu = $('<ul class="dropdown-menu" role="menu">');
                _.each(filters, function (item) {
                    menu.append(
                        $('<li role="presentation">').append(
                             $('<a role="menuitem" tabindex="-1" href="#">')
                                 .text(item.display_name)
                        ).click('on', function () {
                            baton.model.update(facet.id, value.id, {option: item.id});

                            baton.model.trigger('query');
                        })
                    );
                });
                self.append(menu);
                //TODO: a11y
                node = $('<i class="fa fa-chevron-down action">')
                        .on('click', function () {
                            menu.toggle();
                        });
                this.append(node);
            }
        }
    });

    function folderdialoge(facet, baton) {
        require(['io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews'], function (dialogs, views) {
            var label = 'Choose',
                id = facet.values[0].id,
                type = baton.model.getModule();

            var dialog = new dialogs.ModalDialog()
                .header($('<h4>').text(label))
                .addPrimaryButton('ok', label, 'ok', {'tabIndex': '1'})
                .addButton('cancel', gt('Cancel'), 'cancel', {'tabIndex': '1'});
            dialog.getBody().css({ height: '250px' });

            var tree = new views.FolderTree(dialog.getBody(), {
                    type: type,
                    tabindex: 0,
                    customize: function (data) {
                        if (data.id === id) {
                            this.removeClass('selectable').addClass('disabled');
                        }
                    }
                });

            dialog.show(function () {
                tree.paint().done(function () {
                    tree.select(id).done(function () {
                        dialog.getBody().focus();
                    });
                });
            })
            .done(function (action) {
                if (action === 'ok') {
                    var target = _(tree.selection.get()).first(),
                        //TODO: better way tp get label?!
                        label = $(arguments[2]).find('[data-obj-id="' + target + '"]').attr('aria-label');
                    baton.model.update(facet.id, id, {custom: target, display_name: label});
                }
                tree.destroy().done(function () {
                    tree = dialog = null;
                });
            });
        });
    }

    ext.point('io.ox/search/view/window/facets/folder').extend({
        draw: function (value, baton) {
            var node = $('<i class="fa fa-chevron-down action">')
                        .on('click', function () {
                            var facet = baton.model.get('folder');
                            folderdialoge(facet, baton);
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
                        $('<div class="line1">').text(item.from[0][0] || item.from[0][1]),
                        $('<div class="line1">').text('(' + item.id + ') ' + item.subject)
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
