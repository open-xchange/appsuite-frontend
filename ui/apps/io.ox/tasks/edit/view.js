/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/tasks/edit/view', [
    'gettext!io.ox/tasks/edit',
    'io.ox/tasks/edit/view-template',
    'io.ox/tasks/model',
    'io.ox/core/extensions',
    'io.ox/backbone/views',
    'io.ox/core/capabilities',
    'settings!io.ox/core'
], function (gt, template, model, ext, views, capabilities, settings) {

    'use strict';

    var TaskEditView = views.point('io.ox/tasks/edit/view').createView({

        tagName: 'div',

        className: 'io-ox-tasks-edit container',

        init: function () {
            this.collapsed = true;
            this.detailsCollapsed = true;

            //if recurrence is set make sure we have start and end date
            //this prevents errors on saving because recurrence needs both fields filled
            this.model.on('change:recurrence_type', function (model, value) {
                if (value) {
                    if (!(model.get('start_time')) && model.get('start_time') !== 0) {
                        if (model.get('end_time') !== undefined && model.get('end_time') !== null) {
                            model.set('start_time', moment(model.get('end_time')).subtract(1, 'day').valueOf(), { validate: true });
                        } else {
                            model.set('start_time', _.now(), { validate: true });
                        }
                    }
                    if (!(model.get('end_time')) && model.get('end_time') !== 0) {
                        model.set('end_time', moment(model.get('start_time')).add(1, 'day').valueOf(), { validate: true });
                    }
                }
            });
            // add quota exceeded handler
            this.model.on('invalid:quota_exceeded', function (messages) {
                // not during saving to prevent double yells
                if (!this.saving) {
                    require(['io.ox/core/yell'], function (yell) {
                        yell('error', messages[0]);
                    });
                }
            });
        },

        autoOpen: function (data) {
            data = data || this.model.attributes;
            var expandLink = this.$el.find('.expand-link'),
                expandDetailsLink = this.$el.find('.expand-details-link');
            if (expandLink.length === 0 || !this.collapsed) {
                return;
            }
            var details = _(_(data)
                    .pick(['actual_duration', 'target_duration', 'actual_costs', 'target_costs', 'currency', 'trip_meter', 'billing_information', 'companies']))
                    .filter(function (val) {
                        return val;
                    }),
                attributes = _(_(data)
                    .pick(['start_time', 'end_time', 'alarm', 'recurrence_type', 'percent_completed', 'private_flag', 'number_of_attachments', 'priority']))
                    .filter(function (val) {
                        return val;
                    });
            if (this.collapsed && (details.length || attributes.length || this.model.get('status') !== 1 ||
                    //check if attributes contain values other than the defaults
                    (data.participants && data.participants.length))) {
                expandLink.click();
                if (details.length && this.detailsCollapsed) {
                    expandDetailsLink.click();
                }
            }
        },

        render: function (app) {
            var self = this,
                rows = {};
            self.baton.app = app;

            //hide stuff
            if (!settings.get('features/PIMAttachments', capabilities.has('filestore'))) {
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
                app.getWindow().nodes.outer.find('.btn[data-action="save"]').prop('disabled', true);
            }
            //look if there is data beside the default values to trigger autoexpand (only in edit mode)
            if (self.model.get('id')) {
                self.autoOpen();
            }

            // Toggle disabled state of save button
            function fnToggleSave(value) {
                var node = app.getWindow().nodes.outer.find('.btn[data-action="save"]');
                node.prop('disabled', value === '');
            }
            //delegate some events
            self.$el.on('keyup blur', '.title-field', function () {
                var value = $(this).val(),
                    title = value;
                if (!title) {
                    title = self.model.get('id') ? gt('Edit task') : gt('Create task');
                }
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
