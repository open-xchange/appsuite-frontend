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

define('io.ox/tasks/toolbar', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/toolbar',
    'io.ox/core/tk/upload',
    'io.ox/core/dropzone',
    'io.ox/core/notifications',
    'io.ox/tasks/common-extensions',
    'io.ox/tasks/api',
    'gettext!io.ox/mail',
    'io.ox/tasks/actions',
    'less!io.ox/tasks/style'
], function (ext, links, actions, Dropdown, Toolbar, upload, dropzone, notifications, extensions, api, gt) {

    'use strict';

    if (_.device('smartphone')) return;

    // define links for classic toolbar
    var point = ext.point('io.ox/tasks/classic-toolbar/links');

    var meta = {
        //
        // --- HI ----
        //
        'create': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('New'),
            title: gt('New task'),
            drawDisabled: true,
            ref: 'io.ox/tasks/actions/create'
        },
        'edit': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Edit'),
            title: gt('Edit task'),
            drawDisabled: true,
            ref: 'io.ox/tasks/actions/edit'
        },
        'change-due-date': {
            prio: 'hi',
            mobile: 'lo',
            //#. Task: "Due" like in "Change due date"
            label: gt('Due'),
            title: gt('Change due date'),
            ref: 'io.ox/tasks/actions/placeholder',
            customize: extensions.dueDate
        },
        'done': {
            prio: 'hi',
            mobile: 'hi',
            //#. Task: Done like in "Mark as done"
            label: gt('Done'),
            title: gt('Mark as done'),
            ref: 'io.ox/tasks/actions/done'
        },
        'undone': {
            prio: 'hi',
            mobile: 'hi',
            //#. Task: Undone like in "Mark as undone"
            label: gt('Undone'),
            title: gt('Mark as undone'),
            ref: 'io.ox/tasks/actions/undone'
        },
        'delete': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Delete'),
            title: gt('Delete task'),
            ref: 'io.ox/tasks/actions/delete'
        },
        //
        // --- LO ----
        //
        'confirm': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Change confirmation status'),
            ref: 'io.ox/tasks/actions/confirm'
        },
        'print': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Print'),
            drawDisabled: true,
            ref: 'io.ox/tasks/actions/print'
        },
        'move': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Move'),
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
        point.extend(new links.Link(extension));
    });

    ext.point('io.ox/tasks/classic-toolbar').extend(new links.InlineLinks({
        attributes: {},
        classes: '',
        // always use drop-down
        dropdown: true,
        index: 200,
        id: 'toolbar-links',
        ref: 'io.ox/tasks/classic-toolbar/links'
    }));

    // view dropdown
    ext.point('io.ox/tasks/classic-toolbar').extend({
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
    ext.point('io.ox/tasks/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {
            var toolbar = new Toolbar({ title: app.getTitle(), tabindex: 1 }),
                cont = function (list) {
                    // extract single object if length === 1
                    list = list.length === 1 ? list[0] : list;
                    var baton = ext.Baton({ $el: toolbar.$list, data: list, app: this }),
                        ret = ext.point('io.ox/tasks/classic-toolbar').invoke('draw', toolbar.$list.empty(), baton);
                    return $.when.apply($, ret.value()).then(function () {
                        toolbar.initButtons();
                    });
                };
            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbar.render().$el
            );
            app.updateToolbar = _.queued(function (list) {
                if (!list) return $.when();
                // draw toolbar
                if (list.length <= 100) {
                    return api.getList(list).done(cont.bind(this));
                } else {
                    return cont.call(this, list);
                }
            }, 10);
        }
    });

    ext.point('io.ox/tasks/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
            app.updateToolbar();
            // update toolbar on selection change as well as any model change (seen/unseen flag)
            app.getGrid().selection.on('change', function (e, list) {
                app.updateToolbar(list);
            });
            // update whenever a task changes
            api.on('update', function () {
                var list = app.getGrid().selection.get();
                app.updateToolbar(list);
            });
        }
    });

});
