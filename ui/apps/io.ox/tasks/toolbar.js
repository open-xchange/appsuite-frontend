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

define('io.ox/tasks/toolbar', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/views/toolbar',
    'io.ox/core/tk/upload',
    'io.ox/core/dropzone',
    'io.ox/core/notifications',
    'io.ox/tasks/common-extensions',
    'io.ox/tasks/api',
    'gettext!io.ox/tasks',
    'io.ox/tasks/actions',
    'less!io.ox/tasks/style'
], function (ext, Dropdown, ToolbarView, upload, dropzone, notifications, extensions, api, gt) {

    'use strict';

    if (_.device('smartphone')) return;

    // define links for classic toolbar
    var point = ext.point('io.ox/tasks/toolbar/links');

    var meta = {
        //
        // --- HI ----
        //
        'create': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('New'),
            tooltip: gt('New task'),
            drawDisabled: true,
            ref: 'io.ox/tasks/actions/create'
        },
        'edit': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Edit'),
            tooltip: gt('Edit task'),
            drawDisabled: true,
            ref: 'io.ox/tasks/actions/edit'
        },
        'change-due-date': {
            prio: 'hi',
            mobile: 'lo',
            //#. Task: "Due" like in "Change due date"
            title: gt('Due'),
            tooltip: gt('Change due date'),
            ref: 'io.ox/tasks/actions/placeholder',
            customize: extensions.dueDate
        },
        'done': {
            prio: 'hi',
            mobile: 'hi',
            //#. Task: Done like in "Mark as done"
            title: gt('Done'),
            tooltip: gt('Mark as done'),
            ref: 'io.ox/tasks/actions/done'
        },
        'undone': {
            prio: 'hi',
            mobile: 'hi',
            //#. Task: Undone like in "Mark as undone"
            title: gt('Undone'),
            tooltip: gt('Mark as undone'),
            ref: 'io.ox/tasks/actions/undone'
        },
        'delete': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Delete'),
            tooltip: gt('Delete task'),
            ref: 'io.ox/tasks/actions/delete'
        },
        //
        // --- LO ----
        //
        'export': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Export'),
            drawDisabled: true,
            ref: 'io.ox/tasks/actions/export'
        },
        'confirm': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Change confirmation status'),
            ref: 'io.ox/tasks/actions/confirm'
        },
        'print': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Print'),
            drawDisabled: true,
            ref: 'io.ox/tasks/actions/print'
        },
        'move': {
            prio: 'lo',
            mobile: 'lo',
            title: gt('Move'),
            ref: 'io.ox/tasks/actions/move',
            drawDisabled: true,
            section: 'file-op'
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
    ext.point('io.ox/tasks/toolbar/links').extend({
        id: 'view-dropdown',
        index: 10000,
        draw: function (baton) {

            //#. View is used as a noun in the toolbar. Clicking the button opens a popup with options related to the View
            var dropdown = new Dropdown({ caret: true, model: baton.app.props, label: gt('View'), tagName: 'li', attributes: { role: 'presentation' } })
                .group(gt('Options'))
                .option('folderview', true, gt('Folder view'), { group: true })
                .option('checkboxes', true, gt('Checkboxes'), { group: true });

            this.append(
                dropdown.render().$el.addClass('pull-right').attr('data-dropdown', 'view')
            );
        }
    });

    // classic toolbar
    ext.point('io.ox/tasks/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {

            var toolbarView = new ToolbarView({ point: 'io.ox/tasks/toolbar/links', title: app.getTitle() });

            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbarView.$el
            );

            // list is array of object (with id and folder_id)
            app.updateToolbar = function (list) {
                var options = { data: [], folder_id: this.folder.get(), app: this };
                toolbarView.setSelection(list, function () {
                    if (!list.length) return options;
                    return (list.length <= 100 ? api.getList(list) : $.when(list)).pipe(function (data) {
                        options.data = data;
                        return options;
                    });
                });
            };

            app.forceUpdateToolbar = function (list) {
                toolbarView.selection = null;
                this.updateToolbar(list);
            };
        }
    });

    ext.point('io.ox/tasks/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
            app.updateToolbar([]);
            // update toolbar on selection change as well as any model change (seen/unseen flag)
            app.getGrid().selection.on('change', function (e, list) {
                app.updateToolbar(list);
            });
            // update whenever a task changes
            api.on('update', function () {
                app.forceUpdateToolbar(app.getGrid().selection.get());
            });
        }
    });
});
