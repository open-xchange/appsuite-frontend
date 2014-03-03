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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/view-options',
    ['io.ox/core/extensions',
     'gettext!io.ox/mail',
     'settings!io.ox/mail'
    ], function (ext, gt /*, settings*/) {

    'use strict';

    // var hToolbarOptions = function (e) {
    //         e.preventDefault();
    //         var option = $(this).attr('data-option'),
    //             grid = e.data.grid;
    //         if (/^(603|607|610|102|thread|from-to)$/.test(option)) {
    //             grid.prop('sort', option).refresh();
    //             // sort must not react to the prop change event because autotoggle uses this too and would mess up the persistent settings
    //             //grid.updateSettings('sort', option);
    //         } else if (/^(asc|desc)$/.test(option)) {
    //             grid.prop('order', option).refresh();
    //         } else if (option === 'unread') {
    //             grid.prop('unread', !grid.prop('unread'));
    //         }
    //     };

    // ext.point('io.ox/mail/vgrid/options').extend({
    //     max: _.device('smartphone') ? 50: settings.get('threadMax', 500),
    //     selectFirst: false,
    //     threadView: settings.get('threadView') !== 'off',
    //     //adjust for custom default sort
    //     sort: settings.get('vgrid/sort', 'thread'),
    //     order: settings.get('vgrid/order', 'desc'),
    //     unread: settings.get('unread', false)
    // });

    // // grid
    // var originalOptions = ext.point('io.ox/mail/vgrid/options').options(),
    //     options = _.extend({}, originalOptions);

    // // folder change
    // grid.on('change:prop:folder', function (e, folder) {
    //     // reset delete permission
    //     canDeletePermission = undefined;
    //     // remove delete button
    //     removeButton();
    //     // reset "unread only"
    //     grid.prop('unread', false);
    //     // template changes for unified mail

    //     var unified = account.parseAccountId(folder, true) === 0 ? false : folderAPI.is('unifiedfolder', folder);

    //     if (unified !== tmpl.unified) {
    //         tmpl.unified = unified;
    //         grid.updateTemplates();
    //     }
    // });

    // //get sorting settings with fallback for extpoint
    // var sortSettings = {
    //     sort: options.sort || settings.get('vgrid/sort', 'thread'),
    //     order: options.desc || settings.get('vgrid/order', 'desc'),
    //     unread: options.unread || settings.get('unread', false)
    // };

    // function drawGridOptions(e, type) {
    //     var ul = grid.getToolbar().find('ul.dropdown-menu'),
    //         threadView = settings.get('threadView'),
    //         folder = grid.prop('folder'),
    //         isInbox = account.is('inbox', folder),
    //         isOn = threadView === 'on' || (threadView === 'inbox' && isInbox),
    //         //set current or default values
    //         target = {
    //             sort: grid.prop('sort') || sortSettings.sort,
    //             order: grid.prop('order') || sortSettings.order,
    //             unread: grid.prop('unread') || sortSettings.unread
    //         };

    //     //reset properties on folder change
    //     if (type === 'folder') {
    //         target = {
    //             //using last state of sort/order of folder
    //             sort: grid.propcache('sort', sortSettings.sort),
    //             order: grid.propcache('order', sortSettings.order),
    //             unread: sortSettings.unread
    //         };
    //     }

    //     //jump back only if thread was the original setting
    //     if (target.sort === '610' && type === 'folder' && isOn && sortSettings.sort === 'thread') {
    //         target.sort = 'thread';
    //     }

    //     //adjusts sort property for invalid values
    //     target.sort = adjustSort(target.sort, folder);

    //     //update grid
    //     grid.prop('sort', target.sort)
    //         .prop('order', target.order)
    //         .prop('unread', target.unread);

    //     // draw list
    //     ul.empty().append(
    //         isOn ? buildOption('thread', gt('Conversations')) : $(),
    //         buildOption(610, gt('Date')),
    //         buildOption('from-to', gt('From')),
    //         buildOption(102, gt('Label')),
    //         buildOption(607, gt('Subject')),
    //         $('<li class="divider">'),
    //         buildOption('asc', gt('Ascending')),
    //         buildOption('desc', gt('Descending')),
    //         $('<li class="divider">'),
    //         buildOption('unread', gt('Unread only'))
    //     );

    //     updateGridOptions();
    // }

    // function updateGridOptions() {
    //     var dropdown = grid.getToolbar().find('.grid-options'),
    //         dataMenu = dropdown.data('menu'),
    //         list = dropdown.find('ul'),
    //         props = grid.prop();
    //     // mobile menu fix, check if smartphone and menu was opened at least once
    //     if (_.device('smartphone') && dataMenu) {
    //         list = dataMenu;
    //     }
    //     // uncheck all, except the mobile-menu close row
    //     list.find('i:not(.icon-chevron-down)').attr('class', 'icon-none');
    //     // sort
    //     list.find(
    //             '[data-option="' + props.sort + '"], ' +
    //             '[data-option="' + props.order + '"], ' +
    //             '[data-option="' + (props.unread ? 'unread' : '~unread') + '"]'
    //         )
    //         .find('i').attr('class', 'icon-ok');
    //     // sent folder?
    //     list.find('[data-option="from-to"] span').text(
    //         account.is('sent|drafts', props.folder) ? gt('To') : gt('From')
    //     );
    //     // unread
    //     if (props.unread) {
    //         // some browsers append style="display: block;" on this inline element. See bug 28956
    //         dropdown.find('.icon-envelope').css('display', '');
    //     } else {
    //         dropdown.find('.icon-envelope').hide();
    //     }
    //     // order
    //     var opacity = [1, 0.4][props.order === 'desc' ? 'slice' : 'reverse']();
    //     dropdown.find('.icon-arrow-down').css('opacity', opacity[0]).end()
    //         .find('.icon-arrow-up').css('opacity', opacity[1]).end();
    // }

    function drawOption(name, value, text, toggle) {
        return $('<li>').append(
            $('<a>', { href: '#', 'data-name': name, 'data-value': value, 'data-toggle': !!toggle }).append(
                $('<i class="icon-none">'), $('<span>').text(text)
            )
        );
    }

    function drawValue(model, name) {
        var value = model.get(name),
            li = this.find('[data-name="' + name + '"]');
        li.children('i').attr('class', 'icon-none');
        li.filter('[data-value="' + value + '"]').children('i').attr('class', 'icon-ok');
    }

    function connect(model, name) {
        drawValue.call(this, model, name);
        model.on('change:' + name, drawValue.bind(this, model, name));
    }

    ext.point('io.ox/mail/view-options').extend({
        id: 'sort',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<li class="dropdown-header">').text(gt('Sort by')),
                drawOption('sort', '610', gt('Date')),
                drawOption('sort', 'from-to', gt('From')),
                drawOption('sort', '651', gt('Unread')),
                drawOption('sort', '608', gt('Size')),
                drawOption('sort', '607', gt('Subject')),
                drawOption('sort', '102', gt('Label'))
            );
            connect.call(this, baton.app.props, 'sort');
        }
    });

    ext.point('io.ox/mail/view-options').extend({
        id: 'order',
        index: 200,
        draw: function (baton) {
            this.append(
                $('<li class="divider"></li>'),
                drawOption('order', 'asc', gt('Ascending')),
                drawOption('order', 'desc', gt('Descending'))
            );
            connect.call(this, baton.app.props, 'order');
        }
    });

    ext.point('io.ox/mail/view-options').extend({
        id: 'thread',
        index: 300,
        draw: function (baton) {
            this.append(
                $('<li class="divider"></li>'),
                drawOption('thread', 'true', gt('Conversations'), true)
            );
            connect.call(this, baton.app.props, 'thread');
        }
    });

    ext.point('io.ox/mail/view-options').extend({
        id: 'preview',
        index: 400,
        draw: function (baton) {
            this.append(
                $('<li class="divider"></li>'),
                $('<li class="dropdown-header">').text(gt('Preview pane')),
                drawOption('preview', 'right', gt('Right')),
                drawOption('preview', 'bottom', gt('Bottom')),
                drawOption('preview', 'none', gt('None'))
            );
            connect.call(this, baton.app.props, 'preview');
        }
    });

    function applyOption(e) {
        e.preventDefault();
        var name = $(this).attr('data-name'),
            value = $(this).attr('data-value'),
            toggle = $(this).attr('data-toggle'),
            model = e.data.model;
        if (toggle === 'true') {
            model.set(name, model.get(name) === 'true' ? 'false' : 'true');
        } else {
            model.set(name, value);
        }
    }

    ext.point('io.ox/mail/list-view/toolbar/bottom').extend({
        id: 'dropdown',
        index: 1000,
        draw: function (baton) {

            this.append(
                $('<div class="grid-options dropdown">').append(
                    $('<a href="#" tabindex="1" data-toggle="dropdown" role="menuitem" aria-haspopup="true">')
                    .append($.txt(gt('View')))
                    .dropdown(),
                    $('<ul class="dropdown-menu" role="menu">')
                )
            );

            ext.point('io.ox/mail/view-options').invoke('draw', this.find('.dropdown-menu'), baton);
            this.find('.dropdown-menu').on('click', 'a', { model: baton.app.props }, applyOption);
        }
    });

    function toggleSelection(e) {
        e.preventDefault();
        var i = $(this).find('i'),
            selection = e.data.baton.app.listView.selection;
        if (i.hasClass('icon-check')) {
            i.attr('class', 'icon-check-empty');
            selection.selectNone();
        } else {
            i.attr('class', 'icon-check');
            selection.selectAll();
        }
    }

    ext.point('io.ox/mail/list-view/toolbar/bottom').extend({
        id: 'select-all',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<a href="#" class="select-all" tabindex="1">').append(
                    $('<i class="icon-check-empty">'),
                    $.txt(gt('Select all'))
                )
                .on('click', { baton: baton }, toggleSelection)
            );
        }
    });
});
