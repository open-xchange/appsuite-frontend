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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/actions', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'gettext!io.ox/tasks',
    'io.ox/core/notifications',
    'io.ox/core/print',
    'io.ox/tasks/common-extensions',
    'io.ox/core/folder/api',
    'io.ox/core/pim/actions'
], function (ext, actionsUtil, gt, notifications, print, extensions, folderAPI) {

    'use strict';

    //  actions
    var Action = actionsUtil.Action;

    new Action('io.ox/tasks/actions/create', {
        folder: 'create',
        action: function (baton) {
            ox.load(['io.ox/tasks/edit/main']).done(function (edit) {
                edit.getApp().launch({ folderid: baton.folder_id });
            });
        }
    });

    new Action('io.ox/tasks/actions/edit', {
        collection: 'one && modify',
        action: function (baton) {
            var data = baton.first();
            ox.load(['io.ox/tasks/edit/main']).done(function (m) {
                if (m.reuse('edit', data)) return;
                m.getApp().launch({ taskData: data });
            });
        }
    });

    new Action('io.ox/tasks/actions/delete', {
        collection: 'some && delete',
        action: function (baton) {
            ox.load(['io.ox/tasks/actions/delete']).done(function (action) {
                action(baton.array());
            });
        }
    });

    new Action('io.ox/tasks/actions/done', {
        collection: 'some && modify',
        matches: function (baton) {
            // it's either multiple/array or just one and status not 'done'
            return baton.data > 1 || baton.first().status !== 3;
        },
        action: function (baton) {
            ox.load(['io.ox/tasks/actions/doneUndone']).done(function (action) {
                action(baton.array(), 1);
            });
        }
    });

    new Action('io.ox/tasks/actions/undone', {
        collection: 'some && modify',
        matches: function (baton) {
            // it's either multiple/array or just one and status not 'done'
            return baton.data > 1 || baton.first().status === 3;
        },
        action: function (baton) {
            ox.load(['io.ox/tasks/actions/doneUndone']).done(function (action) {
                action(baton.array(), 3);
            });
        }
    });

    new Action('io.ox/tasks/actions/move', {
        collection: 'some && delete',
        matches: function (baton) {
            // we cannot move tasks in shared folders
            return !baton.array().some(function (item) {
                return isShared(item.folder_id);
            });
        },
        action: function (baton) {
            ox.load(['io.ox/tasks/actions/move']).done(function (action) {
                action(baton);
            });
        }
    });

    function isShared(id) {
        var data = folderAPI.pool.getModel(id).toJSON();
        return folderAPI.is('shared', data);
    }

    // Tested: No
    new Action('io.ox/tasks/actions/confirm', {
        collection: 'one',
        matches: function (baton) {
            return _(baton.first().users).some(function (user) {
                return user.id === ox.user_id;
            });
        },
        action: function (baton) {
            var data = baton.first();
            ox.load(['io.ox/calendar/actions/acceptdeny', 'io.ox/tasks/api']).done(function (acceptdeny, api) {
                acceptdeny(data, {
                    taskmode: true,
                    api: api,
                    callback: function () {
                        //update detailview
                        api.trigger('update:' + _.ecid({ id: data.id, folder_id: data.folder_id }));
                    }
                });
            });
        }
    });

    new Action('io.ox/tasks/actions/export', {
        collection: 'some && read',
        action: function (baton) {
            require(['io.ox/core/export'], function (exportDialog) {
                exportDialog.open('tasks', { list: baton.array() });
            });
        }
    });

    new Action('io.ox/tasks/actions/print', {
        device: '!smartphone',
        collection: 'some && read',
        action: function (baton) {
            print.request('io.ox/tasks/print', baton.array());
        }
    });

    new Action('io.ox/tasks/actions/placeholder', {
        collection: 'one && modify',
        action: _.noop
    });

    ext.point('io.ox/tasks/links/inline').extend(
        {
            id: 'edit',
            index: 100,
            prio: 'hi',
            mobile: 'hi',
            title: gt('Edit'),
            ref: 'io.ox/tasks/actions/edit'
        },
        {
            id: 'change-due-date',
            index: 200,
            prio: 'hi',
            mobile: 'lo',
            title: gt('Due'),
            tooltip: gt('Change due date'),
            ref: 'io.ox/tasks/actions/placeholder',
            customize: extensions.dueDate
        },
        {
            id: 'done',
            index: 300,
            prio: 'hi',
            mobile: 'hi',
            title: gt('Done'),
            tooltip: gt('Mark as done'),
            ref: 'io.ox/tasks/actions/done'
        },
        {
            id: 'undone',
            index: 310,
            prio: 'hi',
            mobile: 'hi',
            title: gt('Undone'),
            tooltip: gt('Mark as undone'),
            ref: 'io.ox/tasks/actions/undone'
        },
        {
            id: 'delete',
            index: 400,
            prio: 'hi',
            mobile: 'hi',
            title: gt('Delete'),
            ref: 'io.ox/tasks/actions/delete'
        },
        {
            id: 'move',
            index: 500,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Move'),
            ref: 'io.ox/tasks/actions/move'
        },
        {
            id: 'confirm',
            index: 600,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Change confirmation status'),
            ref: 'io.ox/tasks/actions/confirm'
        },
        {
            id: 'export',
            index: 650,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Export'),
            ref: 'io.ox/tasks/actions/export'
        },
        {
            id: 'print',
            index: 700,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Print'),
            ref: 'io.ox/tasks/actions/print'
        }
    );
});
