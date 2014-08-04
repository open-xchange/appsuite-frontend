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
     'settings!io.ox/core',
     'io.ox/search/util',
     'io.ox/core/tk/autocomplete'
    ], function (gt, ext, appAPI, settings, util) {

    'use strict';

    var extensions = {

        facets: function (baton) {

            // ensure folder facet is set
            baton.model.ensure();

            var list = baton.model.get('poollist'),
                pool = baton.model.get('pool');

            this.append(
                _(list).map(function (item) {

                    // get active value
                    var facet = pool[item.facet], value, node, button;

                    if (!facet) return $();

                    value = facet.values[item.value];

                    // create facet node
                    node = $('<li role="presentation" class="facet btn-group">').append(
                        // in firefox clicks on nested elements in buttons won't work - therefore this needs to be a  <a href="#">
                        button = $('<a href="#" type="button" role="button" class="btn btn-default dropdown-toggle" tabindex="1">')
                        .on('click', function (e) { e.preventDefault(); })
                        .append($('<label>'))
                    );

                    // general stuff
                    ext.point('io.ox/search/view/window/facet').invoke('draw', button, value, facet, baton);

                    // additional actions per id/type
                    ext.point('io.ox/search/view/window/facet/' + value.facet).invoke('draw', node, value, baton);

                    return node;
                })
            );
        }
    };


    /**
     * fullscreen:  io.ox/search/view/window
     * mobile:      io.ox/search/view/window/mobile
     */

    var point = ext.point('io.ox/search/view/window'),
        SORT = {
            current: 1,
            'default': 2,
            standard: 3
        },
        dropdown = function (baton, container) {
            var ref,
                app = baton.app,
                model = baton.model,
                cancelbtn, searchbtn;

            // buttons
            cancelbtn =  $('<a href="#">')
                            .attr({
                                'tabindex': '1',
                                'class': 'btn-clear',
                                'data-toggle': 'tooltip',
                                'data-placement': 'bottom',
                                'data-animation': 'false',
                                'data-container': 'body',
                                'data-original-title': gt('Close search')
                            }).append(
                                $('<i class="fa fa-times"></i>')
                            )
                            .tooltip()
                            .on('click', function (e) {
                                e.preventDefault();
                                app.view.trigger('button:clear');
                            });

            searchbtn = $('<span class="input-group-btn">').append(
                            // submit
                            $('<button type="button">')
                            .attr({
                                'tabindex': '1',
                                'class': 'btn btn-default btn-search',
                                'data-toggle': 'tooltip',
                                'data-placement': 'bottom',
                                'data-animation': 'false',
                                'data-container': 'body',
                                'data-original-title': gt('Search'),
                                'aria-label': gt('Search')
                            })
                            .append(
                                $('<i class="fa fa-search"></i>')
                            )
                            .tooltip()
                            .on('click', function (e) {
                                e.preventDefault();
                                var e = $.Event('keydown');
                                e.which = 13;
                                $(ref).trigger(e);
                                app.view.trigger('button:search');
                            })
                        );
            // input group and dropdown
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
                            delay: 100,
                            parentSelector: container  ? '.query' : '.io-ox-search',
                            model: model,
                            container: container,
                            cbshow: function () {
                                // reset autocomplete tk styles
                                if (container)
                                    $(this).attr('style', '');

                            },
                            // TODO: would be nice to move to control
                            source: function (val) {
                                // show dropdown immediately (busy by autocomplete tk)
                                ref.open();
                                return app.apiproxy.search(val);
                            },
                            draw: function (value) {
                                $(this)
                                    .data(value)
                                    .html(value.display_name);
                                if (container) {
                                    // reset calculated style from autocomplete tk
                                    container.attr('style', 'width: 100%;');
                                }
                            },
                            stringify: function () {
                                // keep input value when item selected
                                return ref.val();
                            },
                            click: function (e) {
                                // apply selected filter
                                var node = $(e.target).closest('.autocomplete-item'),
                                    value = node.data();
                                ref.val('');

                                // exclusive: define used option (type2 default is index 0 of options)
                                var option = _.find(value.options, function (item) {
                                    return item.id === value.id;
                                });

                                model.add(value.facet, value.id, (option || {}).id);
                            }
                        })
                        .on('focus focus:custom click', function (e, opt) {
                            // hint: 'click' supports click on already focused
                            // keep dropdown closed on focus event
                            opt = _.extend({}, opt || {}, { keepClosed: e.type.indexOf('focus') === 0});

                            // simulate tab keyup event
                            ref.trigger({
                                    type: 'keyup',
                                    which: 9
                                }, opt);

                        })
                        .on('keyup', function (e, options) {
                            var opt = _.extend({}, (e.data || {}), options || {}),
                                // keys pressed
                                down = e.which === 40 && !ref.isOpen(),
                                tab = e.which === 9;

                            // adjust original event instead of throwing a new one
                            // cause handler (fnKeyUp) is debounced and we might set some options
                            if (_.isUndefined(opt.isRetry) && (down || tab)) {
                                e.data = _.extend({}, e.data || {}, opt, {isRetry: true});
                            }
                        }),
                        cancelbtn,
                        searchbtn
                    )
            );

            return this;
        };

    // window mode
    point.extend({
        id: 'apps',
        index: 100,
        row: '0',
        draw: function (baton) {
            var id = baton.model.getApp(),
                opt = baton.model.getOptions(),
                row, cell, elem,
                apps = settings.get('search/modules', []);

            // create container
            row = $('<div class="row applications">').append(
                cell = $('<ul class="col-xs-12 list-unstyled">')
            );

            // apply mapping (infostore-files-drive chameleon)
            apps = _.map(apps, function (module) {
                var id = 'io.ox/' + module;
                return opt.mapping[id] || id;
            });

            // create menu entries
            _(apps).each(function (id) {
                var title = (ox.manifests.apps[id + '/main'] || {}).title;
                if (title) {
                    cell.append(
                        $('<li role="presentation" class="application">')
                            .append(
                                $('<div class="btn-group">')
                                .append(
                                    $('<button type="button" class="btn btn-link">')
                                        .attr('data-app', id)
                                        .addClass('pull-left')
                                        .text(/*#, dynamic*/gt.pgettext('app', title))
                                )
                            )
                    );
                }
            });

            // mark as active
            if (id !== '') {
                cell.find('[data-app="' + id + '"]')
                .removeClass('btn-link')
                .addClass('btn-primary');
            }
            // register click handler
            cell.find('li').on('click', function (e) {
                var node = $(e.target);
                baton.model.setModule(node.attr('data-app'));
                baton.app.view.trigger('change:app');
            });

            var elem = this.find('.row.applications');
            if (elem.length)
                elem.replaceWith(row);
            else
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
        draw: function (baton) {
            var node = $('<ul class="col-xs-12 list-unstyled search-facets">'),
                row = $('<div class="row facets">').append(node),
                elem;

            extensions.facets.call(node, baton);

            var elem = this.find('.row.facets');
            if (elem.length)
                elem.replaceWith(row);
            else
                this.append(row);
        }
    });

    // register select handler for facet option click event
    point.extend({
        id: 'handler',
        index: 260,
        draw: function (baton) {
            $('body').delegate('.facet-dropdown .option', 'click tap', function (e) {
                // TODO: remove hack
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
                // mobile
                $(this).closest('.custom-dropdown').toggle();
                ox.idle();

                $(e.target).closest('.dropdown.open').toggle();

                var link = $(e.target).closest('a'),
                    list = link.closest('ul'),
                    option = link.attr('data-action') || link.attr('data-custom') || link.attr('data-option'),
                    facet = list.attr('data-facet'),
                    value = list.attr('data-value');

                // select option
                if (option === 'dialog') {
                    // open folder dialog
                    var facet = baton.model.get('folder');
                    folderDialog(facet, baton);
                } else {
                    if (facet === 'folder') {
                        // overwrite custom
                        baton.model.update(facet, value, {display_name: link.attr('title'), custom: option });
                    } else {
                        // use existing option
                        baton.model.update(facet, value, {option: option });
                    }
                    baton.model.trigger('query');
                }
            });
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
                    $('<div class="info">')
                        .append(
                            $('<span>')
                            .addClass('info-item')
                            .append(
                                gt('More than the currently displayed %1$s items were found', count)
                            )
                        );
            var elem = this.find('.info');
            if (elem.length)
                elem.replaceWith(row);
            else
                this.append(row);
        }
    });

    point.extend({
        id: 'busy',
        index: 500,
        draw: function () {
            this.append(
                $('<div class="row busy">')
                    .append(
                        $('<div class="col-xs-12 io-ox-busy">')
                            .css('min-height', '50px')
                        )
            );
        }
    });

    function getOptionLabel(options, id) {
        var current = _.find(options, function (item) {
                return item.id === id;
            });
        return (current || {}).display_name;
    }

    // facet
    ext.point('io.ox/search/view/window/facet').extend({
        id: 'type',
        index: 100,
        draw: function (value, facet) {
            var options = value.options,
                id = value._compact.option,
                type;
            // get type label
            if (value.facet === 'folder')
                type = gt('Folder');
            else if (options) {
                type = getOptionLabel(options, id);
            }
            // append type
            if (type) {
                this.find('label').prepend(
                    $('<span>')
                        .addClass('type')
                        // TYPE 3: use facet label instead of option label
                        .html(facet.style === 'exclusive' ? facet.display_name : type)
                );
            }
        }
    });

    ext.point('io.ox/search/view/window/facet').extend({
        id: 'name',
        index: 200,
        draw: function (value, facet) {
            var type;

            // TYPE 3: use option label instead of value label
            if (facet.style === 'exclusive')
                type = getOptionLabel(value.options, value._compact.option);

            this.find('label').append(
                $('<span>')
                    .addClass('name')
                    .html(type || value.display_name)
            );
        }
    });

    ext.point('io.ox/search/view/window/facet').extend({
        id: 'dropdown',
        index: 300,
        draw: function (value, facet) {
            var options = facet.options || _.values(facet.values)[0].options || [],
                current = value._compact.option, option,
                parent = this.parent(),
                menu;

            if (options.length) {
                this.attr('data-toggle', 'dropdown');
                // add caret
                this.prepend(
                    $('<div class="caret-container">').append(
                        $('<span class="caret">')
                    )
                );

                // creste menu
                menu = $('<ul class="dropdown dropdown-menu facet-dropdown" role="menu">')
                        .attr({
                            'data-facet': facet.id,
                            'data-value': value.id
                        });
                _.each(options, function (item) {
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
                // add menu
                parent.append(menu);
            }
        }
    });

    ext.point('io.ox/search/view/window/facet').extend({
        id: 'remove',
        index: 400,
        draw: function (value, facet, baton) {
            var isMandatory = baton.model.isMandatory(value.facet);
           // remove action for non mandatory facets
            if (!isMandatory && value.facet !== 'folder') {
                this.prepend(
                    $('<span class="remove">')
                    .append(
                        $('<i class="fa fa-times action">')
                    )
                    .on('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        baton.model.remove(value.facet || value._compact.facet, value.id);
                    })
                );
            }
        }
    });


    // facet type: folder
    function folderDialog(facet, baton) {

        require(['io.ox/core/folder/picker', 'io.ox/core/folder/api'], function (picker, api) {

            var id = facet.values[0].custom,
                type = baton.model.getModule();

            picker({
                folder: id,
                module: type === 'files' ? 'infostore' : type,
                root: type === 'files' ? '9' : '1',
                done: function (target) {
                    // TODO: better way tp get label?!
                    // Hääää? Was soll das?
                    var label = 'Please fix'; // var label = $(arguments[2]).find('[data-obj-id="' + target + '"]').find('.short-title').text();
                    baton.model.update(facet.id, id, { custom: target, display_name: label });
                },
                customize: function (baton) {
                    var data = baton.data,
                        same = type === 'move' && data.id === id,
                        create = api.can('create', data);
                    if (same || !create) this.addClass('disabled');
                }
            });
        });
    }

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

            // add fodlers
            util.getFolders(baton.model)
                .then(function (accounts) {

                    // handle each account
                    _.each(accounts, function (account, key) {

                        // reduce list for non primary accounts
                        if (key !== '0') {
                            account.list  = account.list.slice(0, 2);
                        }

                        // sort by type
                        account.list.sort(function (a, b) {
                            return SORT[a.type] - SORT[b.type];
                        });


                        // account name as dropdown header
                        if (Object.keys(accounts).length > 1) {
                            menu.append(
                                $('<li role="presentation" class="dropdown-header">').append(account.name)
                            );
                        }
                        // add option
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

                        // add divider
                        menu.append(
                            $('<li role="presentation" class="divider">')
                        );
                    });
                    // add option to open dialog
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

            // add to dom
            this.append(menu).appendTo(this);
        }
    });

    ext.point('io.ox/search/view/window/facet/folder').extend({
        id: 'all-folders',
        index: '400',
        draw: function (value, baton) {
            var link;
            // dropdown entry
            if (!baton.model.isMandatory('folder')) {

                // add dropdown entry
                this.find('ul.dropdown').prepend(
                    $('<li role="presentation">').append(
                         link = $('<a href="#" class="option more" role="menuitem" tabindex="-1">')
                                    .append(
                                        $('<i class="fa fa-fw ">'),
                                        $('<span>').text(gt('All folders'))
                                    )
                                    .attr('data-custom', 'custom')
                                    .attr('title', gt('All folders'))
                    )
                );
                // is active
                if (!value.custom || value.custom === 'custom') {
                    // set display name
                    this.find('.name')
                        .text(gt('All folders'));
                    // set fa-check icon
                    link.find('i')
                        .addClass('fa-check');
                }
            }
        }
    });

    // inline dropdown
    ext.point('io.ox/search/view/window/mobile').extend({
        id: 'dropdown',
        index: 100,
        draw: function () {
            // when exisiting autocomplete dropdown is rendered into this (autocompelte tk container)
            $('<div class="mobile-dropdown col-xs-12">')
                .hide()
                .appendTo(this);
        }
    });

    ext.point('io.ox/search/view/window/mobile').extend({
        id: 'app',
        index: 100,
        draw: function () {
            // overwirte app
            point.replace({
                id: 'apps',
                index: 100,
                row: '0',
                draw: function (baton) {

                    var id = baton.model.getApp(),
                        opt = baton.model.getOptions(),
                        row, cell,
                        items = [],
                        titles = {},
                        apps = settings.get('search/modules', []);

                    // create containers
                    row = $('<div class="row ">').append(
                        cell = $('<div class="btn-group col-xs-12">')
                    );

                    // apply mapping (infostore-files-drive chameleon)
                    apps = _.map(apps, function (module) {
                        var id = 'io.ox/' + module;
                        return opt.mapping[id] || id;
                    });

                    // create dropdown menu entries
                    _(apps).each(function (id) {
                        var title = titles[id] = (ox.manifests.apps[id + '/main'] || {}).title;
                        items.push(
                            $('<li role="presentation">')
                            .append(
                                $('<a role="menuitem" tabindex="-1" href="#">')
                                    .attr({
                                        'title': title,
                                        'data-app': id
                                    })
                                    .append(
                                        $('<i class="fa fa-fw"></i>'),
                                        $('<span>').text(
                                            title
                                        )
                                    )
                            )
                        );
                    });

                    // create button and append dropdown menue
                    cell.append(
                        $('<a href="#" type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown">')
                            .append(
                                $('<span class="name">'),
                                $('<span class="caret">')
                            ),
                        $('<ul class="dropdown dropdown-menu app-dropdown" role="menu">').append(items)
                    );

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

                    this.append(row);
                }
            });
        }
    });

    return extensions;

});
