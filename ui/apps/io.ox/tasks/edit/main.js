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
                                 'io.ox/tasks/edit/util',
                                 'io.ox/tasks/util',
                                 'io.ox/core/date',
                                 'io.ox/core/extensions',
                                 'io.ox/core/notifications',
                                 'io.ox/tasks/edit/pickerPopup',
                                 'io.ox/core/tk/upload',
                                 'io.ox/core/strings',
                                 'less!io.ox/tasks/edit/style.css'], function (gt, util, reminderUtil, date, ext, notifications, picker, upload, strings) {

    "use strict";

    function createApp() {
        // application object
        var app = ox.ui.createApp({ name: 'io.ox/tasks/edit', title: 'Edit task' }),
            // app window
            win,
            //app
            self,
            //state
            taskState,
            // nodes
            node,
            //input
            title,
            note,
            status,
            priority,
            endDate,
            endDateTime,
            startDate,
            startDateTime,
            alarmDate,
            alarmDateTime,
            reminderDropdown,
            progress,
            privateFlag,
            //buttons
            saveButton,
            startDateButton,
            endDateButton,
            alarmButton,
            //links
            repeatLink,
            //tabs
            tabs,
            attachmentsTab,
            participantsTab,
            detailsTab,
            //attachmensttab
            attachmentDisplay,
            dropZone,
            attachmentArray = [],//displayed Attachments
            attachmentsToRemove = [], //stored Attachments that should be removed on edit
            //storage container Object
            editTask = {};
        app.STATES = {
            'CLEAN': 1,
            'DIRTY': 2
        };
        app.getState = function () {
            return taskState;
        };

        app.markDirty = function () {
            taskState = app.STATES.DIRTY;
        };

        app.markClean = function () {
            taskState = app.STATES.CLEAN;
        };

        // launcher
        app.setLauncher(function (data) {
            self = this;
            self.markDirty();
            // get window
            win = ox.ui.createWindow({
                name: 'io.ox/tasks/edit',
                title: "Edit task",
                toolbar: false,
                close: true
            });

            win.addClass('io-ox-tasks-edit-main');
            app.setWindow(win);
            win.nodes.main.addClass("scrollable");
            
            //build main edit windows
            node = $('<div>').addClass("io-ox-tasks-edit  task-edit-wrapper container-fluid").appendTo(win.nodes.main);

            //row 1 subject and savebutton
            title = $('<input>').addClass("title-field span12").attr({type: 'text', id: 'task-edit-title'});
            saveButton = $('<button>')
                .addClass("btn btn-primary task-edit-save")
                .text(gt("Create"))
                .on('click', function (e) {
                    e.stopPropagation();
                    ext.point('io.ox/tasks/edit/actions/save').invoke('action', null, app, app.updateData());
                });
            
            util.buildRow(node, [[util.buildLabel(gt("Title"), title.attr('id')), title], [util.buildLabel('\u00A0'), saveButton]], [9, 3]);
            
            //row 2 reminder
            reminderDropdown = $('<select>').attr('id', 'task-edit-reminder-select')
                                            .append($('<option>')
                                            .text(''), reminderUtil.buildDropdownMenu())
                                            .on('change', function (e) {
                                                if (reminderDropdown.prop('selectedIndex') === 0) {
                                                    editTask.alarm = undefined;
                                                    alarmDate.val('');
                                                    alarmDateTime.val('');
                                                } else {
                                                    var dates = reminderUtil.computePopupTime(new Date(),
                                                            reminderDropdown.find(":selected").attr("finderId"));
                                                    //util.computePopupTime uses Date with added Offset,
                                                    //for use with date.Local this Offset must be unset
                                                    var offset = dates.alarmDate.getTimezoneOffset() * 60000;
                                                    dates.alarmDate.setTime(dates.alarmDate.getTime() + offset);
                                                    if (!editTask.alarm) {
                                                        editTask.alarm = new date.Local(dates.alarmDate.getTime());
                                                    } else {
                                                        editTask.alarm.setTime(dates.alarmDate.getTime());
                                                    }
                                                    alarmDate.val(editTask.alarm.format(date.DATE));
                                                    alarmDateTime.val(editTask.alarm.format(date.TIME));
                                                }
                                            });
            
            alarmDate = $('<input>').addClass("alarm-date-field span10").attr({type: 'text', id: 'task-edit-alarm-date-field'});
            alarmDateTime = $('<input>').addClass("alarm-date-field span12").attr({type: 'text', id: 'task-edit-alarm-date-time-field'});
            alarmButton = $('<button>')
                .addClass("btn task-edit-picker fluid-grid-fix")
                .on('click', function (e) {
                    e.stopPropagation();
                    picker.create().done(function (timevalue) {
                        if (timevalue !== -1) {
                            if (!editTask.alarm) {
                                editTask.alarm = new date.Local(timevalue);
                            } else {
                                editTask.alarm.setTime(timevalue);
                            }
                            alarmDate.val(editTask.alarm.format(date.DATE));
                            alarmDateTime.val(editTask.alarm.format(date.TIME));
                        }
                    });
                })
                .append($('<i>').addClass('icon-calendar'));
            $('<div>').addClass('input-append').append(alarmDate, alarmButton);
            
            util.buildRow(node, [[util.buildLabel(gt("Remind me"), reminderDropdown.attr('id')), reminderDropdown], [util.buildLabel(gt("Date"), alarmDate.attr('id')), alarmDate.parent()], [util.buildLabel(gt("Time"), alarmDateTime.attr('id')), alarmDateTime]],
                    [5, [4, 1], 2]);
            
            //row 3 note
            note = $('<textarea>').addClass("note-field span12").attr('id', 'task-edit-note');
            util.buildRow(node, [[util.buildLabel(gt("Note"), note.attr('id')), note]]);

            //row 4 status progress priority privateFlag
            status = $('<select>').addClass("status-selector").attr('id', 'task-edit-status-select');
            status.append(
                    $('<option>').text(gt("not started")),
                    $('<option>').text(gt("in progress")),
                    $('<option>').text(gt("done")),
                    $('<option>').text(gt("waiting")),
                    $('<option>').text(gt("deferred"))
                );

            priority = $('<select>').addClass('priority-selector').attr('id', 'task-edit-priority-select');
            priority.append(
                    $('<option>').text(gt('low')),
                    $('<option>').text(gt('medium')),
                    $('<option>').text(gt('high'))
                );
            priority.prop('selectedIndex', 1);
            
            progress = util.buildProgress();
            progress.on('change', function () {
                if (progress.val() === '') {
                    progress.val(0);
                    status.prop('selectedIndex', 0);
                } else if (progress.val() === '0' && status.prop('selectedIndex') === 1) {
                    status.prop('selectedIndex', 0);
                } else if (progress.val() === '100' && status.prop('selectedIndex') !== 2) {
                    status.prop('selectedIndex', 2);
                } else if (status.prop('selectedIndex') === 2) {
                    status.prop('selectedIndex', 1);
                } else if (status.prop('selectedIndex') === 0) {
                    status.prop('selectedIndex', 1);
                }
            });
            status.on('change', function () {
                if (status.prop('selectedIndex') === 0) {
                    progress.val('0');
                } else if (status.prop('selectedIndex') === 2) {
                    progress.val('100');
                } else if (status.prop('selectedIndex') === 1 && (progress.val() === '0' || progress.val() === '100')) {
                    progress.val('25');
                }
            });
            
            privateFlag = $('<input>').attr({type: 'checkbox', name: 'privateFlag', id: 'task-edit-private-flag'}).addClass("private-flag");
            
            util.buildRow(node, [[util.buildLabel(gt("Status"), status.attr('id')), status],
                                 [util.buildLabel(gt("Progress in %"), progress.attr('id')), progress.parent()],
                                 [util.buildLabel(gt("Priority"), priority.attr('id')), priority],
                                 [privateFlag, util.buildLabel(gt("Private"), privateFlag.attr('id')).addClass("private-flag")]]);
            
            //row 5 start date due date
            startDateButton = $('<button>')
                .addClass("btn task-edit-picker fluid-grid-fix")
                .on('click', function (e) {
                    e.stopPropagation();
                    picker.create().done(function (timevalue) {
                        if (timevalue !== -1) {
                            if (!editTask.start_date) {
                                editTask.start_date = new date.Local(timevalue);
                            } else {
                                editTask.start_date.setTime(timevalue);
                            }
                            startDate.val(editTask.start_date.format(date.DATE));
                            startDateTime.val(editTask.start_date.format(date.TIME));
                        }
                    });
                })
                .append($('<i>').addClass('icon-calendar'));

            endDateButton = $('<button>')
                .addClass("btn task-edit-picker fluid-grid-fix")
                .on('click', function (e) {
                    e.stopPropagation();
                    picker.create().done(function (timevalue) {
                        if (timevalue !== -1) {
                            if (!editTask.end_date) {
                                editTask.end_date = new date.Local(timevalue);
                            } else {
                                editTask.end_date.setTime(timevalue);
                            }
                            endDate.val(editTask.end_date.format(date.DATE));
                            endDateTime.val(editTask.end_date.format(date.TIME));
                        }
                    });
                })
                .append($('<i>').addClass('icon-calendar'));

            startDate = $('<input>').addClass("start-date-field span10").attr({type: 'text', id: 'task-edit-start-date-field'});
            startDateTime = $('<input>').addClass("start-date-time-field span12").attr({type: 'text', id: 'task-edit-start-date-time-field'});
            endDate = $('<input>').addClass("end-date-field span10").attr({type: 'text', id: 'task-edit-end-date-field'});
            endDateTime = $('<input>').addClass("end-date-time-field span12").attr({type: 'text', id: 'task-edit-end-date-time-field'});
            
            $('<div>').addClass('input-append').append(startDate, startDateButton);
            $('<div>').addClass('input-append').append(endDate, endDateButton);
            util.buildRow(node, [[util.buildLabel(gt("Start date"), startDate.attr('id')), startDate.parent()], [util.buildLabel(gt("Time"), startDateTime.attr('id')), startDateTime],
                                 [util.buildLabel(gt("Due date"), endDate.attr('id')), endDate.parent()], [util.buildLabel(gt("Time"), endDateTime.attr('id')), endDateTime]],
                                 [4, 2, 4, 2]);
            
            //row 6 repeat
            repeatLink = $('<a>').text(gt("Repeat")).addClass("repeat-link").attr('href', '#')
                .on('click', function (e) { e.preventDefault();
                                            setTimeout(function () {notifications.yell("info", gt("Under construction")); }, 300);
                                        });
            util.buildRow(node, repeatLink);
            
            //tabsection
            var temp = util.buildTabs([gt('Participants'), gt('Attachments') + ' (0)', gt('Details')]);
            tabs = temp.table;
            participantsTab = temp.content.find('#edit-task-tab0');
            attachmentsTab = temp.content.find('#edit-task-tab1');
            detailsTab = temp.content.find('#edit-task-tab2');
            node.append(tabs, temp.content);
            
            temp = null;
            
            //partitipants tab
            participantsTab.append($('<h4>').text(gt("Under construction")).css('text-align', 'center'));
            //details tab
            detailsTab = util.buildDetailsTab(detailsTab);
            
            //attachmentTab
            
            attachmentDisplay = $('<div>').addClass("task-attachment-display")
                .css("display:", "none").appendTo(attachmentsTab);
            
            dropZone = upload.dnd.createDropZone({'type': 'single'});
            dropZone.on('drop', function (e, file) {
                attachmentArray.push(file);
                tabs.find('a:eq(1)').text(gt('Attachments') + " (" + attachmentArray.length + ")");
                util.buildAttachmentNode(attachmentDisplay, attachmentArray);
            });
            
            attachmentDisplay.delegate(".task-remove-attachment", "click", function () {
                
                if (attachmentArray[$(this).attr('lnr')].id) { //attachments with id are already stored so they need to be deleted
                    attachmentsToRemove.push(attachmentArray[$(this).attr('lnr')].id);
                }
                attachmentArray.splice($(this).attr('lnr'), 1);
                tabs.find('a:eq(1)').text(gt('Attachments') + " (" + attachmentArray.length + ")");
                util.buildAttachmentNode(attachmentDisplay, attachmentArray);
            });
            
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
                    startDate.val(editTask.start_date.format(date.DATE));
                    startDateTime.val(editTask.start_date.format(date.TIME));
                }
                if (taskData.end_date) {
                    editTask.end_date = new date.Local(taskData.end_date);
                    endDate.val(editTask.end_date.format(date.DATE));
                    endDateTime.val(editTask.end_date.format(date.TIME));
                }
                if (taskData.alarm) {
                    editTask.alarm = new date.Local(taskData.alarm);
                    alarmDate.val(editTask.alarm.format(date.DATE));
                    alarmDateTime.val(editTask.alarm.format(date.TIME));
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
                if (taskData.percent_completed) {
                    editTask.percent_completed = taskData.percent_completed;
                    progress.val(editTask.percent_completed);
                }
                if (taskData.private_flag) {
                    editTask.private_flag = taskData.private_flag;
                    privateFlag.attr('checked', true);
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
                            }
                            util.buildAttachmentNode(attachmentDisplay, attachmentArray);
                            tabs.find('a:eq(1)').text(gt('Attachments') + " (" + attachmentArray.length + ")");
                        });
                    });
                }
                util.fillDetailsTab(taskData);
                saveButton.text(gt("Save changes"));
                
                //stop being busy
                node.idle();
            }
        };
        
        app.save = function (data) {
            var reqData = this.buildRequestData(data);

            if (data === -1) {
                setTimeout(function () {
                    notifications.yell("error", gt("All dates must be in following format") + ": day.month.year hour:minutes");
                }, 300);
            } else if (data === -2) {
                setTimeout(function () {
                    notifications.yell("error", gt("Costs and times must be valid numbers between -130000 and 13000"));
                }, 300);
            } else if (data === -3) {
                setTimeout(function () {
                    notifications.yell("error", gt("Progress in percent must be a valid number between 0 and 100"));
                }, 300);
            } else if (data.start_date && data.end_date && data.start_date > data.end_date) {
                setTimeout(function () {
                    notifications.yell("error", gt("Start date must be before due date"));
                }, 300);
            } else {
                require(['io.ox/tasks/api'], function (api) {
                    if (!reqData.folder_id) {
                        reqData.folder_id = api.getDefaultFolder();
                    }
                    //if id is present an existing task with given id was edited, otherwise it must be a new one
                    if (!data.id) {
                        api.create(reqData).done(function (reqResult) {
                            //add all attachments
                            if (attachmentArray.length > 1) {
                                require(['io.ox/core/api/attachment'], function (attachmentApi) {
                                    attachmentApi.create({module: 4, folder: reqData.folder_id, id: reqResult.id},
                                                         attachmentArray);
                                });
                            }
                            self.markClean();
                            app.quit();
                        }).fail(function () {
                        });
                    } else {
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
                            self.markClean();
                            app.quit().done(function () {
                                api.trigger("update:" + reqData.folder_id + '.' + reqData.id);
                            });
                        }).fail(function () {
                        });
                    }
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
                percent_completed: rawData.percent_completed,
                private_flag: rawData.private_flag
                };
            
            util.updateDetailTabValues(result);
            
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
            editTask.private_flag = (privateFlag.attr('checked') === 'checked');
            
            if (progress.val() && (isNaN(progress.val()) || progress.val() < 0 || progress.val() > 100)) {
                return -3;
            }
            editTask.percent_completed = parseInt(progress.val(), 10);
            
            var temp = date.Local.parse(endDate.val() + ' ' + endDateTime.val());
            if (temp !== null) {
                editTask.end_date = new date.Local(temp.t);
            } else {
                if (endDate.val() === '') {
                    editTask.end_date = undefined;
                } else {
                    return -1;
                }
            }

            temp = date.Local.parse(startDate.val() + ' ' + startDateTime.val());
            if (temp !== null) {
                editTask.start_date = new date.Local(temp.t);
            } else {
                if (startDate.val() === '') {
                    editTask.start_date = undefined;
                } else {
                    return -1;
                }
            }

            temp = date.Local.parse(alarmDate.val() + ' ' + alarmDateTime.val());
            if (temp !== null) {
                editTask.alarm = new date.Local(temp.t);
            } else {
                if (alarmDate.val() === '') {
                    editTask.alarm = undefined;
                } else {
                    return -1;
                }
            }
            util.updateDetailTabValues(editTask);
            if (editTask.actual_costs < -130000 || editTask.actual_costs > 130000) {
                return -2;
            }
            if (editTask.target_costs < -130000 || editTask.target_costs > 130000) {
                return -2;
            }
            if (editTask.actual_duration < -130000 || editTask.actual_duration > 130000) {
                return -2;
            }
            if (editTask.target_duration < -130000 || editTask.target_duration > 130000) {
                return -2;
            }
            
            if (editTask.actual_costs  && isNaN(editTask.actual_costs)) {
                return -2;
            }
            if (editTask.target_costs  && isNaN(editTask.target_costs)) {
                return -2;
            }
            if (editTask.actual_duration  && isNaN(editTask.actual_duration)) {
                return -2;
            }
            if (editTask.target_duration  && isNaN(editTask.target_duration)) {
                return -2;
            }
            
            return editTask;
        };
        
        // Popup on close
        app.setQuit(function () {
            var def = $.Deferred();

            var clean = function () {
                // clear private vars
                app = win = null;
            };

            if (app.getState() === app.STATES.DIRTY) {
                require(["io.ox/core/tk/dialogs"], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt("Do you really want to cancel editing this task?"))
                        .addPrimaryButton("delete", gt('Lose changes'))
                        .addButton("cancel", gt('Cancel'))
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                clean(); // clean before resolve, otherwise tinymce gets half-destroyed (ugly timing)
                                def.resolve();
                            } else {
                                def.reject();
                            }
                        });
                });
            } else {
                clean();
                def.resolve();
            }

            return def;
        });

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
