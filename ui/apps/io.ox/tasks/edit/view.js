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
            this.model.on('change:recurrence_type', function (model, value, changes) {
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
            var self = this,
                rows = {};
            self.baton.app = app;

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

            // Disable Save Button if title is empty on startup
            if (!self.$el.find('#task-edit-title').val()) {
                self.$el.find('.btn[data-action="save"]').prop('disabled', true);
            }

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
