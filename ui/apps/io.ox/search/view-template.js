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

define('io.ox/search/view-template',
    ['gettext!io.ox/core',
     'io.ox/core/extensions',
     'io.ox/core/api/apps',
     'io.ox/search/util',
     'io.ox/core/tk/autocomplete'
    ], function (gt, ext, appAPI, util) {

    'use strict';

    /**
     * widget:      io.ox/search/view/widget
     * fullscreen:  io.ox/search/view/window
     * mobile:      io.ox/search/view/window/mobile
     */

    var point = ext.point('io.ox/search/view/window'),
        SORT = {
            current: 1,
            default: 2,
            standard: 3
        },
        dropdown = function (baton) {
            var ref,
                app = baton.app,
                model = baton.model,
                mode = model.get('mode');

            ref = $('<input>')
                .attr({
                    type: 'text',
                    tabindex: 1,
                    placeholder: gt('Search') + ' ...',
                    autofocus: mode === 'widget' ? false : true
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
                .on('selected', function (e, val, valid) {
                    //valid_ usually val.length >= 3
                    if (valid)
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
                        $('<li>').append(
                            $('<a href="#">')
                                .addClass('app')
                                .attr('data-app', app.id)
                                .text(gt.pgettext('app', app.title))
                        )
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
            var $list = $('<ol class="col-sm-12 facets group">'),
                model = baton.model,
                list = model.get('poollist'),
                $facet;

            _.each(list, function (item) {
                //get active value
                var value = model.get('pool')[item.facet].values[item.value];

                //create facet node
                $list.append(
                    $facet = $('<li>').addClass('facet')
                );

                //general stuff
                ext.point('io.ox/search/view/window/facet')
                    .invoke('draw', $facet, value, baton);

                //additional actions per id/type
                ext.point('io.ox/search/view/window/facet/' + value.facet)
                    .invoke('draw', $facet, value, baton);
            });

            this.append($list);
        }
    });

    //register select handler for facet option click event
    point.extend({
        id: 'handler',
        index: 260,
        draw: function (baton) {
            $('.io-ox-search .facet').delegate('.option', 'click', function (e) {
                var link = $(e.target).closest('a'),
                    list = link.closest('ol'),
                    option = link.attr('data-action') || link.attr('data-custom') || link.attr('data-option'),
                    facet = list.attr('data-facet'),
                    value = list.attr('data-value'),
                    data = {};

                //select option
                if (option === 'dialog') {
                    //open folder dialog
                    var facet = baton.model.get('folder');
                    folderDialog(facet, baton);
                } else {
                    if (facet === 'folder') {
                        //overwrite custom
                        baton.model.update(facet, value, {display_name: link.attr('title'), custom: option });
                    } else {
                        //use existing option
                        baton.model.update(facet, value, {option: option });
                    }
                    baton.model.update(facet, value, data);
                    baton.model.trigger('query');
                }
            });
        }
    });

    //facet
    ext.point('io.ox/search/view/window/facet').extend({
        id: 'type',
        index: 100,
        draw: function (value) {
            var label,
                options = value.options,
                option = value._compact.option;

            if (value.facet === 'folder')
                label = gt('Folder');
            else if (options) {
                var current = _.find(options, function (item) {
                    return item.id === option;
                });

                label = current && current.display_name;
            }

            if (label) {
                this.prepend(
                    $('<span>')
                        .addClass('name')
                        .text(label + ':')
                );
            }
        }
    });

    ext.point('io.ox/search/view/window/facet').extend({
        id: 'value',
        index: 200,
        draw: function (value) {
            this.append(value.display_name);
        }
    });

    function optionsDialog(e) {
        var node = $(e.target).parent(),
            menu = node.find('.dropdown-menu'),
            left = node.offset().left || 0,
            height = node.outerHeight(),
            width = node.outerWidth();
        menu.css({
                left: (left - 14) + 'px',
                top: height - 2 + 'px',
                width: width + 'px',
                'min-width': width + 'px',
                'border-radius': '0px'
            })
            .toggle();
    }

    ext.point('io.ox/search/view/window/facet').extend({
        id: 'options',
        index: 300,
        draw: function (value, baton) {
            var facet = baton.model.getFacet(value.facet),
                filters = facet ? facet.values[0].options || [] : [],
                self = this,
                current = value._compact.option, option,
                icon, menu;
            if (filters.length) {
                menu = $('<ol class="dropdown-menu" role="menu">')
                        .attr({
                            'data-facet': facet.id,
                            'data-value': value.id
                        });
                _.each(filters, function (item) {
                    menu.append(
                        option = $('<li role="presentation">').append(
                                     $('<a role="menuitem" tabindex="-1" href="#">')
                                        .append(
                                            $('<i class="fa fa-fw fa-none">'),
                                            $('<span>').text(item.display_name)
                                        )
                                        .addClass('option')
                                        .attr('data-option', item.id)
                                )
                    );
                    if (current === item.id)
                        option.find('.fa').removeClass('fa-none').addClass('fa-check');
                });
                self.append(menu);
                //set right position for dropdown
                icon = $('<i class="fa fa-chevron-down action">')
                        .on('click', optionsDialog);
                this.append(icon);
            }
        }
    });

    ext.point('io.ox/search/view/window/facet').extend({
        id: 'remove',
        index: 400,
        draw: function (value, baton) {
            var isMandatory = baton.model.isMandatory(value.facet);
           //remove action for non mandatory facets
            if (!isMandatory && value.facet !== 'folder') {
                this.append(
                    $('<i class="fa fa-times action">')
                    .on('click', function () {
                        baton.model.remove(value.facet, value.id);
                    })
                );
            }
        }
    });


    //facet type: folder
    function folderDialog(facet, baton) {
        require(['io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews'], function (dialogs, views) {
            var label = gt('Folder'),
                id = facet.values[0].id,
                type = baton.model.getModule();

            var dialog = new dialogs.ModalDialog()
                .header($('<h4>').text(label))
                .addPrimaryButton('ok', label, 'ok', {'tabIndex': '1'})
                .addButton('cancel', gt('Cancel'), 'cancel', {'tabIndex': '1'});
            dialog.getBody().css({ height: '250px' });

            //use foldertree or folderlist
            var TreeConstructor = ['mail', 'drive'].indexOf(type) > 0 ? views.FolderTree : views.FolderList;

            var tree = new TreeConstructor(dialog.getBody(), {
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

    ext.point('io.ox/search/view/window/facet/folder').extend({
        id: 'fallback',
        index: '200',
        draw: function (value) {
            if (!value.display_name)
                this.html('<i>' + gt('All folders') + '</i>');
        }
    });

    ext.point('io.ox/search/view/window/facet/folder').extend({
        id: 'actions',
        index: '300',
        draw: function (value, baton) {
            var action = $('<i class="fa fa-chevron-down action">').on('click', optionsDialog),
                menu = $('<ol class="dropdown-menu" role="menu">')
                    .attr({
                        'data-facet': 'folder',
                        'data-value': 'custom'
                    });

            this.append(menu, action);

            //add fodlers
            util.getFolders(baton.model)
                .then(function (list) {
                    //sort by type
                    list.sort(function (a, b) {
                        return SORT[a.type] - SORT[b.type];
                    });
                    //add option
                    _.each(list, function (folder) {
                        menu.append(
                            $('<li role="presentation">').append(
                                $('<a role="menuitem" tabindex="-1" href="#">')
                                    .append(
                                        //$('<i class="fa fa-fw fa-none">'),
                                        $('<span>').text(folder.title)
                                    )
                                    .addClass('option')
                                    .attr('data-custom', folder.id)
                                    .attr('title', folder.title)
                            )
                        );
                    });

                    //add option to open dialog
                    menu.append(
                        $('<li role="presentation">').append(
                             $('<a role="menuitem" tabindex="-1" href="#">')
                                .append(
                                    //$('<i class="fa fa-fw fa-none">'),
                                    $('<span>').text(gt('More') + '...')
                                )
                                .addClass('option more')
                                .attr('data-action', 'dialog')
                        )
                    );
                });
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

});
