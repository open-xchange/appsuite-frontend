/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/toolbar', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/views/toolbar',
    'gettext!io.ox/contacts',
    'io.ox/contacts/api',
    'settings!io.ox/contacts',
    'io.ox/contacts/actions',
    'less!io.ox/contacts/style'
], function (ext, Dropdown, ToolbarView, gt, api, settings) {

    'use strict';

    if (_.device('smartphone')) return;

    // define links for classic toolbar
    var point = ext.point('io.ox/contacts/toolbar/links');

    var meta = {
        //
        // --- HI ----
        //
        // 'create': {
        //     prio: 'hi',
        //     mobile: 'hi',
        //     title: gt('New contact'),
        //     dropdown: 'io.ox/contacts/toolbar/new',
        //     drawDisabled: true
        // },
        'edit': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Edit'),
            tooltip: gt('Edit contact'),
            drawDisabled: true,
            ref: 'io.ox/contacts/actions/update'
        },
        'send': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Send email'),
            ref: 'io.ox/contacts/actions/send'
        },
        'invite': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Invite'),
            tooltip: gt('Invite to appointment'),
            ref: 'io.ox/contacts/actions/invite'
        },
        'delete': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Delete'),
            tooltip: gt('Delete contact'),
            drawDisabled: true,
            ref: 'io.ox/contacts/actions/delete'
        },
        //
        // --- LO ----
        //
        'vcard': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Send as vCard'),
            drawDisabled: true,
            ref: 'io.ox/contacts/actions/vcard'
        },
        'move': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Move'),
            ref: 'io.ox/contacts/actions/move',
            drawDisabled: true,
            section: 'file-op'
        },
        'copy': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Copy'),
            ref: 'io.ox/contacts/actions/copy',
            drawDisabled: true,
            section: 'file-op'
        },
        'print': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Print'),
            drawDisabled: true,
            ref: 'io.ox/contacts/actions/print',
            section: 'export'
        },
        'export': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Export'),
            drawDisabled: true,
            ref: 'io.ox/contacts/actions/export',
            section: 'export'
        },
        'add-to-portal': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Add to portal'),
            ref: 'io.ox/contacts/actions/add-to-portal',
            section: 'export'
        }
    };

    // transform into extensions

    var index = 0;

    _(meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(extension);
    });

    // view dropdown
    ext.point('io.ox/contacts/toolbar/links').extend({
        id: 'view-dropdown',
        index: 10000,
        custom: true,
        draw: function (baton) {

            if (2 > 1) return;

            //#. View is used as a noun in the toolbar. Clicking the button opens a popup with options related to the View
            var dropdown = new Dropdown({ el: this, caret: true, model: baton.app.props, label: gt('View') })
                .group(gt('Options'))
                .option('folderview', true, gt('Folder view'), { group: true })
                .option('checkboxes', true, gt('Checkboxes'), { group: true });

            dropdown.render().$el.addClass('pull-right dropdown').attr('data-dropdown', 'view');
        }
    });

    // classic toolbar
    ext.point('io.ox/contacts/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {

            // yep strict false (otherwise toolbar does not redraw when changing between empty folders => contacts are created in the wrong folder)
            var toolbarView = new ToolbarView({ point: 'io.ox/contacts/toolbar/links', title: app.getTitle(), strict: false }),
                limit = settings.get('toolbar/limits/fetch', 100);

            app.getWindow().nodes.body.find('.rightside').addClass('classic-toolbar-visible').prepend(
                toolbarView.$el
            );

            // list is array of object (with id and folder_id)
            app.updateToolbar = function (list) {
                var options = { data: [], folder_id: this.folder.get(), app: this };
                toolbarView.setSelection(list, function () {
                    if (!list.length) return options;
                    return (list.length <= limit ? api.getList(list) : $.when(list)).then(function (data) {
                        options.data = data;
                        return options;
                    });
                });
            };
        }
    });

    ext.point('io.ox/contacts/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
            app.updateToolbar([]);
            // update toolbar on selection change as well as any model change (seen/unseen flag)
            app.getGrid().selection.on('change', function (e, list) {
                app.updateToolbar(list);
            });
            api.on('update', function () {
                app.updateToolbar(app.getGrid().selection.get());
            });
        }
    });

});
