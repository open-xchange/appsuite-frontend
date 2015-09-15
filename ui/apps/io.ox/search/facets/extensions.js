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
    extensions = {

        facets: function (baton) {
            // ensure folder facet is set
            // async
            var self = this;
            baton.model.ensure().then(function () {
                var list = baton.model.get('poollist'),
                    pool = baton.model.get('pool');

                self.append(
                    _(list).map(function (item) {

                        // get active value
                        var facet = pool[item.facet], value, node;

                        value = facet.values[item.value];

                        // for folder
                        var special = ext.point('io.ox/search/facets/item/' + value.facet);
                        if (special.list().length > 0) {
                            // additional actions per id/type
                            special.invoke('draw', self, baton, value, facet);
                            return;
                        }
                        return node;
                    }).reverse()
                );
            });
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

        folderFacet: function (baton, value) {
            var self = this,
                button = $('<div class="col-xs-6 dropdown">'),
                current = value.custom,
                action,
                option, link,// action,
                menu = $('<ul class="dropdown dropdown-menu facet-dropdown">')
                    .attr({
                        'data-facet': 'folder',
                        'data-value': 'custom'
                    });

            button.appendTo(self);
            button.append(
                action = $('<a href="#" type="button" class="dropdown-toggle pull-right disabled" data-toggle="dropdown" role="menuitemcheckbox" aria-haspopup="true" aria-expanded="false">').append(
                    $('<span class="name">')
                        .text(value.name || gt('All folders')),
                    $('<span class="caret">')
                )
            );

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
                    button.find('.name')
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
                    button.append(menu);

                    // enable dropdown again
                    action.removeClass('disabled');

                    // apply a11y
                    // button.dropdown();
                });
        }
    };

    return extensions;
});
