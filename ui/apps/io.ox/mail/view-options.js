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
     'io.ox/backbone/mini-views/dropdown',
     'gettext!io.ox/mail'
    ], function (ext, Dropdown, gt) {

    'use strict';

    ext.point('io.ox/mail/view-options').extend({
        id: 'sort',
        index: 100,
        draw: function () {
            this.data('view')
                .option('sort', 610, gt('Date'))
                .option('sort', 'from-to', gt('From'))
                .option('sort', 651, gt('Unread'))
                .option('sort', 608, gt('Size'))
                .option('sort', 607, gt('Subject'))
                .option('sort', 102, gt('Label'));
        }
    });

    ext.point('io.ox/mail/view-options').extend({
        id: 'order',
        index: 200,
        draw: function () {
            this.data('view')
                .divider()
                .option('order', 'asc', gt('Ascending'))
                .option('order', 'desc', gt('Descending'));
        }
    });

    ext.point('io.ox/mail/view-options').extend({
        id: 'thread',
        index: 300,
        draw: function (baton) {
            // don't add if thread view is disabled server-side
            if (baton.app.settings.get('threadView') === 'off') return;
            this.data('view')
                .divider()
                .option('thread', true, gt('Conversations'));
        }
    });

    ext.point('io.ox/mail/list-view/toolbar/top').extend({
        id: 'dropdown',
        index: 1000,
        draw: function (baton) {

            var dropdown = new Dropdown({
                //#. Sort options drop-down
                label: gt.pgettext('dropdown', 'Sort by'),
                model: baton.app.props
            });

            ext.point('io.ox/mail/view-options').invoke('draw', dropdown.$el, baton);
            this.append(dropdown.render().$el.addClass('grid-options'));
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
