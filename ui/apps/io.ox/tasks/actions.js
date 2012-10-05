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

define("io.ox/tasks/actions", ['io.ox/core/extensions',
                               'io.ox/tasks/util',
                               'io.ox/core/extPatterns/links',
                               'gettext!io.ox/tasks/actions',
                               'io.ox/core/notifications'], function (ext, util, links, gt, notifications) {

    "use strict";
    var Action = links.Action;


    new Action('io.ox/tasks/actions/newtask', {
        id: 'newtask',
        action: function (app) {
            require(['io.ox/tasks/edit/main'], function (edit) {
                edit.getApp().launch();
            });
        }
    });

    new Action('io.ox/tasks/actions/edit', {
        id: 'edit',
        action: function (data) {
            require(['io.ox/tasks/edit/main'], function (edit) {
                edit.getApp().launch().done(function () {
                    this.preFill(data);
                });
            });
        }
    });

    new Action('io.ox/tasks/actions/delete', {
        id: 'delete',
        action: function (data) {
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                //build popup
                var popup = new dialogs.ModalDialog()
                    .addPrimaryButton('delete', gt('Delete'))
                    .addButton('cancel', gt('Cancel'));

                //Header
                popup.getBody()
                    .append($("<h4>")
                            .text(gt('Do you really want to delete this task?')));

                //go
                popup.show().done(function (action) {
                    if (action === 'delete') {
                        require(['io.ox/tasks/api'], function (api) {
                            api.remove({id: data.id, folder: data.folder_id}, false)
                                .done(function (data) {
                                    if (data === undefined || data.length === 0) {
                                        notifications.yell('success', gt('Task has been deleted!'));
                                    } else {//task was modified
                                        notifications.yell('error', gt('Failure! Please refresh.'));
                                    }
                                });
                        });
                    }
                });
            });
        }
    });

    new Action('io.ox/tasks/actions/done', {
        id: 'done',
        action: function (data) {
            require(['io.ox/tasks/api'], function (api) {
                api.update(data.last_modified, data.id, {status: 3, percent_completed: 100}, data.folder_id)
                    .done(function (result) {
                        api.trigger("update:" + data.folder_id + '.' + data.id);
                        notifications.yell('success', gt('Done!'));
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
                        popup.append($('<h4>').text(gt("No preview available")));
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

    //extension points
    // toolbar

    ext.point('io.ox/tasks/links/toolbar').extend(new links.Button({
        index: 100,
        id: 'newtask',
        label: gt('Create new task'),
        cssClasses: 'btn btn-primary',
        ref: 'io.ox/tasks/actions/newtask'
    }));

    //inline
    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'edit',
        index: 100,
        prio: 'hi',
        label: gt("Edit"),
        ref: 'io.ox/tasks/actions/edit'
    }));

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'delete',
        index: 200,
        prio: 'hi',
        label: gt("Delete"),
        ref: 'io.ox/tasks/actions/delete'
    }));

    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'done',
        index: 300,
        prio: 'hi',
        label: gt("Done"),
        ref: 'io.ox/tasks/actions/done'
    }));

    ext.point('io.ox/tasks/links/inline').extend({
        id: 'changeDueDate',
        index: 400,
        prio: 'lo',
        draw: function (data) {
            this.append(
                $('<span class="dropdown" class="io-ox-inline-links">')
                    .append(
                        // link
                        $('<a href="#" data-toggle="dropdown">')
                        .text(gt('Change due date')).append($('<b class="caret">')).dropdown(),
                        // drop down
                        $('<ul class="dropdown-menu">').append(util.buildDropdownMenu(new Date(), true))
                )
            ).delegate('li a', 'click', {task: data}, function (e) {
                e.preventDefault();
                var finderId = $(this).attr('finderId');
                require(['io.ox/tasks/api'], function (api) {
                    var endDate = util.computePopupTime(new Date(), finderId).alarmDate,
                        modifications = {end_date: endDate.getTime()},
                        folder;
                    //check if startDate is still valid with new endDate, if not, make it fit
                    if (e.data.task.start_date && e.data.task.start_date > endDate.getTime()) {
                        modifications.start_date = modifications.end_date;
                    }
                    if (e.data.task.folder) {
                        folder = e.data.task.folder;
                    } else {
                        folder = e.data.task.folder_id;
                    }

                    api.update(_.now(), e.data.task.id, modifications, folder).done(function () {
                        api.trigger("update:" + folder + '.' + e.data.task.id);
                        notifications.yell('success', gt('Changed due date'));
                    });
                });
            });
        }
    });

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
