/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/edit/view', [
    'gettext!io.ox/tasks/edit',
    'io.ox/tasks/edit/view-template',
    'io.ox/tasks/model',
    'io.ox/core/date',
    'io.ox/core/extensions',
    'io.ox/backbone/views',
    'io.ox/core/capabilities'
], function (gt, template, model, date, ext, views, capabilities) {

    'use strict';

    var TaskEditView = views.point('io.ox/tasks/edit/view').createView({

        tagName: 'div',

        className: 'io-ox-tasks-edit container default-content-padding',

        init: function () {
            this.collapsed = true;
            this.detailsCollapsed = true;

            //if recurrence is set make sure we have start and end date
            //this prevents errors on saving because recurrence needs both fields filled
            this.model.on('change:recurrence_type', function (model, value) {
                if (value) {
                    if (!(model.get('start_date')) && model.get('start_date') !== 0) {
                        if (model.get('end_date') !== undefined && model.get('end_date') !== null) {
                            model.set('start_date',  model.get('end_date') - date.DAY, { validate: true });
                        } else {
                            model.set('start_date', _.now(), { validate: true });
                        }
                    }
                    if (!(model.get('end_date')) && model.get('end_date') !== 0) {
                        model.set('end_date', model.get('start_date') + date.DAY, { validate: true });
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
                ext.point('io.ox/tasks/edit/view').disable('attachment_list');
                ext.point('io.ox/tasks/edit/view').disable('attachment_upload');
                ext.point('io.ox/tasks/edit/view').disable('attachments_legend');
            }
            // hide participants tab for PIM user
            if (!capabilities.has('delegate_tasks')) {
                ext.point('io.ox/tasks/edit/view').disable('participants_list');
                ext.point('io.ox/tasks/edit/view').disable('add_participant');
                ext.point('io.ox/tasks/edit/view').disable('participants_legend');
            }

            _(this.point.list()).each(function (extension) {
                //seperate extensions with rows
                if (extension.row) {
                    if (!rows[extension.row]) {
                        rows[extension.row] = [];
                    }
                    rows[extension.row].push(extension);
                } else {
                    //all the rest
                    if (!rows.rest) { //rest is used for extension points without row
                        rows.rest = [];
                    }
                    rows.rest.push(extension);
                }
            });

            //draw the rows
            _(rows).each(function (row, key) {
                //leave out all the rest, for now
                if (key !== 'rest') {
                    //row 0 is the headline
                    var node = $('<div class="row">').appendTo(self.$el);
                    for (var i = 0; i < row.length; i++) {
                        row[i].invoke('draw', node, self.baton);
                    }
                }
            });

            //now draw the rest
            _(rows.rest).each(function (extension) {
                extension.invoke('draw', self.$el, self.baton);
            });

            //change title if available
            if (self.model.get('title')) {
                app.setTitle(self.model.get('title'));
            }

            // Disable Save Button if title is empty on startup
            if (!self.$el.find('input.title-field').val()) {
                self.$el.find('.btn[data-action="save"]').prop('disabled', true);
            }
            //look if there is data beside the default values to trigger autoexpand (only in edit mode)
            if (self.model.get('id')) {
                var details = _(_(self.model.attributes)
                        .pick(['actual_duration', 'target_duration', 'actual_costs', 'target_costs', 'currency', 'trip_meter', 'billing_information', 'companies']))
                        .filter(function (val) {
                            return val;
                        }),
                    attributes = _(_(self.model.attributes)
                        .pick(['start_date', 'end_date', 'alarm', 'recurrence_type', 'percent_completed', 'private_flag', 'number_of_attachments', 'priority']))
                        .filter(function (val) {
                            return val;
                        });
                if (details.length || attributes.length || self.model.get('status') !== 1 ||
                        //check if attributes contain values other than the defaults
                        (self.model.get('participants') && self.model.get('participants').length)) {
                    self.$el.find('.expand-link').click();
                    if (details.length) {
                        self.$el.find('.expand-details-link').click();
                    }
                }
            }

            // Toggle disabled state of save button
            function fnToggleSave(value) {
                var node = self.$el.find('.btn[data-action="save"]');
                if (_.device('smartphone')) node = self.$el.parent().parent().find('.btn[data-action="save"]');
                node.prop('disabled', value === '');
            }
            //delegate some events
            self.$el.delegate('.title-field', 'keyup blur', function () {
                var value = $(this).val();
                var title = value ? value : (self.model.get('id') ? gt('Edit task') : gt('Create task'));
                app.setTitle(title);
                fnToggleSave(value);
            });
            return this;
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

            var view = new TaskEditView({ model: taskModel });
            node.append(view.render(app).$el);

            return view;
        }
    };
});
