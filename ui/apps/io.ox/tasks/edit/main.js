/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define("io.ox/tasks/edit/main", ['gettext!io.ox/tasks',
                                 'io.ox/core/date',
                                 'io.ox/core/extensions',
                                 'io.ox/core/notifications',
                                 'io.ox/tasks/edit/pickerPopup',
                                 'io.ox/core/tk/upload',
                                 'io.ox/core/strings',
                                 'less!io.ox/tasks/edit/style.css'], function (gt, date, ext, notifications, picker, upload, strings) {

    "use strict";

    function createApp() {
        // application object
        var app = ox.ui.createApp({ name: 'io.ox/tasks/edit', title: 'Edit task' }),
            // app window
            win,
            //app
            self,
            // nodes
            node,
            main,
            infoWrapper,
            //inputfields
            title,
            note,
            status,
            priority,
            endDate,
            startDate,
            alarmDate,
            //buttons
            saveButton,
            startDateButton,
            endDateButton,
            alarmButton,
            //attachmentsection
            attachmentLink,
            attachmentDisplay,
            dropZone,
            attachmentArray = [],//displayed Attachments
            attachmentsToRemove = [], //stored Attachments that should be removed on edit
            //storage container Object
            editTask = {};


        // launcher
        app.setLauncher(function (data) {
            self = this;
            // get window
            win = ox.ui.createWindow({
                name: 'io.ox/tasks/edit',
                title: "Edit task",
                toolbar: false,
                close: true
            });

            win.addClass('io-ox-tasks-edit-main');
            app.setWindow(win);

            //build main edit windows
            node = $('<div>').addClass("io-ox-tasks-edit default-content-padding").appendTo(win.nodes.main);
            infoWrapper = $('<div>').addClass('info-wrapper').appendTo(node);
            main = $('<div>').addClass("main-edit").appendTo(node);


            //fill main
            title = $('<input>').addClass("title-field");
            note = $('<textarea>', {rows: '15'}).addClass("note-field");

            main.append(
                $('<span>').text(gt("Title")).addClass("task-edit-main-label"),
                title,
                $('<span>').text(gt("Note")).addClass("task-edit-main-label"),
                note
                );

            //fill info
            saveButton = $('<button>')
                .addClass("btn btn-primary task-edit-save")
                .text(gt("save"))
                .on('click', function (e) {
                    e.stopPropagation();
                    ext.point('io.ox/tasks/edit/actions/save').invoke('action', null, app, app.updateData());
                });

            startDateButton = $('<button>')
                .addClass("btn task-edit-picker")
                .on('click', function (e) {
                    e.stopPropagation();
                    picker.create().done(function (timevalue) {
                        if (timevalue !== -1) {
                            if (!editTask.start_date) {
                                editTask.start_date = new date.Local(timevalue);
                            } else {
                                editTask.start_date.setTime(timevalue);
                            }
                            startDate.val(editTask.start_date.format());
                        }
                    });
                })
                .append($('<i>').addClass('icon-calendar'));

            endDateButton = $('<button>')
                .addClass("btn task-edit-picker")
                .on('click', function (e) {
                    e.stopPropagation();
                    picker.create().done(function (timevalue) {
                        if (timevalue !== -1) {
                            if (!editTask.end_date) {
                                editTask.end_date = new date.Local(timevalue);
                            } else {
                                editTask.end_date.setTime(timevalue);
                            }
                            endDate.val(editTask.end_date.format());
                        }
                    });
                })
                .append($('<i>').addClass('icon-calendar'));

            alarmButton = $('<button>')
                .addClass("btn task-edit-picker")
                .on('click', function (e) {
                    e.stopPropagation();
                    picker.create().done(function (timevalue) {
                        if (timevalue !== -1) {
                            if (!editTask.alarm) {
                                editTask.alarm = new date.Local(timevalue);
                            } else {
                                editTask.alarm.setTime(timevalue);
                            }
                            alarmDate.val(editTask.alarm.format());
                        }
                    });
                })
                .append($('<i>').addClass('icon-calendar'));

            status = $('<select>').addClass("status-selector");
            status.append(
                    $('<option>').text(gt("not started")),
                    $('<option>').text(gt("in progress")),
                    $('<option>').text(gt("done")),
                    $('<option>').text(gt("waiting")),
                    $('<option>').text(gt("deferred"))
                );

            priority = $('<select>').addClass('priority-selector');
            priority.append(
                    $('<option>').text(gt('low')),
                    $('<option>').text(gt('medium')),
                    $('<option>').text(gt('high'))
                );
            priority.prop('selectedIndex', 1);

            startDate = $('<input>').addClass("start-date-field");
            endDate = $('<input>').addClass("end-date-field");
            alarmDate = $('<input>').addClass("alarm-date-field");
            
            //datasection
            attachmentDisplay = $('<div>').addClass("task-attachment-display")
                .css("display:", "none");
            
            attachmentLink = $('<a>').attr('href', '#')
                .addClass("task-attachment-link")
                .text(gt('Attachments') + " (0)")
                .on('click', function (e) {
                    e.preventDefault();
                    attachmentDisplay.children().toggle();
                });
            
            dropZone = upload.dnd.createDropZone({'type': 'single'});
            dropZone.on('drop', function (e, file) {
                attachmentArray.push(file);
                attachmentLink.text(gt('Attachments') + " (" + attachmentArray.length + ")");
                self.buildAttachmentNode(attachmentArray.length - 1);
                attachmentDisplay.children().first().addClass('first');
            });
            
            attachmentDisplay.delegate(".task-remove-attachment", "click", function () {
                var node = $(this).parent();
                if (attachmentArray[node.attr('lnr')].id) { //attachments with id are already stored so they need to be deleted
                    attachmentsToRemove.push(attachmentArray[node.attr('lnr')].id);
                }
                attachmentLink.text(gt('Attachments') + " (" + attachmentArray.length + ")");
                attachmentArray.splice(node.attr('lnr'), 1);
                node.remove();
                attachmentDisplay.children().first().addClass('first');
                attachmentDisplay.children().each(function (index) {
                    $(this).attr('lnr', index);
                });
            });
            
            //put everything into the panel
            infoWrapper.append(
                    saveButton,
                    $('<span>').text(gt("Status")).addClass("task-edit-info-label"),
                    status, $('<br>'),
                    $('<span>').text(gt("Priority")).addClass("task-edit-info-label"),
                    priority, $('<br>'),
                    $('<span>').text(gt("Start date")).addClass("task-edit-info-label"),
                    startDateButton,
                    startDate, $('<br>'),
                    $('<span>').text(gt("Due date")).addClass("task-edit-info-label"),
                    endDateButton,
                    endDate, $('<br>'),
                    $('<span>').text(gt("Reminder date")).addClass("task-edit-info-label"),
                    alarmButton,
                    alarmDate, $('<br>'),
                    attachmentLink,
                    attachmentDisplay,
                    $('<div>').html("All dates must be in following format:<br>" +
                                    "for Germany: day.month.year hour:minutes<br>" +
                                    "exsample: 1.1.2012 2:00<br>" +
                                    "for US/EN: month/day/year hour:minutes <br>" +
                                    "exsample: 1/1/2012 2:00 a<br>" +
                                    "Datepicker is under Construction").css("color", "red")
                );

            //ready for show

            win.show();
        });

        app.preFill = function (taskData) {
            //prefill with taskdata, if available
            if (taskData) {
                //be busy
                node.busy(true);

                //empty storageContainer and fields of old values
                editTask = {};
                startDate.val('');
                endDate.val('');
                alarmDate.val('');
                note.val('');
                title.val('');
                priority.prop('selectedIndex', 1);
                status.prop('selectedIndex', 0);

                //fill with new ones
                if (taskData.start_date) {
                    editTask.start_date = new date.Local(taskData.start_date);
                    startDate.val(editTask.start_date.format());
                }

                if (taskData.end_date) {
                    editTask.end_date = new date.Local(taskData.end_date);
                    endDate.val(editTask.end_date.format());
                }

                if (taskData.alarm) {
                    editTask.alarm = new date.Local(taskData.alarm);
                    alarmDate.val(editTask.alarm.format());
                }

                if (taskData.title) {
                    editTask.title = taskData.title;
                    title.val(editTask.title);
                }

                if (taskData.note) {
                    editTask.note = taskData.note;
                    note.val(editTask.note);
                }

                if (taskData.status) {
                    editTask.status = taskData.status;
                    status.prop('selectedIndex', editTask.status - 1);
                }

                if (taskData.priority) {
                    editTask.priority = taskData.priority;
                    priority.prop('selectedIndex', editTask.priority - 1);
                }

                if (taskData.folder_id) {
                    editTask.folder_id = taskData.folder_id;
                }

                if (taskData.id) {
                    editTask.id = taskData.id;
                }

                if (taskData.last_modified) {
                    editTask.last_modified = taskData.last_modified;
                }

                if (taskData.number_of_attachments !== 0) {
                    require(['io.ox/core/api/attachment'], function (api) {
                        api.getAll({folder_id: taskData.folder_id, id: taskData.id, module: 4}).done(function (data) {

                            for (var i = 0; i < data.length; i++) {
                                data[i].name = data[i].filename;
                                data[i].size = data[i].file_size;
                                data[i].type = data[i].file_mimetype;
                                
                                delete data[i].filename;
                                delete data[i].file_size;
                                delete data[i].file_mimetype;
                                
                                attachmentArray.push(data[i]);
                                self.buildAttachmentNode(i);
                            }
                            attachmentLink.text(gt('Attachments') + " (" + attachmentArray.length + ")");
                            attachmentDisplay.children().first().addClass('first');
                        });
                    });
                }

                //stop being busy
                node.idle();
            }
        };

        app.buildAttachmentNode = function (index) {
            $('<div>').text(attachmentArray[index].name)
                .addClass("task-attachment-single")
                .attr('lnr', index)
                .append($('<i>').addClass("icon-remove task-remove-attachment"),
                        $('<span>').text(strings.fileSize(attachmentArray[index].size)).addClass("attachment-filesize"))
                .appendTo(attachmentDisplay);
        };
        
        app.save = function (data) {
            var reqData = this.buildRequestData(data);

            if (data === -1) {
                setTimeout(function () {
                    notifications.yell("error", gt("All dates must be in following format") + ": day.month.year hour:minutes");
                }, 300);
            } else if (data.start_date && data.end_date && data.start_date > data.end_date) {
                setTimeout(function () {
                    notifications.yell("error", gt("Start date must be before due date"));
                }, 300);
            } else {

                require(['io.ox/core/tk/dialogs'], function (dialogs) {

                    //create popup dialog
                    var popup = new dialogs.ModalDialog();

                    //if id is present an existing task with given id was edited, otherwise it must be a new one
                    if (data.id) {
                        popup.addPrimaryButton('edit', gt('Edit task'))
                        .addButton('newTask', gt('Create new task'));
                    } else {
                        popup.addPrimaryButton('newTask', gt('Create new task'));
                    }

                    popup.addButton('cancel', gt('Cancel'));

                    //Header
                    popup.getHeader().append($("<h4>").text(gt('Save task')));

                    popup.show().done(function (action) {
                        if (action === 'newTask') {
                            require(['io.ox/tasks/api'], function (api) {

                                if (!reqData.folder_id) {
                                    reqData.folder_id = api.getDefaultFolder();
                                }
                                api.create(reqData).done(function (reqResult) {
                                    //add all attachments
                                    if (attachmentArray.length > 1) {
                                        require(['io.ox/core/api/attachment'], function (attachmentApi) {
                                            attachmentApi.create({module: 4, folder: reqData.folder_id, id: reqResult.id},
                                                                              attachmentArray);
                                        });
                                    }
                                    app.quit();
                                }).fail(function () {
                                });
                            });
                        } else if (action === 'edit') {
                            require(['io.ox/tasks/api'], function (api) {

                                if (!reqData.folder_id) {
                                    reqData.folder_id = api.getDefaultFolder();
                                }
                                api.update(data.last_modified, reqData.id, reqData, reqData.folder_id).done(function () {
                                    //remove attachments
                                    if (attachmentsToRemove.length > 0) {
                                        require(['io.ox/core/api/attachment'], function (attachmentApi) {
                                            attachmentApi.remove({module: 4, folder: reqData.folder_id, id: reqData.id},
                                                                 attachmentsToRemove);
                                        });
                                    }
                                    //add new attachments
                                    var attachmentsToAdd = [];
                                    for (var i = 0; i < attachmentArray.length; i++) {
                                        if (!attachmentArray[i].id) { //unstored Attachments don't have an id
                                            attachmentsToAdd.push(attachmentArray[i]);
                                        }
                                    }
                                    if (attachmentsToAdd.length > 0) {
                                        require(['io.ox/core/api/attachment'], function (attachmentApi) {
                                            attachmentApi.create({module: 4, folder: reqData.folder_id, id: reqData.id},
                                                                              attachmentsToAdd);
                                        });
                                    }
                                    
                                    app.quit().done(function () {
                                        api.trigger("update:" + reqData.folder_id + '.' + reqData.id);
                                    });
                                }).fail(function () {
                                });
                            });
                        }
                    });
                });
            }
        };

        //build data to be send
        app.buildRequestData = function (rawData) {

            var result = {title: rawData.title,
                folder_id: rawData.folder_id,
                id: rawData.id,
                note: rawData.note,
                status: rawData.status,
                priority: rawData.priority,
                recurrence_type: 0,
                percent_completed: 0
                };

            //checks needed to prevent is undefined error when getTime() should be called
            if (rawData.end_date) {
                result.end_date = rawData.end_date.getTime();

            } else {
                result.end_date = null;
            }

            if (rawData.start_date) {
                result.start_date = rawData.start_date.getTime();

            } else {
                result.start_date = null;
            }

            if (rawData.alarm) {
                result.alarm = rawData.alarm.getTime();

            } else {
                result.alarm = undefined;
            }

            return result;
        };

        app.updateData = function () {
            editTask.title = title.val();
            editTask.note = note.val();
            editTask.status = status.prop('selectedIndex') + 1;
            editTask.priority = priority.prop('selectedIndex') + 1;
            var temp = date.Local.parse(endDate.val());
            if (temp !== null) {
                editTask.end_date = new date.Local(temp.t);
            } else {
                if (endDate.val() === '') {
                    editTask.end_date = undefined;
                } else {
                    return -1;
                }
            }

            temp = date.Local.parse(startDate.val());
            if (temp !== null) {
                editTask.start_date = new date.Local(temp.t);
            } else {
                if (startDate.val() === '') {
                    editTask.start_date = undefined;
                } else {
                    return -1;
                }
            }

            temp = date.Local.parse(alarmDate.val());
            if (temp !== null) {
                editTask.alarm = new date.Local(temp.t);
            } else {
                if (alarmDate.val() === '') {
                    editTask.alarm = undefined;
                } else {
                    return -1;
                }
            }

            return editTask;
        };


        //Extension points
        ext.point('io.ox/tasks/edit/actions/save').extend({
            id: 'save',
            action: function (app, data) {
                app.save(data);
            }
        });

        return app;
    }

    return {
        getApp: createApp
    };
});
