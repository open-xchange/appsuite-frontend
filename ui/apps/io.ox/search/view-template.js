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
     'io.ox/core/tk/autocomplete'
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
                mode = model.get('mode');

            ref = $('<input>')
                .attr({
                    type: 'text',
                    tabindex: 1,
                    placeholder: gt('Search') + ' ...'
                })
                .addClass('search-field form-control ' + mode)
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
                        if (mode === 'widget') {
                            model.remove();
                        }
                        model.add(value.facet, value.id);
                    }
                })
                .on('selected', function () {
                    //clean input
                    $(ref).val('');
                });

            return $(this).append(ref);
        };

    //widget mode
    ext.point('io.ox/search/view/widget').extend({
        id: 'query',
        index: 200,
        row: '0',
        draw: function (baton) {
            dropdown.call(this, baton);
        }
    });

    //window mode
    point.extend({
        id: 'apps',
        index: 100,
        row: '0',
        draw: function (baton) {
            var id = baton.model.getApp(),
                opt = baton.model.getOptions(),
                node = $('<ol class="col-sm-12 apps">');
            //add links for supported apps
            _(appAPI.getFavorites()).each(function (app) {
                if (!opt.mapping[app.id]) {
                    node.append(
                        $('<li>')
                            .addClass('app')
                            .attr('data-app', app.id)
                            .text(gt.pgettext('app', app.title))
                    );
                }
            });
            //mark as active
            if (id !== '') {
                node.find('[data-app="' + id + '"]').addClass('active');
            }
            //register click handler
            node.find('li').on('click', function (e) {
                var node = $(e.target);
                baton.model.setModule(node.attr('data-app'));
            });

            this.append(node);
        }
    });

    point.extend({
        id: 'query',
        index: 200,
        row: '0',
        draw: function (baton) {
            var row = $('<div class="col-sm-12 query">').appendTo(this);
            dropdown.call(row, baton);
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
            var node = $('<ol class="col-sm-12 facets group">'),
                model = baton.model,
                list = model.get('poollist'),
                tmp;

            _.each(list, function (item) {
                //get active value
                var value = model.get('pool')[item.facet].values[item.value],
                    isMandatory = model.isMandatory(item.facet);

                node.append(
                    tmp = $('<li>').html(value.display_name)
                );
                //general stuff
                ext.point('io.ox/search/view/window/facets')
                    .invoke('draw', tmp, value, baton);

                //addiotional actions per id/type
                ext.point('io.ox/search/view/window/facets/' + value.facet)
                    .invoke('draw', tmp, value, baton);

                tmp.addClass('facet');

                //remove action for non mandatory facets
                if (!isMandatory) {
                    tmp.append(
                        $('<i class="fa fa-times action">')
                        .on('click', function () {
                            baton.model.remove(value.facet, value.id);
                        })
                    );
                }
            });
            this.append(node);
        }
    });

    point.extend({
        id: 'info',
        index: 300,
        draw: function (baton) {
            var items = baton.model.get('items'),
                timespend = Math.round((Date.now() - items.timestamp) / 100) / 10;
            if (items.timestamp) {
                this.append(
                    $('<div>')
                    .addClass('col-sm-12 info')
                    .append(
                        gt('Found %1$s items in %2$s seconds', items.length, timespend)
                    )
                );
            }
        }
    });

    ext.point('io.ox/search/view/window/facets').extend({
        draw: function (value, baton) {
            var facet = baton.model.getFacet(value.facet),
                filters = facet ? facet.values[0].options || [] : [],
                self = this,
                node, menu;
            if (filters.length) {
                menu = $('<ol class="dropdown-menu" role="menu">');
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
                //set right position for dropdown
                node = $('<i class="fa fa-chevron-down action">')
                        .on('click', function () {
                            var left = self.offset().left || 0,
                                height = self.outerHeight(),
                                width = self.outerWidth();
                            menu.css({
                                    left: (left - 13) + 'px',
                                    top: height + 8 + 'px',
                                    width: width + 'px',
                                    'min-width': width + 'px',
                                    'border-radius': '0px'
                                })
                                .toggle();
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
        id: 'icon',
        index: '100',
        draw: function () {
            this.prepend(
                $('<i class="fa fa-folder">')
                .css({
                    'padding-right': '10px',
                    opacity: 0.2
                })
            );
        }
    });

    ext.point('io.ox/search/view/window/facets/folder').extend({
        id: 'fallback',
        index: '200',
        draw: function (value) {
            if (!value.display_name)
                this.html('<i>' + gt('All folders') + '</i>');
        }
    });

    ext.point('io.ox/search/view/window/facets/folder').extend({
        id: 'actions',
        index: '300',
        draw: function (value, baton) {
            //add actions
            var node = $('<i class="fa fa-chevron-down action">')
                        .on('click', function () {
                            var facet = baton.model.get('folder');
                            folderdialoge(facet, baton);
                        });
            this.append(node);
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
