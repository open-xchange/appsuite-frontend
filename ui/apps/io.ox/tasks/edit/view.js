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
     'io.ox/tasks/model',
     'io.ox/core/date',
     'io.ox/core/api/account',
     'io.ox/tasks/edit/util',
     'io.ox/core/extensions',
     'io.ox/core/notifications',
     'io.ox/backbone/views',
     'io.ox/backbone/forms',
     'io.ox/core/capabilities'
    ], function (gt, template, model, date, account, util, ext, notifications, views, forms, capabilities) {

    'use strict';

    var point = views.point('io.ox/tasks/edit/view'),
        TaskEditView = point.createView({
        tagName: 'div',
        className: 'io-ox-tasks-edit task-edit-wrapper container-fluid default-content-padding',
        init: function () {
            this.collapsed = true;

            //if recurrence is set make sure we have start and end date
            //this prevents errors on saving because recurrence needs both fields filled
            this.model.on('change:recurrence_type', function (model, value) {
                if (value) {
                    if (!(model.get('start_date')) && model.get('start_date') !== 0) {
                        if (model.get('end_date') !== undefined && model.get('end_date') !== null) {
                            model.set('start_date',  model.get('end_date') - date.DAY, {validate: true});
                        } else {
                            model.set('start_date', _.now(), {validate: true});
                        }
                    }
                    if (!(model.get('end_date')) && model.get('end_date') !== 0) {
                        model.set('end_date', model.get('start_date') + date.DAY, {validate: true});
                    }
                }
            });
        },
        render: function (app) {
            var self = this;

            //row0 headlinetext cancel and savebutton
            self.$el.append($('<div>').addClass('task-edit-headline row-fluid').append(this.getRow(0, app)));

            //row 1 subject
            util.buildExtensionRow(self.$el, this.getRow(1, app), self.baton);

            //row 2 start date due date
            util.buildExtensionRow(self.$el, this.getRow(2), self.baton).addClass('collapsed');
            
            //row 3 recurrence
            util.buildExtensionRow(self.$el, this.getRow(3), self.baton).addClass('collapsed');

            //row 4 description
            util.buildExtensionRow(self.$el, this.getRow(4), self.baton);

            //expand link
            $('<a>').text(gt('Expand form')).attr('href', '#')
            .on('click', function (e) {
                e.preventDefault();
                self.$el.find('.collapsed').show();
                $(this).remove();
            })
            .appendTo(this.$el);

            //row 5 reminder
            util.buildExtensionRow(self.$el, this.getRow(5), self.baton).addClass('collapsed');

            //row 6 status progress priority privateFlag
            util.buildExtensionRow(self.$el, this.getRow(6), self.baton).addClass('collapsed');

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

            //hide stuff
            if (!capabilities.has('infostore')) {
                ext.point('io.ox/tasks/edit/view/tabs').disable('attachments_tab');
            }
            // hide participants tab for PIM user
            if (!capabilities.has('delegate_tasks')) {
                ext.point('io.ox/tasks/edit/view/tabs').disable('participants_tab');
            }

            util.splitExtensionsByRow(this.point.list(), rows, true);
            //draw the rows
            _(rows).each(function (row, key) {
                if (key !== 'rest') {//leave out all the rest, for now
                    util.buildExtensionRow(self.$el, row, self.baton);
                }
            });
            if (_.device('smartphone')) {
                // create new toolbar on bottom
                ext.point('io.ox/tasks/edit/bottomToolbar').invoke('draw', this, self.baton);
            }
            //now draw the rest
            _(rows.rest).each(function (extension) {
                extension.invoke('draw', this.$el, self.baton);
            });

            //change title if available
            if (self.model.get('title')) {
                app.setTitle(self.model.get('title'));
            }

                    e.stopPropagation();
                    app.getWindow().busy();

                    //check if waiting for attachmenthandling is needed
                    if (self.baton.attachmentList.attachmentsToAdd.length +
                        self.baton.attachmentList.attachmentsToDelete.length > 0) {
                        self.model.attributes.tempAttachmentIndicator = true;//temporary indicator so the api knows that attachments needs to be handled even if nothing else changes
                    }

                    self.model.save().done(function () {
                        app.markClean();
                        app.quit();
                    }).fail(function (response) {
                        setTimeout(function () {
                            app.getWindow().idle();
                            notifications.yell('error', response.error);
                        }, 300);
                    });

            // Toggle disabled state of save button
            function fnToggleSave(isDirty) {
                var node = self.$el.find('.btn[data-action="save"]');
                if (_.device('smartphone')) node = self.$el.parent().parent().find('.btn[data-action="save"]');
                if (isDirty) node.prop('disabled', false); else node.prop('disabled', true);
            }
            //delegate some events
            self.$el.delegate('#task-edit-title', 'keyup blur', function () {
                var newTitle = _.noI18n($(this).val());
                if (!newTitle) {
                    if (self.model.get('id')) {
                        newTitle = gt('Edit task');
                    } else {
                        newTitle = gt('Create task');
                    }
                }
                fnToggleSave($(this).val());
                app.setTitle(newTitle);
            });
            return this.$el;
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
