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
     'io.ox/core/date',
     'io.ox/search/util',
     'gettext!io.ox/core'], function (ext, settings, dateAPI, util, gt) {

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
                disable: function (data) {
                    var same = type === 'move' && data.id === id,
                        create = api.can('create', data);
                    return same || !create;
                }
            });
        });
    }

    var SORT = {
            current: 1,
            'default': 2,
            standard: 3
        },
        LABEL = {
            hide: gt('Hide advanced filters'),
            show: gt('Show advanced filters')
        },
        extensions = {

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


                if (!baton.model.get('showadv'))
                    self.hide();

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
                    value = value || {facet: facet.id, placeholder: true};

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
                        $('<nav>').append(
                            $('<a data-action="toggle-adv">')
                                .text(baton.model.get('showadv') ? LABEL.hide : LABEL.show)
                                .attr({
                                    tabindex: 1,
                                    role: 'button',
                                    href: '#'
                                })
                                .on('click ', function () {
                                    var visible = self.is(':visible');
                                    $(this).text(visible ? LABEL.show : LABEL.hide);
                                    baton.model.set('showadv', !visible);
                                    self.toggle();
                                })
                        )
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
                    $('#io-ox-core').removeClass('menu-blur');
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
                            .text(type || facet.name)

                    );
                }
            },

            facetName: function (baton, value, facet) {
                var node = $('<span>').addClass('name'),
                    detail = (value.item || {}).detail,
                    label = value.name || (value.item || {}).name,
                    optionslabel;

                if (detail) {
                    // example: searchtem <i>in description</i>
                    node.append(
                        $.txt(value.item.name + '\u00A0'),
                        $('<i>').text(detail)
                    );
                } else {
                    // TYPE 3: use option label instead of value label
                    if (facet.style === 'exclusive' && value._compact)
                        optionslabel = util.getOptionLabel(value.options, value._compact.option);
                    node.text(optionslabel || label || gt('All'));
                }

                this.find('label').append(node);
            },

            facetRemove: function (baton, value, facet, fn) {
                var isMandatory = baton.model.isMandatory(value.facet), node;

                // remove action for non mandatory facets
                if ((isMandatory && value.facet === 'folder') || _.contains(facet.flags, 'advanced') || value.placeholder) return;

                this.prepend(
                    node = $('<span class="remove">')
                     .attr({
                        'tabindex': '1',
                        'aria-label': gt('Remove')
                    })
                    .append(
                        $('<i class="fa fa-times action">')
                    )
                    .on('click', fn || function () {
                        baton.model.remove(value.facet || value._compact.facet, value.id);
                        return false;
                    })

                );
                // tooltip
                if(!_.device('touch')) {
                    node.attr({
                        'data-toggle': 'tooltip',
                        'data-placement': 'bottom',
                        'data-animation': 'false',
                        'data-container': 'body',
                        'data-original-title': gt('Remove')
                        })
                        .tooltip()
                        .on('click', function () {
                            if (node.tooltip)
                                node.tooltip('hide');
                        });
                }
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
                            $('<i class="fa fa-caret-down">')
                        )
                    );

                    // create menu
                    menu = $('<ul class="dropdown dropdown-menu facet-dropdown">')
                            .attr({
                                'data-facet': facet.id,
                                'data-value': value.id
                            });

                    // add generic 'all'
                    if (_.contains(facet.flags, 'advanced')) {
                        menu.append(
                            $('<li>').append(
                                 $('<a tabindex="-1" href="#" role="menuitemcheckbox">')
                                    .append(
                                        $('<i class="fa fa-fw">')
                                            .addClass(current === '' ? 'fa-check': 'fa-none'),
                                        $('<span>').text(gt('All'))
                                    )
                                    //.addClass('option')
                                    .attr({
                                        'data-option': 'unset'
                                    })
                                    .click(function () {
                                        if (current !== '')
                                            baton.model.remove(facet.id, current);
                                    })
                            ),
                            $('<li role="presentation" class="divider"></li>')
                        );
                    }

                    // add options
                    _.each(options, function (item) {
                        menu.append(
                            option = $('<li role="presentation">').append(
                                         $('<a role="menuitemcheckbox" tabindex="-1" href="#">')
                                            .append(
                                                $('<i class="fa fa-fw fa-none">'),
                                                $('<span>').text(item.name || item.item.name)
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

                    //apply a11y
                    this.dropdown();
                }

                // copy search string to input
                if (_.contains(facet.flags, 'highlander')) {
                    this.on('click', function () {
                        var sidepanel = $(this).closest('.window-sidepanel'),
                            field = sidepanel.find('.search-field'),
                            key = Object.keys(facet.values)[0];
                        field.val(facet.values[key].name);
                    });
                }

            },

            timeFacet: function (baton, value, facet) {
                var self = this,
                    VALUE = 'daterange',
                    isUpdate = !!baton.model.get('pool')['date.custom'],
                    data, from, to, group, current, container;

                // add styles
                self.addClass('timefacet');

                // add vs update
                facet = baton.model.get('pool')['date.custom'] || facet;

                // predefined values
                data = value.options && value.options[0] ? value.options[0] : {};
                from = data.from ? (new dateAPI.Local(data.from)).format(dateAPI.DATE) : undefined;
                to = data.to ? (new dateAPI.Local(data.to)).format(dateAPI.DATE) : undefined;
                current = data.id || undefined;

                // data from inputs
                function getData () {
                    var nodes = group.find('input'),
                        range = [],
                        WILDCARD = '*';
                    // construct facet custom value
                    _.each(nodes, function (node) {
                        node = $(node);
                        var value = node.val(),
                            type = node.attr('name');

                        if (value !== '') {
                            // standard date format
                            value = (dateAPI.Local.parse(value, dateAPI.DATE));
                            // use 23:59:59 for end date
                            value = type === 'start' ? value : value.setHours(0,0,0,0).add(dateAPI.DAY-1);
                        } else {
                            // use wildcard
                            value = value !== '' ? value : WILDCARD;
                        }

                        // get date parts
                        range.push({
                            value: value.format ? value.valueOf() : value
                        });
                    });
                    return {
                        id: '['+ range[0].value + ' TO ' + range[1].value + ']',
                        from: range[0].value.replace ? null : range[0].value,
                        to: range[1].value.replace ? null : range[1].value
                    };
                }
                // datepicker range automatically corrects dates so whe delay a little bit
                var lazyApply = _.debounce(apply, 200);

                // change handler
                function apply () {
                    var data = getData();

                    // update model only on real change
                    if (current !== data.id) {
                        // update vs add
                        var tmp = facet.values[VALUE] || facet.values[0];
                        // set value custom property
                        tmp.custom = data.id;
                        // set option
                        tmp.options = [data];

                        // remeber current state
                        current = data.id;

                        // update vs app
                        if (!isUpdate) {
                            baton.model.add(facet.id, 'daterange', data.id);
                        } else {
                            baton.model.update(facet.id, VALUE, {option: data.id, value: VALUE});
                        }
                        baton.model.trigger('query', baton.model.getApp());
                    }
                }

                //i18n: just localize the picker, use en as default with current languages
                $.fn.datepicker.dates.en = {
                    days: dateAPI.locale.days,
                    daysShort: dateAPI.locale.daysShort,
                    daysMin: dateAPI.locale.daysStandalone,
                    months: dateAPI.locale.months,
                    monthsShort: dateAPI.locale.monthsShort,
                    today: gt('Today')
                };

                // used to handle overlow when datepicker is shown
                $('body>.datepicker-container').remove();
                $('body').append(
                    container = $('<div class="datepicker-container">').hide()
                );

                // input group
                self.find('label')
                    .append(
                        $('<div>')
                            .addClass('type')
                            .text(facet.name),
                        group = $('<div class="input-daterange input-group" id="datepicker">')
                                    .append(
                                        $('<input type="text" class="input-sm form-control" name="start" />')
                                            .attr('placeholder', gt('Starts on'))
                                            .val(from)
                                            .on('change', lazyApply),
                                        $('<span class="input-group-addon">')
                                            .text('-'),
                                        $('<input type="text" class="input-sm form-control" name="end" />')
                                            .attr('placeholder', gt('Ends on'))
                                            .val(to)
                                            .on('change', lazyApply)
                                    )
                                    .datepicker({
                                        format: dateAPI.getFormat(dateAPI.DATE).replace(/\by\b/, 'yyyy').toLowerCase(),
                                        parentEl: container,
                                        weekStar: dateAPI.locale.weekStart,
                                        //orientation: 'top left auto',
                                        autoclose: true,
                                        clearBtn: false,
                                        todayHighlight: true,
                                        //insert date when clicked
                                        todayBtn: 'linked'
                                    })
                                    .on('show', function (e) {
                                        // position container (workaround)
                                        var offset = $(e.target).offset();
                                        container.show();

                                        // use samt offset
                                        container.offset(offset);

                                        // appply child style
                                        container.find('.datepicker').css({
                                            top: $(e.target).outerHeight(),
                                            left: 0
                                        });
                                    })
                    );
            },

            folderFacet: function (baton, value, facet) {
                var self = this,
                    button = this.find('a[type="button"]'),
                    current = value.custom,
                    option, link,
                    menu = $('<ul class="dropdown dropdown-menu facet-dropdown">')
                        .attr({
                            'data-facet': 'folder',
                            'data-value': 'custom'
                        });

                ext.point('io.ox/search/facets/facet-type').invoke('draw', button, baton, value, facet);
                ext.point('io.ox/search/facets/facet-name').invoke('draw', button, baton, value, facet);

                button.attr({
                        'data-toggle': 'dropdown'
                    });

                button.prepend(
                    $('<div class="caret-container">').append(
                        $('<i class="fa fa-caret-down">')
                    )
                );

                // add 'all folders'
                var link;
                if (!baton.model.isMandatory('folder')) {
                    menu.prepend(
                        $('<li role="presentation">').append(
                             link = $('<a href="#" class="option more" role="menuitemcheckbox" tabindex="-1">')
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
                        link.attr('aria-checked', true);
                    }
                }

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
                                    $('<li class="dropdown-header">').append(account.name)
                                );
                            }
                            // add option
                            _.each(account.list, function (folder) {
                                menu.append(
                                    option = $('<li>').append(
                                        $('<a href="#" role="menuitemcheckbox" class="option" tabindex="-1">')
                                            .append(
                                                $('<i class="fa fa-fw fa-none">'),
                                                $('<span>').text(folder.title)
                                            )
                                            .attr({
                                                'data-custom': folder.id,
                                                'title': folder.title,
                                                tabIndex: '-1'
                                            })
                                    )
                                );
                                if (current === folder.id) {
                                    option.find('a').attr('aria-checked', true);
                                    option.find('.fa').removeClass('fa-none').addClass('fa-check');
                                }
                            });

                            // add divider
                            menu.append(
                                $('<li class="divider">')
                            );
                        });
                        // add option to open dialog
                        menu.append(
                            $('<li>').append(
                                 $('<a href="#" class="option more" role="menuitemcheckbox" tabindex="-1">')
                                    .append(
                                        $('<i class="fa fa-fw fa-none">'),
                                        $('<span>').text(gt('More') + '...')
                                    )
                                    .attr('data-action', 'dialog')
                            )
                        );
                    }).then(function () {
                        // add to dom
                        self.append(menu);

                        // custom remove handler for folders
                        function remove (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            (facet.values.custom || facet.values[0]).custom = 'custom';
                            baton.model.update(facet.id, 'custom', {custom: 'custom'});
                        }

                        if (value.custom && value.custom !== 'custom')
                            // use custom click handler
                            ext.point('io.ox/search/facets/facet-remove').invoke('draw', button, baton, value, facet, remove);

                        // apply a11y
                        button.dropdown();
                    });
            }
        };

    return extensions;
});
