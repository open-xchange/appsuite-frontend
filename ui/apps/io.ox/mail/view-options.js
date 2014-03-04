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
            // don't add if thread view is disabled server-side
            if (baton.app.settings.get('threadView') === 'off') return;
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
            if (_.device('small')) return;
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

    ext.point('io.ox/mail/list-view/toolbar/top').extend({
        id: 'dropdown',
        index: 1000,
        draw: function (baton) {

            this.append(
                $('<div class="grid-options dropdown">').append(
                    $('<a href="#" tabindex="1" data-toggle="dropdown" role="menuitem" aria-haspopup="true">')
                    .append(
                        $.txt(gt('View')),
                        $.txt(' '),
                        $('<i class="icon-caret-down">')
                    )
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

    ext.point('io.ox/mail/list-view/toolbar/top').extend({
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
