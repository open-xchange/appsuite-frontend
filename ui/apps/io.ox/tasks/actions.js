/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/actions', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'gettext!io.ox/tasks',
    'io.ox/core/notifications',
    'io.ox/core/print',
    'io.ox/core/extPatterns/actions',
    'io.ox/tasks/common-extensions',
    'io.ox/core/folder/api',
    'io.ox/core/pim/actions'
], function (ext, links, gt, notifications, print, actions, extensions, folderAPI) {

    'use strict';

    //  actions
    var Action = links.Action;

    new Action('io.ox/tasks/actions/create', {
        requires: function (e) {
            return e.baton.app.folder.can('create');
        },
        action: function (baton) {
            ox.load(['io.ox/tasks/edit/main']).done(function (edit) {
                edit.getApp().launch({ folderid: baton.app.folder.get() });
            });
        }
    });

    new Action('io.ox/tasks/actions/edit', {
        requires: 'one modify',
        action: function (baton) {
            ox.load(['io.ox/tasks/edit/main']).done(function (m) {
                if (m.reuse('edit', baton.data)) return;
                m.getApp().launch({ taskData: baton.data });
            });
        }
    });

    new Action('io.ox/tasks/actions/delete', {
        requires: 'some delete',
        action: function (baton) {
            ox.load(['io.ox/tasks/actions/delete']).done(function (action) {
                action(baton);
            });
        }
    });

    new Action('io.ox/tasks/actions/done', {
        requires: function (e) {
            if (!(e.collection.has('some') && e.collection.has('modify'))) {
                return false;
            }
            return (e.baton.data.length  !== undefined || e.baton.data.status !== 3);
        },
        action: function (baton) {
            ox.load(['io.ox/tasks/actions/doneUndone']).done(function (action) {
                action(baton, 1);
            });
        }
    });

    new Action('io.ox/tasks/actions/undone', {
        requires: function (e) {
            if (!(e.collection.has('some') && e.collection.has('modify'))) {
                return false;
            }
            return (e.baton.data.length  !== undefined || e.baton.data.status === 3);
        },
        action: function (baton) {
            ox.load(['io.ox/tasks/actions/doneUndone']).done(function (action) {
                action(baton, 3);
            });
        }
    });

    // helper
    function isShared(id) {
        var data = folderAPI.pool.getModel(id).toJSON();
        return folderAPI.is('shared', data);
    }

    new Action('io.ox/tasks/actions/move', {
        requires: function (e) {
            if (!e.collection.has('some')) return false;
            if (!e.collection.has('delete')) return false;
            // app object is not available when opened from notification area
            if (e.baton.app && isShared(e.baton.app.folder.get())) return false;
            // look for folder_id in task data
            if (e.baton.data.folder_id && isShared(e.baton.data.folder_id)) return false;
            return true;
        },
        multiple: function (list, baton) {
            ox.load(['io.ox/tasks/actions/move']).done(function (action) {
                action.multiple(list, baton);
            });
        }
    });

    new Action('io.ox/tasks/actions/confirm', {
        id: 'confirm',
        requires: function (args) {
            var result = false;
            if (args.baton.data.users) {
                var userId = ox.user_id;
                _(args.baton.data.users).each(function (user) {
                    if (user.id === userId) {
                        result = true;
                    }
                });
                return result;
            }
            return result;
        },
        action: function (baton) {
            var data = baton.data;
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

    new Action('io.ox/tasks/actions/print', {
        requires: function (e) {
            return e.collection.has('some', 'read') && _.device('!smartphone');
        },
        multiple: function (list) {
            print.request('io.ox/tasks/print', list);
        }
    });

    new Action('io.ox/tasks/actions/print-disabled', {
        id: 'print',
        requires: function () {
            return _.device('!smartphone');
        },
        multiple: function (list) {
            ox.load(['io.ox/tasks/actions/printDisabled']).done(function (action) {
                action.multiple(list);
            });
        }
    });

    //inline
    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'edit',
        index: 100,
        prio: 'hi',
        mobile: 'hi',
        label: gt('Edit'),
        ref: 'io.ox/tasks/actions/edit'
    }));

    //strange workaround because extend only takes new links instead of plain objects with draw method
    new Action('io.ox/tasks/actions/placeholder', {
        requires: 'one modify',
        action: $.noop
    });

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'changeDueDate',
        index: 200,
        prio: 'hi',
        mobile: 'lo',
        ref: 'io.ox/tasks/actions/placeholder',
        draw: function (baton) {

            var link = $('<a href="#">').text(gt('Change due date'));

            this.append(
                $('<span class="io-ox-action-link">').append(link)
            );

            extensions.dueDate.call(link, baton);
        }
    }));

    // delete tasks
    ext.point('io.ox/tasks/mobileMultiSelect/toolbar').extend({
        id: 'delete',
        index: 10,
        draw: function (data) {
            var baton = new ext.Baton({ data: data.data });
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-trash-o">')
                            .on('click', { grid: data.grid }, function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.invoke('io.ox/tasks/actions/delete', null, baton);
                                e.data.grid.selection.clear();
                            })
                    )
                )
            );
        }
    });

    // tasks done
    ext.point('io.ox/tasks/mobileMultiSelect/toolbar').extend({
        id: 'done',
        index: 20,
        draw: function (data) {
            var baton = new ext.Baton({ data: data.data });
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-check-square-o">')
                            .on('click', { grid: data.grid }, function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.invoke('io.ox/tasks/actions/done', null, baton);
                                e.data.grid.selection.clear();
                            })
                    )
                )
            );
        }
    });

    // tasks undone
    ext.point('io.ox/tasks/mobileMultiSelect/toolbar').extend({
        id: 'unDone',
        index: 30,
        draw: function (data) {
            var baton = new ext.Baton({ data: data.data });
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-square-o">')
                            .on('click', { grid: data.grid }, function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.invoke('io.ox/tasks/actions/undone', null, baton);
                                e.data.grid.selection.clear();
                            })
                    )
                )
            );
        }
    });

    // tasks move
    ext.point('io.ox/tasks/mobileMultiSelect/toolbar').extend({
        id: 'move',
        index: 40,
        draw: function (data) {
            var baton = new ext.Baton({ data: data.data });
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-sign-in">')
                            .on('click', { grid: data.grid }, function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.invoke('io.ox/tasks/actions/move', null, baton);
                                e.data.grid.selection.clear();
                            })
                    )
                )
            );
        }
    });

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'done',
        index: 300,
        prio: 'hi',
        mobile: 'hi',
        icon: 'fa fa-check-square-o',
        label: gt('Mark as done'),
        ref: 'io.ox/tasks/actions/done'
    }));

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'unDone',
        index: 310,
        prio: 'hi',
        mobile: 'hi',
        label: gt('Undone'),
        ref: 'io.ox/tasks/actions/undone'
    }));

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'delete',
        index: 400,
        prio: 'hi',
        mobile: 'hi',
        icon: 'fa fa-trash-o',
        label: gt('Delete'),
        ref: 'io.ox/tasks/actions/delete'
    }));

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'move',
        index: 500,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Move'),
        ref: 'io.ox/tasks/actions/move'
    }));

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'confirm',
        index: 600,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Change confirmation status'),
        ref: 'io.ox/tasks/actions/confirm'
    }));

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'print',
        index: 700,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Print'),
        ref: 'io.ox/tasks/actions/print'
    }));
});
