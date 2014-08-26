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

define('io.ox/search/facets/extensions',
    ['io.ox/core/extensions',
     'settings!io.ox/core',
     'io.ox/search/util',
     'gettext!io.ox/core'], function (ext, settings, util, gt) {

    //var POINT = 'io.ox/search/facets';

    function folderDialog(facet, baton) {
        require(['io.ox/core/folder/picker', 'io.ox/core/folder/api'], function (picker, api) {
            var value = facet.values.custom,
                id = value.custom,
                type = baton.model.getModule();

            picker({
                folder: id,
                module: type === 'files' ? 'infostore' : type,
                root: type === 'files' ? '9' : '1',
                done: function (target) {
                    //get folder data
                    api.get(target)
                        .always(function (data) {
                            //use id as fallback label
                            var label = (data || {}).title || target;
                            baton.model.update(facet.id, id, { custom: target, name: label });
                        });
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

    /**
     * custom facet: datepicker
     */
    ext.point('io.ox/search/facets/custom/daterange').extend({
        id: 'datarange',
        index: 100,
        draw: function (baton, facet, value, option) {
            require(['io.ox/core/tk/dialogs', 'io.ox/core/date'], function (dialogs, date) {
                var dialog = new dialogs.ModalDialog({ width: 450 }),
                    node;

                function addDatepicker (node) {
                    var tmp;
                    node.css('height', '300px')
                        .append(
                            $('<div class="input-daterange input-group" id="datepicker">')
                            .css('margin', 'auto')
                            .append(
                                $('<input type="text" class="input-sm form-control" name="start" />'),
                                $('<span class="input-group-addon">to</span>'),
                                $('<input type="text" class="input-sm form-control" name="end" />'),
                                tmp = $('<div>')
                            )
                            .datepicker({
                                format: date.getFormat(date.DATE).replace(/\by\b/, 'yyyy').toLowerCase(),
                                parentEl: tmp,
                                orientation: 'top left auto',
                                autoclose: true,
                                todayHighlight: true
                            })
                        );
                }

                function setRange (action) {
                    if (action === 'cancel') {
                            return;
                        } else {
                            var values = node.find('input'),
                                list = [], id, options,
                                display = [];

                            // construct facet custom value
                            _.each(values, function (n) {
                                var value = $(n).val(),
                                    parts = value.split('/');
                                display.push(value.toLocaleString().split(',')[0]);
                                list.push(
                                    new Date(parts[2], parts[1]-1, parts[0])
                                );
                            });
                            id = '['+ list[0].valueOf() + ' TO ' + list[1].valueOf() + ']';

                            // adjust id that is used as value
                            options = baton.model.get('pool').time.options;
                            _.each(options, function (o) {
                                if (o.point === option.option) {
                                    o.id = id;
                                    o.name = display.join(' - ');
                                }

                            });
                            // update model
                            baton.model.update(facet, value, {option: id });
                            baton.model.trigger('query', baton.model.getApp());
                        }
                }

                dialog.build(function () {
                        this.header($('<h4>').text(gt('date range')));
                        node = this.getContentNode();
                    })
                    .addButton('cancel', gt('Close'), 'cancel', {'tabIndex': '1'})
                    .addPrimaryButton('appointment', gt('Apply'), 'apply', {tabIndex: '1'})
                    .show(function () {
                        this.css('top', '30%');
                        this.find('input').focus();
                    })
                    .then(setRange);

                addDatepicker(node);
            });
        }
    });

    var SORT = {
            current: 1,
            'default': 2,
            standard: 3
        },
        extensions = {

            applications: function (baton) {
                var id = baton.model.getApp(),
                    opt = baton.model.getOptions(),
                    row = this,
                    cell = row.find('ul'),
                    apps = settings.get('search/modules', []);

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

            },

            item: function (baton, value, facet) {
                var button = this.find('a');
                ext.point('io.ox/search/facets/facet-type').invoke('draw', button, baton, value, facet);
                ext.point('io.ox/search/facets/facet-name').invoke('draw', button, baton, value, facet);
                ext.point('io.ox/search/facets/facet-dropdown').invoke('draw', button, baton, value, facet);
                ext.point('io.ox/search/facets/facet-remove').invoke('draw', button, baton, value, facet);
            },

            facets: function (baton) {
                // ensure folder facet is set
                baton.model.ensure();

                var list = baton.model.get('poollist'),
                    pool = baton.model.get('pool');

                this.append(
                    _(list).map(function (item) {

                        // get active value
                        var facet = pool[item.facet], value, node, button;

                        if (!facet || _.contains(facet.flags, 'advanced')) return $();

                        value = facet.values[item.value];

                        // create facet node
                        node = $('<li role="presentation" class="facet btn-group">').append(
                            // in firefox clicks on nested elements in buttons won't work - therefore this needs to be a  <a href="#">
                            button = $('<a href="#" type="button" role="button" class="btn btn-default dropdown-toggle" tabindex="1">')
                            .on('click', function (e) { e.preventDefault(); })
                            .append($('<label>'))
                        );

                        var special = ext.point('io.ox/search/facets/item/' + value.facet);
                        if (special.list().length > 0)
                            // additional actions per id/type
                            special.invoke('draw', node, baton, value, facet);
                        else
                            // general stuff
                            ext.point('io.ox/search/facets/item').invoke('draw', node, baton, value, facet);


                        return node;
                    }).reverse()
                );
            },

            advfacets: function (baton) {
                // ensure folder facet is set
                baton.model.ensure();

                var facets = baton.model.get('autocomplete'),
                    pool = baton.model.get('pool'),
                    list = baton.model.get('poollist'),
                    self = this,
                    nodes = [];

                // add inactive advanced facets
                nodes = _(facets).map(function (facet) {
                    var value, node, button;

                    // only advanced
                    if (!_.contains(facet.flags, 'advanced')) return;

                   _.each(list, function (elem) {
                        if (facet.id === elem.facet) {
                            // get value from pool
                            value = _.find(pool[facet.id].values, function (value) {
                                return value.id === elem.value;
                            });
                        }
                    });

                    // use value  when currently active or placeholder
                    value = value || {placeholder: true};

                    // create facet node
                    node = $('<li role="presentation" class="facet btn-group">').append(
                        // in firefox clicks on nested elements in buttons won't work - therefore this needs to be a  <a href="#">
                        button = $('<a href="#" type="button" role="button" class="btn btn-default dropdown-toggle" tabindex="1">')
                        .on('click', function (e) { e.preventDefault(); })
                        .append($('<label>'))
                    );

                    var special = ext.point('io.ox/search/facets/item/' + value.facet);
                    if (special.list().length > 0)
                        // additional actions per id/type
                        special.invoke('draw', node, baton, value, facet);
                    else
                        // general stuff
                        ext.point('io.ox/search/facets/item').invoke('draw', node, baton, value, facet);


                    return node;
                }).reverse();

                // add label
                this.parent().find('a').remove();
                if (_.compact(nodes).length) {
                    this.parent().prepend(
                        $('<a>')
                            .css({
                                'margin-bottom': '8px',
                                'margin-top': '6px',
                                'float': 'right'
                            })
                            .text(gt('Hide Advanced Filters'))
                            .on('click', function () {
                                if (self.is(':visible'))
                                    $(this).text(gt('Show Advanced Filters'));
                                else
                                    $(this).text(gt('Hide Advanced Filters'));
                                self.toggle();
                            })
                    );
                }

                this.append(nodes);
            },


            optionsHandler: function (baton) {

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
                        option = link.attr('data-action') || link.attr('data-custom') ||  link.attr('data-option'),
                        facet = list.attr('data-facet'),
                        value = list.attr('data-value');

                    // select option
                    if (option === 'dialog') {
                        // open folder dialog
                        var facet = baton.model.get('pool').folder;
                        folderDialog(facet, baton);
                    } else if (link.attr('data-point')) {
                        ext.point('io.ox/search/facets/custom/' + link.attr('data-point')).invoke('draw', this, baton, facet, value, {option: link.attr('data-point') });
                    } else {
                        if (facet === 'folder') {
                            // overwrite custom
                            baton.model.update(facet, value, {name: link.attr('title'), custom: option });
                        } else if (!value) {
                            baton.model.add(facet, option, option);
                        } else {
                            // use existing option
                            baton.model.update(facet, value, {option: option });
                        }
                        baton.model.trigger('query', baton.model.getApp(), 'select option');
                    }
                });
            },

            facetType: function (baton, value, facet) {
                var options = value.options || facet.options,
                    id = value._compact ? value._compact.option : undefined,
                    type;

                // get type label
                // TYPE 3: use facet label instead of option label
                if (options && facet.style !== 'exclusive')
                    type = util.getOptionLabel(options, id);
                // append type
                if (facet.style !== 'simple') {
                    this.find('label').prepend(
                        $('<span>')
                            .addClass('type')
                            .html(type || facet.name)

                    );
                }
            },

            facetName: function (baton, value, facet) {
                var type;

                // TYPE 3: use option label instead of value label
                if (facet.style === 'exclusive' && value._compact)
                    type = util.getOptionLabel(value.options, value._compact.option);

                if ((value.item || {}).detail)
                    type = value.item.name +  ' <i>' + value.item.detail + '</i>';

                this.find('label').append(
                    $('<span>')
                        .addClass('name')
                        .html(type || value.name || (value.item || {}).name || gt('All'))
                );
            },

            facetRemove: function (baton, value, facet, fn) {
                var isMandatory = baton.model.isMandatory(value.facet);

                // remove action for non mandatory facets
                if ((isMandatory && value.facet === 'folder') || value.placeholder) return;

                this.prepend(
                    $('<span class="remove">')
                     .attr({
                        'tabindex': '1',
                        'data-toggle': 'tooltip',
                        'data-placement': 'bottom',
                        'data-animation': 'false',
                        'data-container': 'body',
                        'data-original-title': _.contains(facet.flags, 'advanced') ? gt('Reset') : gt('Remove'),
                        'aria-label': _.contains(facet.flags, 'advanced') ? gt('Reset') : gt('Remove')
                    })
                    .tooltip()
                    .append(
                        $('<i class="fa fa-times action">')
                    )
                    .on('click', fn || function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        baton.model.remove(value.facet || value._compact.facet, value.id);
                    })
                );
            },

            facetDropdown: function (baton, value, facet) {
                var options = facet.options || _.values(facet.values)[0].options || [],
                    current = value._compact ? value._compact.option : '',
                    option,
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
                                                $('<span>').html(item.name || item.item.name)
                                            )
                                            .addClass('option')
                                            .attr({
                                                'data-option': item.id,
                                                // used to handle custom facets via extension points
                                                'data-point': item.point
                                            })
                                    )
                        );
                        if (current === item.id)
                            option.find('.fa').removeClass('fa-none').addClass('fa-check');
                    });
                    // add menu
                    parent.append(menu);
                }
            },

            folderFacet: function (baton, value, facet) {
                var button = this.find('a[type="button"]'),
                    current = value.custom,
                    option,
                    menu = $('<ul class="dropdown dropdown-menu facet-dropdown" role="menu">')
                        .attr({
                            'data-facet': 'folder',
                            'data-value': 'custom'
                        });

                ext.point('io.ox/search/facets/facet-type').invoke('draw', button, baton, value, facet);
                ext.point('io.ox/search/facets/facet-name').invoke('draw', button, baton, value, facet);

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

                // add 'all folders'
                var link;
                // add dropdown entry
                menu.prepend(
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

                // add to dom
                this.append(menu).appendTo(this);

                if (value.custom && value.custom !== 'custom')
                    // use custom click handler
                    ext.point('io.ox/search/facets/facet-remove').invoke('draw', button, baton, value, facet, function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        facet.custom = 'custom';
                        baton.model.update(facet.id, 'custom', facet);
                    });
            }
        };

    return extensions;
});
