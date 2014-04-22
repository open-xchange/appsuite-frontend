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

define('io.ox/contacts/toolbar',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/core/extPatterns/actions',
     'io.ox/backbone/mini-views/dropdown',
     'io.ox/core/tk/upload',
     'io.ox/core/dropzone',
     'io.ox/core/notifications',
     'gettext!io.ox/mail',
     'io.ox/contacts/actions',
     'less!io.ox/contacts/style'
    ], function (ext, links, actions, Dropdown, upload, dropzone, notifications, gt) {

    'use strict';

    if (_.device('small')) return;

    // define links for classic toolbar
    var point = ext.point('io.ox/contacts/classic-toolbar/links');

    var meta = {
        //
        // --- HI ----
        //
        'create': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('New'),
            drawDisabled: true,
            ref: 'io.ox/contacts/actions/create'
        },
        'send': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Send mail'),
            ref: 'io.ox/contacts/actions/send'
        },
        'invite': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Invite'),
            title: gt('Invite to appointment'),
            ref: 'io.ox/contacts/actions/invite'
        },
        'edit': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Edit'),
            drawDisabled: true,
            ref: 'io.ox/contacts/actions/update'
        },
        'delete': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Delete'),
            ref: 'io.ox/contacts/actions/delete'
        },
        //
        // --- LO ----
        //
        'vcard': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Send as vCard'),
            drawDisabled: true,
            ref: 'io.ox/contacts/actions/vcard'
        },
        'print': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Print'),
            drawDisabled: true,
            ref: 'io.ox/contacts/actions/print'
        },
        'move': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Move'),
            ref: 'io.ox/contacts/actions/move',
            drawDisabled: true,
            section: 'file-op'
        },
        'copy': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Copy'),
            ref: 'io.ox/contacts/actions/copy',
            drawDisabled: true,
            section: 'file-op'
        },
        'add-to-portal': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Add to portal'),
            ref: 'io.ox/contacts/actions/add-to-portal',
            section: 'keep'
        }
    };

    // transform into extensions

    var index = 0;

    _(meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(new links.Link(extension));
    });

    ext.point('io.ox/contacts/classic-toolbar').extend(new links.InlineLinks({
        attributes: {},
        classes: '',
        forcelimit: true, // always use drop-down
        index: 200,
        id: 'toolbar-links',
        ref: 'io.ox/contacts/classic-toolbar/links'
    }));

    // view dropdown
    ext.point('io.ox/contacts/classic-toolbar').extend({
        id: 'view-dropdown',
        index: 10000,
        draw: function (baton) {

            //#. View is used as a noun in the toolbar. Clicking the button opens a popup with options related to the View
            var dropdown = new Dropdown({ model: baton.app.props, label: gt('View'), tagName: 'li' })
            .header(gt('Options'))
            .option('folderview', true, gt('Folder view'))
            .option('checkboxes', true, gt('Checkboxes'));

            this.append(
                dropdown.render().$el.addClass('pull-right').attr('data-dropdown', 'view')
            );
        }
    });

    // classic toolbar
    var toolbar = $('<ul class="classic-toolbar" role="menu">');

    var updateToolbar = _.debounce(function (list) {
        if (!list) return;
        // extract single object if length === 1
        list = list.length === 1 ? list[0] : list;
        // draw toolbar
        var baton = ext.Baton({ $el: toolbar, data: list, app: this });
        ext.point('io.ox/contacts/classic-toolbar').invoke('draw', toolbar.empty(), baton);
    }, 10);

    ext.point('io.ox/contacts/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {
            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
               toolbar = $('<ul class="classic-toolbar" role="menu">')
            );
            app.updateToolbar = updateToolbar;
        }
    });

    ext.point('io.ox/contacts/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
            app.updateToolbar();
            // // update toolbar on selection change as well as any model change (seen/unseen flag)
            app.getGrid().selection.on('change', function (e, list) {
                app.updateToolbar(list);
            });
        }
    });

});
