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

define('io.ox/tasks/edit/view',
    ['gettext!io.ox/tasks/edit',
     'io.ox/tasks/edit/view-template',
     'io.ox/tasks/util',
     'io.ox/tasks/model',
     'io.ox/core/date',
     'io.ox/tasks/edit/util',
     'io.ox/core/extensions',
     'io.ox/core/notifications',
     'io.ox/backbone/views',
     'io.ox/backbone/forms',
     'io.ox/core/capabilities'
    ], function (gt, template, reminderUtil, model, date, util, ext, notifications, views, forms, capabilities) {

    'use strict';

    var point = views.point('io.ox/tasks/edit/view'),
        TaskEditView = point.createView({
        tagName: 'div',
        className: 'io-ox-tasks-edit  task-edit-wrapper container-fluid',
        init: function () {
            //needed to do it this way, otherwise data stays for next instance of view and causes errors
            this.fields = {};
            this.rows = [];
            this.on('dispose', this.close);
        },
        render: function (app) {
            var self = this;
            //row0 headlinetext cancel and savebutton
            self.$el.append($('<div>').addClass('task-edit-headline').append(this.getRow(0, app)));
            self.$el.children().css({'margin-bottom': '2em',
                                     'font-size': '24px'});

            //row 1 subject
            util.buildExtensionRow(self.$el, this.getRow(1, app), self.baton);

            //row 2 start date due date
            util.buildExtensionRow(self.$el, this.getRow(2), self.baton).addClass('collapsed');

            //row 3 description
            util.buildExtensionRow(self.$el, this.getRow(3), self.baton);

            //expand link
            $('<a>').text(gt('Expand form')).attr('href', '#')
            .on('click', function (e) {
                e.preventDefault();
                self.$el.find('.collapsed').show();
                $(this).remove();
            })
            .appendTo(this.$el);

            //row 4 reminder
            util.buildExtensionRow(self.$el, this.getRow(4), self.baton).addClass('collapsed');

            //row 5 status progress priority privateFlag
            util.buildExtensionRow(self.$el, this.getRow(5), self.baton).addClass('collapsed');

            //row 6 repeat
            //util.buildRow(this.$el, this.fields.repeatLink);

            //tabsection
            var temp = util.buildTabs([gt('Participants'),
                                       //#. %1$s is the number of currently attached attachments
                                       //#, c-format
                                       gt('Attachments (%1$s)', gt.noI18n(0)),
                                       gt('Details')], '-' + self.cid),
                tabs = temp.table,
                participantsTab = temp.content.find('#edit-task-tab0'  + '-' + self.cid),
                attachmentsTab = temp.content.find('#edit-task-tab1'  + '-' + self.cid),
                detailsTab = temp.content.find('#edit-task-tab2'  + '-' + self.cid);
            this.$el.append(tabs.addClass('collapsed'), temp.content);

            //partitipants tab
            util.buildExtensionRow(participantsTab, [this.getRow(0, app, 'participants')], self.baton).addClass('collapsed');
            util.buildExtensionRow(participantsTab, [this.getRow(1, app, 'participants')], self.baton).addClass('collapsed');

            //attachmentTab
            if (capabilities.has('infostore')) {
                var attachmentTabheader = tabs.find('a:eq(1)');
                this.on('attachmentCounterRefresh', function (e, number) {
                    e.stopPropagation();
                    attachmentTabheader.text(
                        //#. %1$s is the number of currently attached attachments
                        //#, c-format
                        gt('Attachments (%1$s)', gt.noI18n(number)));
                });

                this.getRow(0, app, 'attachments').invoke('draw', attachmentsTab, self.baton);
                util.buildExtensionRow(attachmentsTab, [this.getRow(1, app, 'attachments')], self.baton);

                // Hide attachments on specific devices (boot.js)
                if (!ox.uploadsEnabled) attachmentTabheader.hide();
            } else {
                // remove tab header
                temp.table.children().eq(1).remove();
            }

            temp = tabs = null;

            //detailstab
            util.buildExtensionRow(detailsTab, this.getRow(0, app, 'details'), self.baton);
            util.buildExtensionRow(detailsTab, this.getRow(1, app, 'details'), self.baton);
            util.buildExtensionRow(detailsTab, this.getRow(2, app, 'details'), self.baton);
            util.buildExtensionRow(detailsTab, this.getRow(3, app, 'details'), self.baton);
            util.buildExtensionRow(detailsTab, this.getRow(4, app, 'details'), self.baton);

            //change title if available
            if (self.model.get('title')) {
                app.setTitle(self.model.get('title'));
            }
            return this.$el;
        },
        getRow: function (number, app, tab) {
            var self = this,
                temp = {};
            if (this.rows.length > 0) {
                var value;
                switch (tab) {
                case 'details':
                    value = this.rows[6][number];
                    break;
                case 'participants':
                    value = this.rows[7][number];
                    break;
                case 'attachments':
                    value = this.rows[8][number];
                    break;
                default:
                    value = this.rows[number];
                    break;
                }
                return value;
            } else {
                //create non extensionPoint nodes
                self.createNonExt(app);
                //fill with empty rows
                this.rows = [[], [], [], [], [], [], [[], [], [], [], []], [], []];
                //get extension points
                this.point.each(function (extension) {
                    temp[extension.id] = extension;
                });
                //put extension points and non extensionpoints into right rows and order
                //headline row 0
                self.rows[0].push(self.fields.headline);
                self.rows[0].push(self.fields.saveButton);
                self.rows[0].push(self.fields.cancel);
                //row 1
                self.rows[1].push(temp.title);
                //row 2
                self.rows[2].push(temp.end_date);
                self.rows[2].push(temp.start_date);
                //row 3
                self.rows[3].push(temp.note);
                //row 4
                self.rows[4].push([[util.buildLabel(gt('Remind me'), this.fields.reminderDropdown.attr('id')), this.fields.reminderDropdown], 5]);
                self.rows[4].push(temp.alarm);
                //row 5
                self.rows[5].push(temp.status);
                self.rows[5].push([[util.buildLabel(gt('Progress in %'), this.fields.progress.attr('id')), this.fields.progress.parent()], 3]);
                self.rows[5].push(temp.priority);
                self.rows[5].push(temp.private_flag);
                //detailtab
                self.rows[6][0].push(temp.target_duration);
                self.rows[6][0].push(temp.actual_duration);
                self.rows[6][1].push(temp.target_costs);
                self.rows[6][1].push(temp.actual_costs);
                self.rows[6][1].push(temp.currency);
                self.rows[6][2].push(temp.trip_meter);
                self.rows[6][3].push(temp.billing_information);
                self.rows[6][4].push(temp.companies);
                //participantstab
                self.rows[7].push(temp.participants_list);
                self.rows[7].push(temp.add_participant);
                //attachmentstab
                self.rows[8].push(temp.attachment_list);
                self.rows[8].push(temp.attachment_upload);
                //delegate some events
                self.$el.delegate('#task-edit-title', 'keyup', function () {
                    var newTitle = _.noI18n($(this).val());
                    if (!newTitle) {
                        if (self.model.get('id')) {
                            newTitle = gt('Edit task');
                        } else {
                            newTitle = gt('Create task');
                        }
                    }
                    app.setTitle(newTitle);
                });
                return this.rows[number];
            }
        },
        createNonExt: function (app) {
            var saveBtnText = gt('Create'),
                headlineText = gt('Create task'),
                self = this;
            if (this.model.attributes.id) {
                saveBtnText = gt('Save');
                headlineText = gt('Edit task');
            }
            //row 0
            this.fields.headline = $('<h1>').addClass('title').text(headlineText);
            this.fields.cancel = $('<button>').attr('data-action', 'discard').addClass('btn cancel').text(gt('Discard'))
                        .on('click', function () {
                            app.quit();
                        });
            this.fields.saveButton = $('<button>').attr('data-action', 'save')
                .addClass('btn btn-primary task-edit-save')
                .text(saveBtnText)
                .on('click', function (e) {

                    //check if waiting for attachmenthandling is needed
                    if (self.baton.attachmentList.attachmentsToAdd.length +
                        self.baton.attachmentList.attachmentsToDelete.length > 0) {
                        self.model.attributes.tempAttachmentIndicator = true;//temporary indicator so the api knows that attachments needs to be handled even if nothing else changes
                    }
                    e.stopPropagation();
                    self.model.save().done(function () {
                        app.markClean();
                        app.quit();
                    }).fail(function (response) {
                        setTimeout(function () {notifications.yell('error', response.error); }, 300);
                        console.log(response);
                    });

                });
            //row 4
            this.fields.reminderDropdown = $('<select>').attr('id', 'task-edit-reminder-select').addClass('span12')
                .append($('<option>')
                .text(''), reminderUtil.buildDropdownMenu())
                .on('change', function (e) {
                    if (self.fields.reminderDropdown.prop('selectedIndex') === 0) {
                        self.model.set('alarm', null);
                    } else {
                        var dates = reminderUtil.computePopupTime(new Date(),
                                self.fields.reminderDropdown.find(':selected').attr('finderId'));
                        self.model.set('alarm', dates.alarmDate.getTime());
                    }
                });

            //row 5
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
                    setTimeout(function () {notifications.yell('error', gt('Please enter value between 0 and 100.')); }, 300);
                    self.model.trigger('change:percent_completed');
                }
            });
            this.model.on('change:percent_completed', function () {
                self.fields.progress.val(self.model.get('percent_completed'));
            });
            this.fields.progress.val(this.model.get('percent_completed'));

            //row 6
            this.fields.repeatLink = $('<a>').text(gt('Repeat')).addClass('repeat-link').attr('href', '#')
                .on('click', function (e) { e.preventDefault();
                                            setTimeout(function () {notifications.yell('info', gt('Under construction')); }, 300);
                                        });
        },
        close: function () {
            //clean up to prevent strange sideeffects
            this.fields = {};
            this.rows = [];
        }

    });

    return {
        TaskEditView: TaskEditView,
        getView: function (taskModel, node, app) {
            if (!taskModel) {
                taskModel = model.factory.create();
            } else {
                taskModel = model.factory.wrap(taskModel);
            }

            var view = new TaskEditView({model: taskModel});
            node.append(view.render(app));

            return view;
        }
    };
});
