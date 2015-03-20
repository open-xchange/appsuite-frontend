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

define('io.ox/search/facets/extensions', [
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'io.ox/search/util',
    'gettext!io.ox/core',
    'io.ox/core/tk/datepicker'
], function (ext, settings, util, gt) {

    //var POINT = 'io.ox/search/facets';

    function folderDialog(facet, baton) {
        require(['io.ox/core/folder/picker', 'io.ox/core/folder/api'], function (picker, api) {
            var value = facet.values.custom,
                id = value.custom,
                type = baton.model.getModule(),
                module = type === 'files' ? 'infostore' : type;

            picker({
                folder: id || api.getDefaultFolder(module),
                module: module,
                flat: api.isFlat(module),
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
                    return !api.can('read', data);
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
    phone = _.device('smartphone'),
    extensions = {

        item: function (baton, value, facet) {
            var button = this.find('.facet-container');
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
                    node = $('<li role="presentation" class="facet btn-group" tabindex="1">').append(
                        // in firefox clicks on nested elements in buttons won't work - therefore this needs to be a  <a href="#">
                        button = $('<div class="facet-container">')
                        .on('click', function (e) { e.preventDefault(); })
                        .append($('<label class="facet-label">'))
                    );

                    var special = ext.point('io.ox/search/facets/item/' + value.facet);
                    if (special.list().length > 0) {
                        // additional actions per id/type
                        special.invoke('draw', node, baton, value, facet);
                    } else {
                        // general stuff
                        ext.point('io.ox/search/facets/item').invoke('draw', node, baton, value, facet);
                    }

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
                headline = this.parent().find('h3.sr-only'),
                self = this,
                nodes = [];

            if (!baton.model.get('showadv')) {
                self.hide();
                headline.hide();
            }

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
                value = value || { facet: facet.id, placeholder: true };

                // create facet node
                node = $('<li role="presentation" class="facet btn-group" tabindex="1">').append(
                    // in firefox clicks on nested elements in buttons won't work - therefore this needs to be a  <a href="#">
                    button = $('<div class="facet-container">')
                    .on('click', function (e) { e.preventDefault(); })
                    .append($('<label class="facet-label">'))
                );

                var special = ext.point('io.ox/search/facets/item/' + value.facet);
                if (special.list().length > 0) {
                    // additional actions per id/type
                    special.invoke('draw', node, baton, value, facet);
                } else {
                    // general stuff
                    ext.point('io.ox/search/facets/item').invoke('draw', node, baton, value, facet);
                }

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
                            .on('click', function () {
                                var visible = self.is(':visible');
                                $(this).text(visible ? LABEL.show : LABEL.hide);
                                require(['io.ox/core/yell'], function (yell) {
                                    //#. screenreader: feedback when clicking on action 'show' respectively 'hide' advanced filters
                                    yell('screenreader', visible ? gt('Advanced facets block was closed.') : gt('Advanced facets block was opened.'));
                                });

                                baton.model.set('showadv', !visible);

                                self.toggle();
                                headline.toggle();
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
                if (phone) {
                    $('#io-ox-core').removeClass('menu-blur');
                    $(this).closest('.custom-dropdown').toggle();
                }
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
                    ext.point('io.ox/search/facets/custom/' + link.attr('data-point')).invoke('draw', this, baton, facet, value, { option: link.attr('data-point') });
                } else {
                    if (facet === 'folder') {
                        // overwrite custom
                        baton.model.update(facet, value, { name: link.attr('title'), custom: option });
                    } else if (!value) {
                        baton.model.add(facet, option, option);
                    } else {
                        // use existing option
                        baton.model.update(facet, value, { option: option });
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
                this.find('.facet-label').prepend(
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
                labelnode = this.find('.facet-label'),
                labels,
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

            labelnode.append(node);

            // a11y facet label
            labels = labelnode.find('span').map(
                function (index, span) {
                    // text() does not return separators (css after content)
                    return $(span).text() + ' ';
                }
            );
            this.attr('aria-label', labels.toArray().join(''));

        },

        facetRemove: function (baton, value, facet, fn) {
            var isMandatory = baton.model.isMandatory(value.facet), node,
                fnRemove = function (e) {

                    if (e.type === 'keyup' && e.which !== 13) return false;

                    // use custom handler
                    if (fn) {
                        fn();
                    } else {
                        baton.model.remove(value.facet || value._compact.facet, value.id);

                    }
                    return false;
                };

            // remove action for non mandatory facets
            if ((isMandatory && value.facet === 'folder') || _.contains(facet.flags, 'advanced') || value.placeholder) return;

            this.prepend(
                node = $('<span class="remove">')
                .attr({
                    'tabindex': 1,
                    'aria-label': gt('Remove facet')
                })
                .append(
                    $('<i class="fa fa-times action">')
                )
                .on('click mousdown keyup', fnRemove)
            );
            // tooltip
            util.addTooltip(node, gt('Remove'));
        },

        facetDropdown: function (baton, value, facet) {
            var options = facet.options || _.values(facet.values)[0].options || [],
                current = value._compact ? value._compact.option : '',
                parent = this.parent(),
                menu, action, option;

            if (options.length) {
                this.addClass('dropdown-toggle');

                this.attr('data-toggle', 'dropdown');
                // add caret
                this.prepend(
                    $('<span class="toggle-options">').append(
                        action = $('<i class="fa fa-caret-down action">')
                    ).attr({
                        'tabindex': '1',
                        'aria-label': gt('Toggle options')
                    })
                );

                // tooltip
                util.addTooltip(action, gt('Adjust'));

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
                                        .addClass(current === '' ? 'fa-check' : 'fa-none'),
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
                data, from, to, group, current, container,
                facetcontainer = $('<fieldset class="facet-container">');

            this.find('.facet-container').replaceWith(facetcontainer);

            // add styles
            self.addClass('timefacet');

            // add vs update
            facet = baton.model.get('pool')['date.custom'] || facet;

            // predefined values
            data = value.options && value.options[0] ? value.options[0] : {};
            from = data.from ? (moment(data.from)).format('l') : undefined;
            to = data.to ? (moment(data.to)).format('l') : undefined;
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
                        value = moment(value, 'l');
                        // use 23:59:59 for end date
                        value = type === 'start' ? value : value.endOf('day');
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
                    id: '[' + range[0].value + ' TO ' + range[1].value + ']',
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
                        baton.model.update(facet.id, VALUE, { option: data.id, value: VALUE });
                    }
                    baton.model.trigger('query', baton.model.getApp());
                }
            }

            // used to handle overlow when datepicker is shown
            $('body>.datepicker-container').remove();
            $('body').append(
                container = $('<div class="datepicker-container">').hide()
            );

            var getBlock = function (label, name, value) {
                var guid = _.uniqueId('form-control-label-');
                return [
                    $('<label class="sr-only">').attr('for', guid).text(label),
                    $('<input type="text" class="input-sm form-control" />')
                        .attr({
                            'name': name,
                            'id': guid,
                            'placeholder': label,
                            'tabIndex': 1,
                            'aria-label': gt('Use cursor keys to change the date. Press ctrl-key at the same time to change year or shift-key to change month. Close date-picker by pressing ESC key.')
                        })
                        .val(value)
                        .on('change', lazyApply)
                ];
            };

            // input group
            facetcontainer
                .append(
                    $('<div>')
                        .addClass('type')
                        .text(facet.name),
                    group = $('<div class="input-daterange input-group" id="datepicker">')
                                .append(
                                    getBlock(gt('Starts on'), 'start', from),
                                    $('<span class="input-group-addon">').text('-'),
                                    getBlock(gt('Ends on'), 'start', to)
                                )
                                .datepicker({
                                    parentEl: container,
                                    //orientation: 'top left auto',
                                    clearBtn: false
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
                button = this.find('.facet-container'),
                current = value.custom,
                option, link, action,
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
                $('<span class="toggle-options">').append(
                    action = $('<i class="fa fa-caret-down action">')
                ).attr({
                    'tabindex': '1',
                    'aria-label': gt('Toggle options')
                })
            );

            // tooltip
            util.addTooltip(action, gt('Change folder'));

            // disable dropdown until menu is added (mobiles custom dropdown)
            if (phone) { button.addClass('disabled'); }

            // add 'all folders'
            var link;
            if (!baton.model.isMandatory('folder')) {
                menu.prepend(
                    $('<li role="presentation">').append(
                        link = $('<a href="#" class="option more" role="menuitemcheckbox" tabindex="-1">').append(
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

                            // ignore any virtual folders
                            if (/^virtual/.test(folder.id)) return;

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
                                    $('<span>').text(gt('More') + ' ...')
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
                        baton.model.update(facet.id, 'custom', { custom: 'custom' });
                    }

                    if (value.custom && value.custom !== 'custom')
                        // use custom click handler
                        ext.point('io.ox/search/facets/facet-remove').invoke('draw', button, baton, value, facet, remove);

                    // enable dropdown again
                    if (phone) { button.removeClass('disabled'); }

                    // apply a11y
                    button.dropdown();
                });
        }
    };

    return extensions;
});
