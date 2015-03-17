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

define('io.ox/tasks/actions',
    ['io.ox/core/extensions',
     'io.ox/tasks/api',
     'io.ox/tasks/util',
     'io.ox/core/extPatterns/links',
     'settings!io.ox/tasks',
     'gettext!io.ox/tasks',
     'io.ox/core/notifications',
     'io.ox/core/print',
     'io.ox/core/extPatterns/actions',
     'io.ox/tasks/common-extensions',
     'io.ox/core/folder/api'
    ], function (ext, api, util, links, settings, gt, notifications, print, actions, extensions, folderAPI) {

    'use strict';

    //  actions
    var Action = links.Action;

    new Action('io.ox/tasks/actions/create', {
        requires: function (e) {
            return e.baton.app.folder.can('create');
        },
        action: function (baton) {
            ox.load(['io.ox/tasks/edit/main']).done(function (edit) {
                edit.getApp().launch({ folderid: baton.app.folder.get()});
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
            var data = baton.data,
                numberOfTasks = data.length || 1;
            ox.load(['io.ox/core/tk/dialogs']).done(function (dialogs) {
                //build popup
                var popup = new dialogs.ModalDialog({async: true})
                    .addPrimaryButton('deleteTask', gt('Delete'), 'deleteTask', {tabIndex: '1'})
                    .addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'});
                //Header
                popup.getBody()
                    .append($('<h4>')
                            .text(gt.ngettext('Do you really want to delete this task?',
                                              'Do you really want to delete this tasks?', numberOfTasks)));
                //go
                popup.show();
                popup.on('deleteTask', function () {
                    require(['io.ox/tasks/api'], function (api) {
                        api.remove(data)
                            .done(function () {
                                notifications.yell('success', gt.ngettext('Task has been deleted!',
                                                                          'Tasks have been deleted!', numberOfTasks));
                                popup.close();
                            }).fail(function (result) {
                                if (result.code === 'TSK-0019') {
                                    //task was already deleted somewhere else. everythings fine, just show info
                                    notifications.yell('info', gt('Task was already deleted!'));
                                    popup.close();
                                } else if (result.error) {
                                    //there is an error message from the backend
                                    popup.idle();
                                    popup.getBody().empty().append($.fail(result.error, function () {
                                        popup.trigger('deleteTask', data);
                                    })).find('h4').remove();
                                } else {
                                    //show generic error message, show retrymessage and enable buttons again
                                    popup.idle();
                                    popup.getBody().empty().append($.fail(gt.ngettext('The task could not be deleted.',
                                                                              'The tasks could not be deleted.', numberOfTasks), function () {
                                        popup.trigger('deleteTask', data);
                                    })).find('h4').remove();
                                }
                            });
                    });
                });
            });
        }
    });

    new Action('io.ox/tasks/actions/done', {
        requires: function (e) {
            if (!(e.collection.has('some') && e.collection.has('modify'))) {
                return false;
            }
            return (e.baton.data.status !== 3);
        },
        action: function (baton) {
            changeState(baton, 1);
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
            changeState(baton, 3);
        }
    });

    function changeState(baton, state) {
        var mods,
            data = baton.data;
        if (state === 3) {
            mods = {label: gt('Undone'),
                    data: {status: 1,
                           percent_completed: 0,
                           date_completed: null
                          }
                   };
        } else {
            mods = {label: gt('Done'),
                    data: {status: 3,
                           percent_completed: 100,
                           date_completed: _.now()
                          }
                   };
        }
        require(['io.ox/tasks/api'], function (api) {
            if (data.length > 1) {
                api.updateMultiple(data, mods.data)
                    .done(function () {
                        _(data).each(function (item) {
                            //update detailview
                            api.trigger('update:' + _.ecid(item));
                        });

                        notifications.yell('success', mods.label);
                    })
                    .fail(function (result) {
                        notifications.yell('error', gt.noI18n(result));
                    });
            } else {
                mods.data.id = data.id;
                mods.data.folder_id = data.folder_id || data.folder;
                api.update(mods.data)
                    .done(function () {
                        notifications.yell('success', mods.label);
                    })
                    .fail(function (result) {
                        var errorMsg = gt('A severe error occurred!');
                        if (result.code === 'TSK-0007') {
                            errorMsg = gt('Task was modified before, please reload');
                        }
                        notifications.yell('error', errorMsg);
                    });
            }
        });
    }

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

            var vgrid = baton.grid || (baton.app && baton.app.getGrid());

            // shared?
            var shared = _([].concat(list)).reduce(function (memo, obj) {
                return memo || isShared(obj.folder_id);
            }, false);

            if (shared || (baton.target && isShared(baton.target))) {
                return notifications.yell('error', gt('Tasks can not be moved to or out of shared folders'));
            }

            require(['io.ox/core/folder/actions/move'], function (move) {

                move.item({
                    api: api,
                    button: gt('Move'),
                    flat: true,
                    indent: false,
                    list: list,
                    module: 'tasks',
                    root: '1',
                    settings: settings,
                    success: {
                        single: 'Task has been moved',
                        multiple: 'Tasks have been moved'
                    },
                    target: baton.target,
                    title: gt('Move'),
                    type: 'move',
                    vgrid: vgrid
                });
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
            ox.load(['io.ox/calendar/acceptdeny', 'io.ox/tasks/api']).done(function (acceptdeny, api) {
                acceptdeny(data, {
                    taskmode: true,
                    api: api,
                    callback: function () {
                        //update detailview
                        api.trigger('update:' + _.ecid({id: data.id, folder_id: data.folder_id}));
                    }
                });
            });
        }
    });

    new Action('io.ox/tasks/actions/print', {
        requires: function (e) {
            return e.collection.has('some', 'read') && _.device('!small');
        },
        multiple: function (list) {
            print.request('io.ox/tasks/print', list);
        }
    });

    //attachment actions
    new links.Action('io.ox/tasks/actions/slideshow-attachment', {
        id: 'slideshow',
        requires: function (e) {
            return e.collection.has('multiple') && _(e.context).reduce(function (memo, obj) {
                return memo || (/\.(gif|bmp|tiff|jpe?g|gmp|png)$/i).test(obj.filename);
            }, false);
        },
        multiple: function (list) {
            require(['io.ox/core/api/attachment', 'io.ox/files/carousel'], function (attachmentAPI, slideshow) {
                var files = _(list).map(function (file) {
                    return {
                        url: attachmentAPI.getUrl(file, 'open'),
                        filename: file.filename
                    };
                });
                slideshow.init({
                    baton: { allIds: files },
                    attachmentMode: true,
                    selector: '.window-container.io-ox-tasks-window'
                });
            });
        }
    });

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
        multiple: function (list, baton) {
            ox.load(['io.ox/core/tk/dialogs',
                     'io.ox/preview/main',
                     'io.ox/core/api/attachment']).done(function (dialogs, p, attachmentAPI) {
                //build Sidepopup
                new dialogs.SidePopup({ tabTrap: true }).show(baton.e, function (popup) {
                    _(list).each(function (data) {
                        data.dataURL = attachmentAPI.getUrl(data, 'view');
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
        requires: 'one',
        multiple: function (list) {
            ox.load(['io.ox/core/api/attachment']).done(function (attachmentAPI) {
                _(list).each(function (data) {
                    var url = attachmentAPI.getUrl(data, 'view');
                    window.open(url);
                });
            });
        }
    });

    new Action('io.ox/tasks/actions/download-attachment', {
        id: 'download',
        requires: function (e) {
            //browser support for downloading more than one file at once is pretty bad (see Bug #36212)
            return e.collection.has('one') && _.device('!ios');
        },
        multiple: function (list) {
            ox.load(['io.ox/core/api/attachment', 'io.ox/core/download']).done(function (attachmentAPI, download) {
                _(list).each(function (data) {
                    var url = attachmentAPI.getUrl(data, 'download');
                    download.url(url);
                });
            });
        }
    });

    new Action('io.ox/tasks/actions/save-attachment', {
        id: 'save',
        capabilities: 'infostore',
        requires: 'some',
        multiple: function (list) {
            ox.load(['io.ox/core/api/attachment']).done(function (attachmentAPI) {
                //cannot be converted to multiple request because of backend bug (module overides params.module)
                _(list).each(function (data) {
                    attachmentAPI.save(data);
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
            return $('<i class="fa fa-plus accent-color">');
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
            var baton = new ext.Baton({data: data.data});
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-trash-o">')
                            .on('click', {grid: data.grid}, function (e) {
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
            var baton = new ext.Baton({data: data.data});
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-check-square-o">')
                            .on('click', {grid: data.grid}, function (e) {
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
            var baton = new ext.Baton({data: data.data});
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-square-o">')
                            .on('click', {grid: data.grid}, function (e) {
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
            var baton = new ext.Baton({data: data.data});
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-sign-in">')
                            .on('click', {grid: data.grid}, function (e) {
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

    // Attachments
    ext.point('io.ox/tasks/attachment/links').extend(new links.Link({
        id: 'slideshow',
        index: 100,
        label: gt('Slideshow'),
        mobile: 'hi',
        ref: 'io.ox/tasks/actions/slideshow-attachment'
    }));

    ext.point('io.ox/tasks/attachment/links').extend(new links.Link({
        id: 'preview',
        index: 100,
        label: gt('Preview'),
        ref: 'io.ox/tasks/actions/preview-attachment'
    }));

    ext.point('io.ox/tasks/attachment/links').extend(new links.Link({
        id: 'open',
        index: 200,
        label: gt('Open in browser'),
        mobile: 'hi',
        ref: 'io.ox/tasks/actions/open-attachment'
    }));

    ext.point('io.ox/tasks/attachment/links').extend(new links.Link({
        id: 'download',
        index: 300,
        label: gt('Download'),
        mobile: 'hi',
        ref: 'io.ox/tasks/actions/download-attachment'
    }));

    ext.point('io.ox/tasks/attachment/links').extend(new links.Link({
        id: 'save',
        index: 400,
        label: gt('Save to Drive'),
        mobile: 'hi',
        ref: 'io.ox/tasks/actions/save-attachment'
    }));
});
