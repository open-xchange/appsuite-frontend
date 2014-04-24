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
        dropdown = function (baton, container) {
            var ref,
                app = baton.app,
                model = baton.model,
                mode = model.get('mode');

            this.append(
                $('<div class="input-group">')
                    .append(
                        ref = $('<input type="text" class="form-control search-field" tabindex="1">')
                        .attr({
                            placeholder: gt('Search') + ' ...'
                        })
                        .autocomplete({
                            api: app.apiproxy,
                            minLength: 0,
                            mode: 'search',
                            delay: 150,
                            parentSelector: container  ? '.query' : '.io-ox-search',
                            model: model,
                            container: container,
                            cbshow: function () {
                                //reset autocomplete tk styles
                                if (mode !== 'widget' && container)
                                    $(this).attr('style', '');

                            },
                            //TODO: would be nice to move to control
                            source: function (val) {
                                //show dropdown immediately (busy by autocomplete tk)
                                ref.open();
                                return app.apiproxy.search(val);
                            },
                            draw: function (value) {
                                $(this)
                                    .data(value)
                                    .html(value.display_name);
                                if (container) {
                                    //reset calculated style from autocomplete tk
                                    container.attr('style', 'width: 100%;');
                                }
                            },
                            stringify: function () {
                                //keep input value when item selected
                                return ref.val();
                            },
                            click: function (e) {
                                //apply selected filter
                                var node = $(e.target).closest('.autocomplete-item'),
                                    value = node.data();
                                if (mode === 'widget') {
                                    model.remove();
                                }
                                ref.val('');
                                model.add(value.facet, value.id);
                            }
                        })
                        .on('focus focus:custom click', function (e, isRetry) {
                            //simulate tab keyup event
                            //hint: 'click' supports click on already focused
                            ref.trigger({
                                    type: 'keyup',
                                    which: 9
                                }, isRetry);

                        })
                        .on('keyup', function (e, isRetry) {
                            //adjust original event instead of throwing a new one cause
                            //handler (fnKeyUp) is debounced and we have set the isRetry flag

                            var focusedDown = !ref.isOpen() && e.which === 40,
                                //tab used to focus
                                tabToFocus = e.which === 9;

                            //isRetry argument is used for custom events thrown via trigger
                            //use e.data for orign event
                            if (_.isUndefined(isRetry) && (custom && tabToFocus)) {
                                e.data = {isRetry: true};
                            }
                        }),
                        $('<span class="input-group-btn">').append(
                            //submit
                            $('<button type="button" class="btn btn-default btn-search">')
                            .attr('aria-label', gt('Search'))
                            .append(
                                $('<i class="fa fa-search"></i>')
                            )
                            .on('click', function () {
                                var dropdown = $('.autocomplete-search').length;
                                //open full size search app 'shortcut'
                                if (!dropdown && mode === 'widget') {
                                    //open search app
                                    require(['io.ox/search/main'], function (searchapp) {
                                        searchapp.run();
                                    });
                                } else {
                                    //construct enter event to
                                    var e = $.Event('keydown');
                                    e.which = 13;
                                    $(ref).trigger(e);
                                }
                            })
                        )
                    )
            );

            return this;
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
                row, cell;

            //create containers
            row = $('<div class="row applications">').append(
                cell = $('<ul class="col-xs-12 list-unstyled">')
            );

            //create dropdown menu entries
            _(appAPI.getFavorites()).each(function (app) {
                if (!opt.mapping[app.id] || app.id === 'io.ox/files') {
                    cell.append(
                        $('<li role="presentation" class="application">')
                            .append(
                                $('<div class="btn-group">')
                                .append(
                                    $('<button type="button" class="btn btn-link">')
                                        .attr('data-app', (opt.mapping[app.id] || app.id))
                                        .addClass('pull-left')
                                        .text(gt.pgettext('app', app.title))
                                )
                            )
                    );
                }
            });

            //mark as active
            if (id !== '') {
                cell.find('[data-app="' + id + '"]')
                .removeClass('btn-link')
                .addClass('btn-primary');
            }
            //register click handler
            cell.find('li').on('click', function (e) {
                var node = $(e.target);
                baton.model.setModule(node.attr('data-app'));
            });

            this.append(row);
        }
    });

    point.extend({
        id: 'query',
        index: 200,
        row: '0',
        draw: function (baton) {
            var row,
                mobile = this.find('.mobile-dropdown');

            $('<div class="row query">').append(
                row = $('<div class="col-xs-12">')
            ).appendTo(this);

            dropdown.call(row, baton, mobile.length ? mobile : undefined);
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
            var model = baton.model,
                list = model.get('poollist'),
                facet, row, cell, button;

            row = $('<div class="row facets">').append(
                cell = $('<ul class="col-xs-12 list-unstyled facets">')
            );

            _.each(list, function (item) {
                //get active value
                var value = model.get('pool')[item.facet].values[item.value];

                //create facet node
                cell.append(
                    facet = $('<li role="presentation" class="facet btn-group">')
                                // .addClass('fac!et pull-left')
                                .append(
                                    // in firefox clicks on nested elements in buttons won't work - therefore this needs to be a  <a href="#">
                                    button = $('<a href="#" type="button" role="button" class="btn btn-default dropdown-toggle">').on('click', function (e) {
                                        e.preventDefault();
                                    }).append($('<label>'))
                                )
                );

                //general stuff
                ext.point('io.ox/search/view/window/facet')
                    .invoke('draw', button, value, baton);

                //additional actions per id/type
                ext.point('io.ox/search/view/window/facet/' + value.facet)
                    .invoke('draw', facet, value, baton);
            });

            this.append(row);
        }
    });

    //register select handler for facet option click event
    point.extend({
        id: 'handler',
        index: 260,
        draw: function (baton) {
            $('body').delegate('.facet-dropdown .option', 'click tap', function (e) {
                //TODO: remove hack
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
                //mobile
                $(this).closest('.custom-dropdown').toggle();
                ox.idle();

                $(e.target).closest('.dropdown.open').toggle();

                var link = $(e.target).closest('a'),
                    list = link.closest('ul'),
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
            var options = value.options,
                id = value._compact.option,
                type, current;
            //get type label
            if (value.facet === 'folder')
                type = gt('Folder');
            else if (options) {
                current = _.find(options, function (item) {
                    return item.id === id;
                });
                type = current && current.display_name;
            }
            //append type
            if (type) {
                this.find('label').prepend(
                    $('<span>')
                        .addClass('type')
                        .html(type)
                );
            }
        }
    });

    ext.point('io.ox/search/view/window/facet').extend({
        id: 'name',
        index: 200,
        draw: function (value) {
            this.find('label').append(
                $('<span>')
                    .addClass('name')
                    .html(value.display_name)
            );
        }
    });

    ext.point('io.ox/search/view/window/facet').extend({
        id: 'dropdown',
        index: 300,
        draw: function (value, baton) {
            var facet = baton.model.getFacet(value.facet),
                filters = facet ? facet.values[0].options || [] : [],
                current = value._compact.option, option,
                parent = this.parent(),
                menu;

            if (filters.length) {
                this.attr('data-toggle', 'dropdown');
                //add caret
                this.prepend(
                    $('<div class="caret-container">').append(
                        $('<span class="caret">')
                    )
                );

                //creste menu
                menu = $('<ul class="dropdown dropdown-menu facet-dropdown" role="menu">')
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
                                            $('<span>').html(item.display_name)
                                        )
                                        .addClass('option')
                                        .attr('data-option', item.id)
                                )
                    );
                    if (current === item.id)
                        option.find('.fa').removeClass('fa-none').addClass('fa-check');
                });
                //add menu
                parent.append(menu);
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
                this.prepend(
                    $('<span class="remove">')
                    .append(
                        $('<i class="fa fa-times action">')
                    )
                    .on('click', function (e) {
                        e.stopPropagation();
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
            var TreeConstructor = ['mail', 'files'].indexOf(type) >= 0  ? views.FolderTree : views.FolderList;
            var tree = new TreeConstructor(dialog.getBody(), {
                    type: type === 'files' ? 'infostore' : type,
                    tabindex: 0,
                    rootFolderId: type === 'files' ? '9' : '1',
                    dialogmode: true,
                    targetmode: true,
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
                this.find('.name').html('<i>' + gt('All folders') + '</i>');
        }
    });

    ext.point('io.ox/search/view/window/facet/folder').extend({
        id: 'dropdown',
        index: '300',
        draw: function (value, baton) {


            var button = this.find('a[type="button"]'),
                current = value.custom,
                option,
                menu = $('<ul class="dropdown dropdown-menu facet-dropdown" role="menu">')
                    .attr({
                        'data-facet': 'folder',
                        'data-value': 'custom'
                    });

            button.attr('data-toggle', 'dropdown');
            button.prepend(
                $('<div class="caret-container">').append(
                    $('<span class="caret">')
                )
            );

            //add fodlers
            util.getFolders(baton.model)
                .then(function (accounts) {

                    //handle each account
                    _.each(accounts, function (account, key) {

                        //reduce list for non primary accounts
                        if (key !== '0') {
                            account.list  = account.list.slice(0, 2);
                        }

                        //sort by type
                        account.list.sort(function (a, b) {
                            return SORT[a.type] - SORT[b.type];
                        });


                        //account name as dropdown header
                        if (Object.keys(accounts).length > 1) {
                            menu.append(
                                $('<li role="presentation" class="dropdown-header">').append(account.name)
                            );
                        }
                        //add option
                        _.each(account.list, function (folder) {
                            menu.append(
                                option = $('<li role="presentation">').append(
                                    $('<a href="#" role="menuitem" class="option" tabindex="-1">')
                                        .append(
                                            $('<i class="fa fa-fw fa-none">'),
                                            $('<span>').text(folder.title)
                                        )
                                        .attr('data-custom', folder.id)
                                        .attr('title', folder.title)
                                )
                            );
                            if (current === folder.id)
                                option.find('.fa').removeClass('fa-none').addClass('fa-check');
                        });

                        //add divider
                        menu.append(
                            $('<li role="presentation" class="divider">')
                        );
                    });
                    //add option to open dialog
                    menu.append(
                        $('<li role="presentation">').append(
                             $('<a href="#" class="option more" role="menuitem" tabindex="-1">')
                                .append(
                                    $('<i class="fa fa-fw fa-none">'),
                                    $('<span>').text(gt('More') + '...')
                                )
                                .attr('data-action', 'dialog')
                        )
                    );
                });

            //add to dom
            this.append(menu).appendTo(this);
        }
    });

    // inline dropdown
    ext.point('io.ox/search/view/window/mobile').extend({
        id: 'dropdown',
        index: 100,
        draw: function () {
            //when exisiting autocomplete dropdown is rendered into this (autocompelte tk container)
            $('<div class="mobile-dropdown col-xs-12">')
                .hide()
                .appendTo(this);
        }
    });

    ext.point('io.ox/search/view/window/mobile').extend({
        id: 'app',
        index: 100,
        draw: function () {
            //overwirte app
            point.replace({
                id: 'apps',
                index: 100,
                row: '0',
                draw: function (baton) {

                    var id = baton.model.getApp(),
                        opt = baton.model.getOptions(),
                        row, cell,
                        items = [],
                        titles = {};

                    //create containers
                    row = $('<div class="row ">').append(
                        cell = $('<div class="btn-group col-xs-12">')
                    );


                    //create dropdown menu entries
                    _(appAPI.getFavorites()).each(function (app) {
                        if (!opt.mapping[app.id] || app.id === 'io.ox/files') {
                            var title = titles[app.id] = gt.pgettext('app', app.title);
                            items.push(
                                $('<li role="presentation">')
                                .append(
                                    $('<a role="menuitem" tabindex="-1" href="#">')
                                        .attr({
                                            'title': title,
                                            'data-app': app.id
                                        })
                                        .append(
                                            $('<i class="fa fa-fw"></i>'),
                                            $('<span>').text(
                                                title
                                            )
                                        )
                                )
                            );
                        }
                    });

                    //create button and append dropdown menue
                    cell.append(
                        $('<a href="#" type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown">')
                            .append(
                                $('<span class="name">'),
                                $('<span class="caret">')
                            ),
                        $('<ul class="dropdown dropdown-menu app-dropdown" role="menu">').append(items)
                    );

                    //current app
                    if (id !== '') {
                        //add icon
                        cell.find('[data-app="' + id + '"]')
                            .find('.fa')
                            .removeClass('fa-none')
                            .addClass('fa-check');
                        //add name
                        cell.find('.name').text(titles[id]);
                    }

                    //delegate handler
                    $('body').delegate('.app-dropdown a', 'click', function (e) {
                        var cell = $(e.target),
                            next = cell.closest('a').attr('data-app');

                        if (next && next !== id)
                            baton.model.setModule(next);
                    });

                    this.append(row);
                }
            });
        }
    });

    // point.extend({
    //     id: 'info',
    //     index: 300,
    //     draw: function (baton) {
    //         var items = baton.model.get('items'),
    //             timespend = Math.round((Date.now() - items.timestamp) / 100) / 10;
    //         if (items.timestamp) {
    //             this.append(
    //                 $('<div>')
    //                 .addClass('info')
    //                 .append(
    //                         $('<span>')
    //                         .addClass('info-item')
    //                         .append(
    //                             gt('Found %1$s items in %2$s seconds', items.length, timespend)
    //                         )
    //                     )
    //             );
    //         }
    //     }
    // });

});
