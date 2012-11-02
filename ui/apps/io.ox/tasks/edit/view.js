/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/edit/view', ['gettext!io.ox/tasks/edit',
                                 "io.ox/tasks/edit/view-template",
                                 'io.ox/tasks/util',
                                 'io.ox/tasks/model',
                                 'io.ox/core/date',
                                 'io.ox/tasks/edit/pickerPopup',
                                 'io.ox/tasks/edit/util',
                                 'io.ox/core/extensions',
                                 'io.ox/core/notifications',
                                 'io.ox/core/tk/upload',
                                 'io.ox/backbone/views',
                                 'io.ox/backbone/forms'],
                                 function (gt, template, reminderUtil, model, date, picker, util, ext, notifications, upload, views, forms) {
    "use strict";
    
    var point = views.point('io.ox/tasks/edit/view'),
        TaskEditView = point.createView({
        tagName: 'div',
        className: 'io-ox-tasks-edit  task-edit-wrapper container-fluid',
        init: function () {
            //needed to do it this way, otherwise data stays for next instance of view and causes errors
            this.fields = {};
            this.rows = [];
            this.attachmentArray = [];
            this.attachmentsToRemove = [];
            this.dropZone = upload.dnd.createDropZone({'type': 'single'});
            this.on('dispose', this.close);
        },
        render: function (app) {
            var self = this;
            //row0 headlinetext cancel and savebutton
            util.buildExtensionRow(self.$el, this.getRow(0, app), self.baton);
            self.$el.children().css({'margin-bottom': '2em',
                                     'font-size': '24px'});
            
            //row 1 subject
            util.buildExtensionRow(self.$el, this.getRow(1, app), self.baton);
            
            //row 2 reminder
            util.buildRow(this.$el, [[util.buildLabel(gt("Remind me"), this.fields.reminderDropdown.attr('id')), this.fields.reminderDropdown],
                                     [util.buildLabel(gt("Date"), this.fields.alarmDate.attr('id')), this.fields.alarmDate.parent()],
                                     [util.buildLabel(gt("Time"), this.fields.alarmDateTime.attr('id')), this.fields.alarmDateTime]],
                    [5, [3, 1], 3]);
            
            //row 3 note
            util.buildExtensionRow(self.$el, this.getRow(2), self.baton);

            //row 4 status progress priority privateFlag
            util.buildExtensionRow(self.$el, this.getRow(3), self.baton);
            
            //row 5 start date due date
            util.buildRow(this.$el, [[util.buildLabel(gt("Start date"), this.fields.startDate.attr('id')), this.fields.startDate.parent()],
                                 [util.buildLabel(gt("Time"), this.fields.startDateTime.attr('id')), this.fields.startDateTime],
                                 [util.buildLabel(gt("Due date"), this.fields.endDate.attr('id')), this.fields.endDate.parent()],
                                 [util.buildLabel(gt("Time"), this.fields.endDateTime.attr('id')), this.fields.endDateTime]]);
           
            //row 6 repeat
            util.buildRow(this.$el, this.fields.repeatLink);

            //tabsection
            var temp = util.buildTabs([gt('Participants'),
                                       //#. %1$s is the number of currently attachened attachments
                                       //#, c-format
                                       gt('Attachments (%1$s)', this.attachmentArray.length),
                                       gt('Details')], '-' + self.cid),
                tabs = temp.table,
                participantsTab = temp.content.find('#edit-task-tab0'  + '-' + self.cid),
                attachmentsTab = temp.content.find('#edit-task-tab1'  + '-' + self.cid),
                detailsTab = temp.content.find('#edit-task-tab2'  + '-' + self.cid);
            this.$el.append(tabs, temp.content);
            temp = null;
            
            //partitipants tab
            util.buildExtensionRow(participantsTab, [this.getRow(0, app, 'participants')], self.baton);
            util.buildExtensionRow(participantsTab, [this.getRow(1, app, 'participants')], self.baton);
            
            //attachmentTab
            var attachmentDisplay = $('<div>').addClass("task-attachment-display")
                .css("display:", "none").appendTo(attachmentsTab);
            
            self.dropZone.on('drop', function (e, file) {
                self.attachmentArray.push(file);
                
                tabs.find('a:eq(1)').text(//#. %1$s is the number of currently attachened attachments
                                          //#, c-format
                                          gt('Attachments (%1$s)', self.attachmentArray.length));
                util.buildAttachmentNode(attachmentDisplay, self.attachmentArray);
            });
            
            util.buildAttachmentNode(attachmentDisplay, this.attachmentArray);
            
            tabs.find('a:eq(1)').text(//#. %1$s is the number of currently attachened attachments
                                      //#, c-format
                                      gt('Attachments (%1$s)', self.attachmentArray.length));
            
            attachmentDisplay.delegate(".task-remove-attachment", "click", function () {
                
                if (self.attachmentArray[$(this).attr('lnr')].id) { //attachments with id are already stored so they need to be deleted
                    self.attachmentsToRemove.push(self.attachmentArray[$(this).attr('lnr')].id);
                }
                self.attachmentArray.splice($(this).attr('lnr'), 1);
                
                tabs.find('a:eq(1)').text(//#. %1$s is the number of currently attachened attachments
                                          //#, c-format
                                          gt('Attachments (%1$s)', self.attachmentArray.length));
                util.buildAttachmentNode(attachmentDisplay, self.attachmentArray);
            });
            
            //detailstab
            util.buildExtensionRow(detailsTab, this.getRow(0, app, 'detail'), self.baton);
            util.buildExtensionRow(detailsTab, this.getRow(1, app, 'detail'), self.baton);
            util.buildExtensionRow(detailsTab, this.getRow(2, app, 'detail'), self.baton);
            util.buildExtensionRow(detailsTab, this.getRow(3, app, 'detail'), self.baton);
            util.buildExtensionRow(detailsTab, this.getRow(4, app, 'detail'), self.baton);
            
            return this.$el;
        },
        getRow: function (number, app, tab) {
            var self = this,
                temp = {};
            if (this.rows.length > 0) {
                if (tab) {
                    if (tab === "detail") {
                        return this.rows[4][number];
                    } else if (tab === "participants") {
                        return this.rows[5][number];
                    }
                } else {
                    return this.rows[number];
                }
            } else {
                //create non extensionPoint nodes
                self.createNonExt(app);
                //fill with empty rows
                this.rows = [[], [], [], [], [[], [], [], [], []], []];
                //get extension points
                this.point.each(function (extension) {
                    temp[extension.id] = extension;
                });
                //put extension points and non extensionpoints into right rows and order
                self.rows[0].push([self.fields.headline, 6]);
                self.rows[0].push([self.fields.cancel, 3]);
                self.rows[0].push([self.fields.saveButton, 3]);
                //row 1
                self.rows[1].push(temp.title);
                //row 3
                self.rows[2].push(temp.note);
                //row 4
                self.rows[3].push(temp.status);
                self.rows[3].push([[util.buildLabel(gt("Progress in %"), this.fields.progress.attr('id')), this.fields.progress.parent()], 3]);
                self.rows[3].push(temp.priority);
                self.rows[3].push(temp.private_flag);
                //detailtab
                self.rows[4][0].push(temp.target_duration);
                self.rows[4][0].push(temp.actual_duration);
                self.rows[4][1].push(temp.target_costs);
                self.rows[4][1].push(temp.actual_costs);
                self.rows[4][1].push(temp.currency);
                self.rows[4][2].push(temp.trip_meter);
                self.rows[4][3].push(temp.billing_information);
                self.rows[4][4].push(temp.companies);
                //participantstab
                self.rows[5].push(temp.participants_list);
                self.rows[5].push(temp.add_participant);
                return this.rows[number];
            }
        },
        createNonExt: function (app) {
            var saveBtnText = gt("Create"),
                headlineText = gt('Create task'),
                self = this,
                //objects to display correct localtimes
                alarmDateObj,
                startDateObj,
                endDateObj;
            if (this.model.attributes.id) {
                saveBtnText = gt("Save");
                headlineText = gt("Edit task");
            }
            //row 0
            this.fields.headline = $('<h1>').addClass('title').text(headlineText);
            this.fields.cancel = $('<button>').addClass('btn cancel span12').text(gt('Discard'))
                        .on('click', function () {
                            app.quit();
                        });
            this.fields.saveButton = $('<button>')
                .addClass("btn btn-primary task-edit-save span12")
                .text(saveBtnText)
                .on('click', function (e) {
                    e.stopPropagation();
                    if (self.model.get('id')) {
                        var callbacks = {
                                success: function (model, response) {
                                    response = {id: model.attributes.id};
                                    self.saveAttachments(model, response, self);
                                    app.markClean();
                                    app.quit();
                                },
                                error: function (model, response) {
                                    console.log(model);
                                    console.log(response);
                                }
                            };
                        self.model.sync("update", self.model, callbacks);
                    } else {
                        var callbacks = {
                                success: function (model, response) {
                                    self.saveAttachments(model, response, self);
                                    app.markClean();
                                    app.quit();
                                },
                                error: function (model, response) {
                                    console.log(model);
                                    console.log(response);
                                }
                            };
                        self.model.sync("create", self.model, callbacks);
                    }
                    
                });
            //row 2
            this.fields.reminderDropdown = $('<select>').attr('id', 'task-edit-reminder-select')
                .append($('<option>')
                .text(''), reminderUtil.buildDropdownMenu())
                .on('change', function (e) {
                    if (self.fields.reminderDropdown.prop('selectedIndex') === 0) {
                        alarmDateObj = undefined;
                        self.model.set('alarm', undefined);
                    } else {
                        var dates = reminderUtil.computePopupTime(new Date(),
                                self.fields.reminderDropdown.find(":selected").attr("finderId"));
                        if (! self.model.attributes.alarm) {
                            alarmDateObj = new date.Local(dates.alarmDate.getTime());
                        } else {
                            alarmDateObj.setTime(dates.alarmDate.getTime());
                        }
                        self.model.set('alarm', dates.alarmDate.getTime());
                    }
                });
            this.fields.alarmDateTime = $('<input>').addClass("alarm-date-time-field span12").attr({type: 'text', id: 'task-edit-alarm-date-time-field'});
            this.fields.alarmDate = $('<input>').addClass("alarm-date-field span9").attr({type: 'text', id: 'task-edit-alarm-date-field'});
            if (this.model.get('alarm')) {
                alarmDateObj = new date.Local(this.model.attributes.alarm);
                this.fields.alarmDate.val(alarmDateObj.format(date.DATE));
                this.fields.alarmDateTime.val(alarmDateObj.format(date.TIME));
            }
            this.fields.alarmButton = $('<button>')
                .addClass("btn task-edit-picker span3 fluid-grid-fix")
                .on('click', function (e) {
                    e.stopPropagation();
                    picker.create().done(function (timevalue) {
                        if (timevalue !== -1) {
                            if (!self.model.get('alarm')) {
                                alarmDateObj = new date.Local(timevalue);
                            } else {
                                alarmDateObj.setTime(timevalue);
                            }
                            self.model.set('alarm', timevalue);
                        }
                    });
                })
                .append($('<i>').addClass('icon-calendar'));
            $('<div>').addClass('input-append').append(this.fields.alarmDate, this.fields.alarmButton);
            this.model.on("change:alarm", function () {
                if (alarmDateObj) {
                    self.fields.alarmDate.val(alarmDateObj.format(date.DATE));
                    self.fields.alarmDateTime.val(alarmDateObj.format(date.TIME));
                } else {
                    self.fields.alarmDate.val('');
                    self.fields.alarmDateTime.val('');
                }
            });
            var alarmupdate = function () {
                var divider = ' ',
                    format = date.getFormat();
                if (format.search(/, /) !== -1) {//english seperates date and time with a comma
                    format = format.replace(/, /, ' ');
                    divider = ", ";
                }
                var temp = date.Local.parse(self.fields.alarmDate.val() + divider + self.fields.alarmDateTime.val().toUpperCase());
                if (temp !== null) {
                    alarmDateObj = temp;
                    self.model.set('alarm', temp.t);
                } else {
                    setTimeout(function () {notifications.yell("error", gt("Please enter correct date and time.") + ' ' + gt.noI18n(format)); }, 300);
                    self.model.trigger('change:alarm');
                }
            };
            this.fields.alarmDate.on("change", alarmupdate);
            this.fields.alarmDateTime.on("change", alarmupdate);
            
            //row 4
            this.fields.progress = util.buildProgress();
            this.fields.progress.on('change', function () {
                var value = parseInt(self.fields.progress.val(), 10);
                if (value !== 'NaN' && value >= 0 && value <= 100) {
                    if (self.fields.progress.val() === '') {
                        self.fields.progress.val(0);
                        self.model.set('status', 1);
                    } else if (self.fields.progress.val() === '0' && self.model.get('status') === 2) {
                        self.model.set('status', 1);
                    } else if (self.fields.progress.val() === '100' && self.model.get('status') !== 3) {
                        self.model.set('status', 3);
                    } else if (self.model.get('status') === 3) {
                        self.model.set('status', 2);
                    } else if (self.model.get('status') === 1) {
                        self.model.set('status', 2);
                    }
                    self.model.set('percent_completed', value);
                } else {
                    setTimeout(function () {notifications.yell("error", gt("Please enter value between 0 and 100.")); }, 300);
                    self.model.trigger('change:percent_completed');
                }
            });
            this.model.on("change:percent_completed", function () {
                self.fields.progress.val(self.model.get('percent_completed'));
            });
            this.fields.progress.val(this.model.get('percent_completed'));
            
            //row5
            this.fields.startDateButton = $('<button>')
            .addClass("btn task-edit-picker span3 fluid-grid-fix")
            .on('click', function (e) {
                e.stopPropagation();
                picker.create().done(function (timevalue) {
                    if (timevalue !== -1) {
                        if (!self.model.attributes.start_date) {
                            startDateObj = new date.Local(timevalue);
                        } else {
                            startDateObj.setTime(timevalue);
                        }
                        self.model.set('start_date', timevalue);
                    }
                });
            })
            .append($('<i>').addClass('icon-calendar'));
    
            this.fields.endDateButton = $('<button>')
                .addClass("btn task-edit-picker span3 fluid-grid-fix")
                .on('click', function (e) {
                    e.stopPropagation();
                    picker.create().done(function (timevalue) {
                        if (timevalue !== -1) {
                            if (!self.model.attributes.end_date) {
                                endDateObj = new date.Local(timevalue);
                            } else {
                                endDateObj.setTime(timevalue);
                            }
                            self.model.set('end_date', timevalue);
                        }
                    });
                })
                .append($('<i>').addClass('icon-calendar'));
            
            this.fields.startDate = $('<input>').addClass("start-date-field span9").attr({type: 'text', id: 'task-edit-start-date-field'});
            this.fields.startDateTime = $('<input>').addClass("start-date-time-field span12").attr({type: 'text', id: 'task-edit-start-date-time-field'});
            this.fields.endDate = $('<input>').addClass("end-date-field span9").attr({type: 'text', id: 'task-edit-end-date-field'});
            this.fields.endDateTime = $('<input>').addClass("end-date-time-field span12").attr({type: 'text', id: 'task-edit-end-date-time-field'});
            if (this.model.attributes.start_date) {
                startDateObj = new date.Local(this.model.attributes.start_date);
                this.fields.startDate.val(startDateObj.format(date.DATE));
                this.fields.startDateTime.val(startDateObj.format(date.TIME));
            }
            if (this.model.attributes.end_date) {
                endDateObj = new date.Local(this.model.attributes.end_date);
                this.fields.endDate.val(endDateObj.format(date.DATE));
                this.fields.endDateTime.val(endDateObj.format(date.TIME));
            }
            $('<div>').addClass('input-append').append(this.fields.startDate, this.fields.startDateButton);
            $('<div>').addClass('input-append').append(this.fields.endDate, this.fields.endDateButton);
            
            this.model.on("change:end_date", function () {
                if (endDateObj) {
                    self.fields.endDate.val(endDateObj.format(date.DATE));
                    self.fields.endDateTime.val(endDateObj.format(date.TIME));
                } else {
                    self.fields.endDate.val('');
                    self.fields.endDateTime.val('');
                }
            });
            var endDateUpdate = function () {
                var divider = ' ',
                    format = date.getFormat();
                if (format.search(/, /) !== -1) {//english seperates date and time with a comma
                    format = format.replace(/, /, ' ');
                    divider = ", ";
                }
                var temp = date.Local.parse(self.fields.endDate.val() + divider + self.fields.endDateTime.val().toUpperCase());
                if (temp !== null) {
                    endDateObj = temp;
                    self.model.set('end_date', temp.t);
                } else {
                    
                    setTimeout(function () {notifications.yell("error", gt("Please enter correct date and time.") + ' ' + gt.noI18n(format)); }, 300);
                    self.model.trigger('change:end_date');
                }
            };
            this.fields.endDate.on("change", endDateUpdate);
            this.fields.endDateTime.on("change", endDateUpdate);
            this.model.on("invalid:end_date", function (messages, errors, model) {
                setTimeout(function () {notifications.yell("error", messages[0]); }, 300);
            });
            this.model.on("change:start_date", function () {
                if (startDateObj) {
                    self.fields.startDate.val(startDateObj.format(date.DATE));
                    self.fields.startDateTime.val(startDateObj.format(date.TIME));
                } else {
                    self.fields.startDate.val('');
                    self.fields.startDateTime.val('');
                }
            });
            var startDateUpdate = function () {
                var divider = ' ',
                    format = date.getFormat();
                if (format.search(/, /) !== -1) {//english seperates date and time with a comma
                    format = format.replace(/, /, ' ');
                    divider = ", ";
                }
                var temp = date.Local.parse(self.fields.startDate.val() + divider + self.fields.startDateTime.val().toUpperCase());
                if (temp !== null) {
                    startDateObj = temp;
                    self.model.set('start_date', temp.t);
                } else {
                    setTimeout(function () {notifications.yell("error", gt("Please enter correct date and time.") + ' ' + gt.noI18n(format)); }, 300);
                    self.model.trigger('change:start_date');
                }
            };
            this.fields.startDate.on("change", startDateUpdate);
            this.fields.startDateTime.on("change", startDateUpdate);
            this.model.on("invalid:start_date", function (messages, errors, model) {
                setTimeout(function () {notifications.yell("error", messages[0]); }, 300);
            });
            //row 6
            this.fields.repeatLink = $('<a>').text(gt("Repeat")).addClass("repeat-link").attr('href', '#')
                .on('click', function (e) { e.preventDefault();
                                            setTimeout(function () {notifications.yell("info", gt("Under construction")); }, 300);
                                        });
        },
        close: function () {
            //clean up to prevent strange sideeffects
            this.fields = {};
            this.rows = [];
            this.attachmentArray = [];
            this.attachmentsToRemove = [];
            this.dropZone.remove();
        },
        
        saveAttachments: function (model, data, self) {
            var folder_id = model.attributes.folder_id;
            //remove attachments
            if (self.attachmentsToRemove.length > 0) {
                require(['io.ox/core/api/attachment'], function (attachmentApi) {
                    attachmentApi.remove({module: 4, folder: folder_id, id: data.id},
                                         self.attachmentsToRemove);
                });
            }
            //add new attachments
            var attachmentsToAdd = [];
            for (var i = 0; i < self.attachmentArray.length; i++) {
                if (!self.attachmentArray[i].id) { //unstored Attachments don't have an id
                    attachmentsToAdd.push(self.attachmentArray[i]);
                }
            }
            if (attachmentsToAdd.length > 0) {
                require(['io.ox/core/api/attachment'], function (attachmentApi) {
                    attachmentApi.create({module: 4, folder: folder_id, id: data.id},
                                         attachmentsToAdd);
                });
            }
        }
    }),
    
    //special handling for attachments
    getAttachments = function (view, node, app) {
        var self = view;
        if (self.model.attributes.number_of_attachments > 0) {
            require(['io.ox/core/api/attachment'], function (attachmentsApi) {
                attachmentsApi.getAll({folder_id: self.model.attributes.folder_id, id: self.model.attributes.id, module: 4}).done(function (data) {
        
                    for (var i = 0; i < data.length; i++) {
                        data[i].name = data[i].filename;
                        data[i].size = data[i].file_size;
                        data[i].type = data[i].file_mimetype;
                                    
                        delete data[i].filename;
                        delete data[i].file_size;
                        delete data[i].file_mimetype;
                                    
                        self.attachmentArray.push(data[i]);
                    }
                    //render
                    node.append(view.render(app));
                });
            });
        } else {
            //render
            node.append(view.render(app));
        }
    };
    
    
    return {
        TaskEditView: TaskEditView,
        getView: function (taskModel, node, app) {
            if (!taskModel) {
                taskModel = model.factory.create();
            } else {
                taskModel = model.factory.wrap(taskModel);
            }
            
            var view = new TaskEditView({model: taskModel});
            //get attachments if there are any then render
            getAttachments(view, node, app);
            
            return view;
        }
    };
});
