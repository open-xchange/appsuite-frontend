/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/actions',
    ['io.ox/core/extensions',
     'io.ox/tasks/util',
     'io.ox/core/extPatterns/links',
     'gettext!io.ox/tasks',
     'io.ox/core/notifications',
     'io.ox/core/config'], function (ext, util, links, gt, notifications, configApi) {

    'use strict';

    //  actions
    var Action = links.Action, Button = links.Button,
        ActionGroup = links.ActionGroup, ActionLink = links.ActionLink;

    new Action('io.ox/tasks/actions/create', {
        action: function (baton) {
            require(['io.ox/tasks/edit/main'], function (edit) {
                edit.getApp().launch({ folderid: baton.app.folder.get()});
            });
        }
    });

    new Action('io.ox/tasks/actions/edit', {
        action: function (baton) {
            require(['io.ox/tasks/edit/main'], function (m) {
                if (m.reuse('edit', baton.data)) return;
                m.getApp().launch({ taskData: baton.data });
            });
        }
    });

    new Action('io.ox/tasks/actions/delete', {
        requires: 'some',
        action: function (baton) {
            var data = baton.data,
                numberOfTasks = data.length || 1;
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                //build popup
                var popup = new dialogs.ModalDialog({async: true})
                    .addPrimaryButton('deleteTask', gt('Delete'))
                    .addButton('cancel', gt('Cancel'));
                //Header
                popup.getBody()
                    .append($('<h4>')
                            .text(gt.ngettext('Do you really want to delete this task?',
                                              'Do you really want to delete this tasks?', numberOfTasks)));
                //go
                popup.show();
                popup.on('deleteTask', function () {
                    require(['io.ox/tasks/api'], function (api) {
                        api.remove(data, false)
                            .done(function (data) {
                                if (data === undefined || data.length === 0) {
                                    notifications.yell('success', gt.ngettext('Task has been deleted!',
                                                                               'Tasks have been deleted!', numberOfTasks));
                                } else {//task was modified
                                    notifications.yell('error', gt('Failure! Please refresh.'));
                                }
                                popup.close();
                            }).fail(function () {
                                //show retrymessage and enable buttons again
                                popup.idle();
                                popup.getBody().append($.fail(gt.ngettext('The task could not be deleted.',
                                                                          'The tasks could not be deleted.', numberOfTasks), function () {
                                    popup.trigger('deleteTask', data);
                                })).find('h4').remove();
                            });
                    });
                });
            });
        }
    });

    new Action('io.ox/tasks/actions/done', {
        requires: function (e) {
            return (e.baton.data.length  !== undefined || e.baton.data.status !== 3);
        },
        action: function (baton) {
            changeState(baton, 1);
        }
    });

    new Action('io.ox/tasks/actions/undone', {
        requires: function (e) {
            return (e.baton.data.length  !== undefined || e.baton.data.status === 3);
        },
        action: function (baton) {
            changeState(baton, 3);
        }
    });

    function changeState(baton, state) {
        var mods,
            data = baton.data;
        if (state === 3) {
            mods = {label: gt('Undone'),
                    data: {status: 1,
                           percent_completed: 0
                          }
                   };
        } else {
            mods = {label: gt('Done'),
                    data: {status: 3,
                           percent_completed: 100
                          }
                   };
        }
        require(['io.ox/core/http', 'io.ox/tasks/api'], function (http, api) {
            if (data.length > 1) {
                api.updateMultiple(data, mods.data)
                    .done(function (result) {
                        _(data).each(function (item) {
                            //update detailview
                            api.trigger('update:' + encodeURIComponent(item.folder_id + '.' + item.id));
                        });
                        
                        notifications.yell('success', mods.label);
                    })
                    .fail(function (result) {
                        notifications.yell('error', gt.noI18n(result));
                    });
            } else {
                api.update(data.last_modified || _.now(), data.id, mods.data, data.folder_id || data.folder)
                    .done(function (result) {
                        api.trigger('update:' + encodeURIComponent(data.folder_id + '.' + data.id));
                        notifications.yell('success', mods.label);
                    })
                    .fail(function (result) {
                        var errorMsg = gt("A severe error occured!");
                        if (result.code === "TSK-0007") {//task was modified before
                            errorMsg = gt("Task was modified before, please reload");
                        }
                        notifications.yell('error', errorMsg);
                    });
            }
        });
    }

    new Action('io.ox/tasks/actions/move', {
        requires: 'some',
        action: function (baton) {
            var task = baton.data,
                numberOfTasks = task.length || 1;
            require(['io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews', 'io.ox/tasks/api'],
                    function (dialogs, views, api) {
                //build popup
                var popup = new dialogs.ModalDialog({ easyOut: true })
                    .header($('<h3>').text('Move'))
                    .addPrimaryButton('ok', gt('Move'))
                    .addButton('cancel', gt('Cancel'));
                popup.getBody().css({ height: '250px' });
                var tree = new views.FolderList(popup.getBody(), { type: 'tasks' }),
                    id = String(task.folder || task.folder_id);
                //go
                popup.show(function () {
                    tree.paint().done(function () {
                        tree.select(id);
                    });
                })
                .done(function (action) {
                    if (action === 'ok') {
                        var node = $('.io-ox-multi-selection');
                        node.hide();
                        node.parent().busy();
                        var target = _(tree.selection.get()).first();
                        // move only if folder differs from old folder
                        if (target && target !== id) {
                            // move action
                            api.move(task, target)
                            .done(function () {
                                node.show();
                                node.parent().idle();
                                notifications.yell('success', gt.ngettext('Task moved.', 'Tasks moved.', numberOfTasks));
                            })
                            .fail(function (response) {
                                node.show();
                                node.parent().idle();
                                notifications.yell('error', gt('A severe error occured!'));
                            });
                        }
                    }
                    tree.destroy();
                    tree = popup = null;
                });
            });
        }
    });
    
    new Action('io.ox/tasks/actions/confirm', {
        id: 'confirm',
        requires: function (args) {
            var result = false;
            if (args.baton.data.participants) {
                var userId = configApi.get('identifier');
                _(args.baton.data.participants).each(function (participant) {
                    if (participant.id === userId) {
                        result = true;
                    }
                });
                return result;
            }
            return result;
        },
        action: function (baton) {
            var data = baton.data;
            require(['io.ox/tasks/edit/util', 'io.ox/core/tk/dialogs', 'io.ox/tasks/api'], function (editUtil, dialogs, api) {
                //build popup
                var popup = editUtil.buildConfirmationPopup(data, dialogs, true);
                //go
                popup.popup.show().done(function (action) {
                    if (action === "ChangeConfState") {
                        var state = popup.state.prop('selectedIndex') + 1,
                            message = popup.message.val();
                        api.confirm({id: data.id,
                                     folder_id: data.folder_id,
                                     data: {confirmation: state,
                                            confirmMessage: message}
                        }).done(function () {
                            //update detailview
                            api.trigger("update:" + data.folder_id + '.' + data.id);
                            api.trigger("remove-task-confirmation-notification", [{id: data.id}]);
                        });
                    }
                });
            });
        }
    });

    //attachment actions
    new Action('io.ox/tasks/actions/preview-attachment', {
        id: 'preview',
        requires: function (e) {
            return require(['io.ox/preview/main'])
                .pipe(function (p) {
                    var list = _.getArray(e.context);
                    // is at least one attachment supported?
                    return e.collection.has('some') && _(list).reduce(function (memo, obj) {
                        return memo || new p.Preview({
                            filename: obj.filename,
                            mimetype: obj.content_type
                        })
                        .supportsPreview();
                    }, false);
                });
        },
        multiple: function (list) {
            var e = $.Event();
            e.target = this;

            require(['io.ox/core/tk/dialogs',
                     'io.ox/preview/main',
                     'io.ox/core/api/attachment'], function (dialogs, p, attachmentApi) {
                //build Sidepopup
                new dialogs.SidePopup({ arrow: false, side: 'right' })
                    .show(e, function (popup) {
                    _(list).each(function (data, index) {
                        data.dataURL = attachmentApi.getUrl(data, 'view');
                        var pre = new p.Preview(data, {
                            width: popup.parent().width(),
                            height: 'auto'
                        });
                        if (pre.supportsPreview()) {
                            popup.append(
                                $('<h4>').text(data.filename)
                            );
                            pre.appendTo(popup);
                            popup.append($('<div>').text('\u00A0'));
                        }
                    });
                    if (popup.find('h4').length === 0) {
                        popup.append($('<h4>').text(gt('No preview available')));
                    }
                });
            });
        }
    });

    new Action('io.ox/tasks/actions/open-attachment', {
        id: 'open',
        requires: 'some',
        multiple: function (list) {
            require(['io.ox/core/api/attachment'], function (attachmentApi) {
                _(list).each(function (data) {
                    var url = attachmentApi.getUrl(data, 'open');
                    window.open(url);
                });
            });
        }
    });

    new Action('io.ox/tasks/actions/download-attachment', {
        id: 'download',
        requires: 'some',
        multiple: function (list) {
            require(['io.ox/core/api/attachment'], function (attachmentApi) {
                _(list).each(function (data) {
                    var url = attachmentApi.getUrl(data, 'download');
                    window.open(url);
                });
            });
        }
    });

    new Action('io.ox/tasks/actions/save-attachment', {
        id: 'save',
        requires: 'some',
        multiple: function (list) {
            require(['io.ox/core/api/attachment'], function (attachmentApi) {
                //cannot be converted to multiple request because of backend bug (module overides params.module)
                _(list).each(function (data) {
                    attachmentApi.save(data);
                });
                setTimeout(function () {notifications.yell('success', gt('Attachments have been saved!')); }, 300);
            });
        }
    });

    // toolbar

    new links.ActionGroup('io.ox/tasks/links/toolbar', {
        id: 'default',
        index: 100,
        icon: function () {
            return $('<i class="icon-plus">');
        }
    });

    new links.ActionLink('io.ox/tasks/links/toolbar/default', {
        index: 100,
        id: 'create',
        label: gt('Create new task'),
        ref: 'io.ox/tasks/actions/create'
    });

    //inline
    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'edit',
        index: 100,
        prio: 'hi',
        label: gt('Edit'),
        ref: 'io.ox/tasks/actions/edit'
    }));

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'delete',
        index: 200,
        prio: 'hi',
        label: gt('Delete'),
        ref: 'io.ox/tasks/actions/delete'
    }));

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'done',
        index: 300,
        prio: 'hi',
        label: gt('Done'),
        ref: 'io.ox/tasks/actions/done'
    }));

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'unDone',
        index: 310,
        prio: 'hi',
        label: gt('Undone'),
        ref: 'io.ox/tasks/actions/undone'
    }));

    //strange workaround because extend only takes new links instead of plain objects with draw method
    new Action('io.ox/tasks/actions/placeholder', {
        action: function (baton) {}
    });

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'changeDueDate',
        index: 400,
        prio: 'lo',
        ref: 'io.ox/tasks/actions/placeholder',
        draw: function (baton) {
            var data = baton.data;
            this.append(
                $('<span class="dropdown io-ox-action-link">').append(
                    // link
                    $('<a href="#" data-toggle="dropdown">')
                    .text(gt('Change due date')).append($('<b class="caret">')).dropdown(),
                    // drop down
                    $('<ul class="dropdown-menu dropdown-right">').append(
                        util.buildDropdownMenu(new Date(), true)
                    )
                    .delegate('li a', 'click', {task: data}, function (e) {
                        e.preventDefault();
                        var finderId = $(this).attr('finderId');
                        require(['io.ox/tasks/api'], function (api) {
                            var endDate = util.computePopupTime(new Date(), finderId).alarmDate,
                                modifications = {end_date: endDate.getTime()},
                                folder;
                            if (e.data.task.folder) {
                                folder = e.data.task.folder;
                            } else {
                                folder = e.data.task.folder_id;
                            }
                            //check if startDate is still valid with new endDate, if not, show dialog
                            if (e.data.task.start_date && e.data.task.start_date > endDate.getTime()) {
                                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                                    var popup = new dialogs.ModalDialog()
                                        .addButton('cancel', gt('Cancel'))
                                        .addPrimaryButton('change', gt('Adjust start date'));
                                    //text
                                    popup.getBody().append(
                                        $('<h4>').text(gt('Inconsistent dates')),
                                        $('<div>').text(
                                            //#. If the user changes the duedate of a task, it may be before the start date, which is not allowed
                                            //#. If this happens the user gets the option to change the start date so it matches the due date
                                            gt('The due date cannot be before start date. Adjust start date?')
                                        )
                                    );
                                    popup.show().done(function (action) {
                                        if (action === 'cancel') {
                                            notifications.yell('info', gt('Canceled'));
                                        } else {
                                            modifications.start_date = modifications.end_date;
                                            api.update(_.now(), e.data.task.id, modifications, folder).done(function () {
                                                api.trigger('update:' + encodeURIComponent(folder + '.' + e.data.task.id));
                                                notifications.yell('success', gt('Changed due date'));
                                            });
                                        }
                                    });
                                });
                            } else {
                                api.update(_.now(), e.data.task.id, modifications, folder).done(function () {
                                    api.trigger('update:' + encodeURIComponent(folder + '.' + e.data.task.id));
                                    notifications.yell('success', gt('Changed due date'));
                                });
                            }
                        });
                    })
                )
            );
        }
    }));

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'move',
        index: 500,
        prio: 'lo',
        label: gt('Move'),
        ref: 'io.ox/tasks/actions/move'
    }));
    
    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'confirm',
        index: 600,
        prio: 'lo',
        label: gt('Change confirmation status'),
        ref: 'io.ox/tasks/actions/confirm'
    }));

    // Attachments
    ext.point('io.ox/tasks/attachment/links').extend(new links.Link({
        id: 'preview',
        index: 100,
        label: gt('Preview'),
        ref: 'io.ox/tasks/actions/preview-attachment'
    }));

    ext.point('io.ox/tasks/attachment/links').extend(new links.Link({
        id: 'open',
        index: 200,
        label: gt('Open in new tab'),
        ref: 'io.ox/tasks/actions/open-attachment'
    }));

    ext.point('io.ox/tasks/attachment/links').extend(new links.Link({
        id: 'download',
        index: 300,
        label: gt('Download'),
        ref: 'io.ox/tasks/actions/download-attachment'
    }));

    ext.point('io.ox/tasks/attachment/links').extend(new links.Link({
        id: 'save',
        index: 400,
        label: gt('Save in file store'),
        ref: 'io.ox/tasks/actions/save-attachment'
    }));
});
