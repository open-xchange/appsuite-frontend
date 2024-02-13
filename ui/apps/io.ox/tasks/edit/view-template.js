/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/tasks/edit/view-template', [
    'gettext!io.ox/tasks/edit',
    'io.ox/backbone/views',
    'io.ox/core/tk/upload',
    'io.ox/core/yell',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/datepicker',
    'io.ox/tasks/edit/util',
    'io.ox/backbone/views/recurrence-view',
    'io.ox/participants/add',
    'io.ox/participants/views',
    'io.ox/core/tk/attachments',
    'io.ox/tasks/api',
    'io.ox/core/extensions',
    'io.ox/tasks/util',
    'io.ox/core/folder/api',
    'settings!io.ox/tasks'
], function (gt, views, upload, yell, mini, DatePicker, util, RecurrenceView, AddParticipantView, pViews, attachments, api, ext, taskUtil, folderAPI, settings) {

    'use strict';

    var point = views.point('io.ox/tasks/edit/view');

    point.basicExtend({
        index: 100,
        id: 'dnd',
        draw: function (baton) {
            this.append(
                new upload.dnd.FloatingDropzone({
                    app: baton.app,
                    point: 'io.ox/tasks/edit/dnd/actions'
                }).render().$el
            );
        }
    });

    //headline
    point.basicExtend({
        id: 'headline',
        index: 100,
        row: '0',
        draw: function (baton) {
            var saveBtnText = gt('Create'),
                headlineText = gt('Create task'),
                headline, saveBtn, row,
                app = baton.app;
            if (baton.model.attributes.id) {
                saveBtnText = gt('Save');
                headlineText = gt('Edit task');
            }

            row = $('<div class="header">').append(
                //title
                headline = $('<h1 class="sr-only">').text(headlineText),
                //save button
                saveBtn = $('<button type="button" data-action="save" class="btn btn-primary task-edit-save">')
                    .text(saveBtnText)
                    .on('click', function () {
                        app.getWindow().busy();
                        util.sanitizeBeforeSave(baton);

                        baton.model.saving = true;
                        baton.model.save().done(function () {
                            delete baton.model.saving;
                            app.markClean();
                            app.quit();
                        }).fail(function (response) {
                            setTimeout(function () {
                                delete baton.model.saving;
                                app.getWindow().idle();
                                yell(response);
                            }, 300);
                        });
                    }),
                //cancel button
                $('<button type="button" data-action="discard" class="btn btn-default cancel task-edit-cancel">')
                    .text(gt('Discard'))
                    .on('click', function (e) {
                        e.stopPropagation();
                        app.quit();
                    })
            );

            app.getWindow().setHeader(row);

            baton.parentView.on('changeMode', function (e, mode) {
                if (mode === 'edit') {
                    headline.text(gt('Edit task'));
                    saveBtn.text(gt('Save'));
                } else {
                    headline.text(gt('Create task'));
                    saveBtn.text(gt('Create'));
                }
            });
        }
    });

    // title
    point.extend({
        id: 'title',
        index: 200,
        className: 'col-sm-12',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label">').text(gt('Subject')).attr({ for: guid }),
                new mini.InputView({ name: 'title', model: this.model, mandatory: true }).render().$el.attr({ id: guid }).addClass('title-field')
            );
        }
    }, { row: '1' });

    // note
    point.extend({
        id: 'note',
        index: 300,
        className: 'col-sm-12',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label">').text(gt('Description')).attr({ for: guid }),
                new mini.TextView({ name: 'note', model: this.model }).render().$el.attr({ id: guid }).addClass('note-field')
            );
        }
    }, { row: '2' });

    point.basicExtend({
        id: 'expand_link',
        index: 400,
        row: '3',
        draw: function (baton) {
            var text = gt('Collapse form');

            if (baton.parentView.collapsed) {
                text = gt('Expand form');
            }
            this.append(
                $('<div class="col-lg-12">').append(
                    $('<button type="button" class="btn btn-link expand-link">').attr('aria-expanded', !baton.parentView.collapsed).text(text)
                    .on('click', function () {
                        baton.parentView.collapsed = !baton.parentView.collapsed;
                        baton.parentView.$el.toggleClass('expanded', !baton.parentView.collapsed);
                        $(this).attr('aria-expanded', !baton.parentView.collapsed).text((baton.parentView.collapsed ? gt('Expand form') : gt('Collapse form')));
                    })
                )
            );
        }
    });

    point.basicExtend({
        id: 'start_date',
        index: 500,
        row: '4',
        draw: function (baton) {
            this.append(
                new DatePicker({
                    model: baton.model,
                    className: 'col-sm-6 col-xs-12 collapsible',
                    attribute: 'start_time',
                    label: gt('Start date'),
                    clearButton: true,
                    display: baton.model.get('full_time') ? 'DATE' : 'DATETIME'
                }).listenTo(baton.model, 'change:full_time', function (model, fulltime) {
                    this.toggleTimeInput(!fulltime);
                    if (_.device('smartphone')) {
                        // trigger change to update input fields on mobile
                        baton.model.trigger('change:start_time change:end_time');
                    }
                }).on('click:time', function () {
                    var target = this.$el.find('.dropdown-menu.calendaredit'),
                        container = target.scrollParent(),
                        pos = target.offset().top - container.offset().top;

                    if ((pos < 0) || (pos + target.height() > container.height())) {
                        // scroll to Node, leave 16px offset
                        container.scrollTop(container.scrollTop() + pos - 16);
                    }

                }).render().$el.attr('data-extension-id', 'start_time')
            );
        }
    });

    point.basicExtend({
        id: 'end_date',
        index: 600,
        row: '4',
        draw: function (baton) {
            this.append(
                new DatePicker({
                    model: baton.model,
                    className: 'col-sm-6 col-xs-12 collapsible',
                    attribute: 'end_time',
                    label: gt('Due date'),
                    clearButton: true,
                    display: baton.model.get('full_time') ? 'DATE' : 'DATETIME'
                }).listenTo(baton.model, 'change:full_time', function (model, fulltime) {
                    this.toggleTimeInput(!fulltime);
                    if (_.device('smartphone')) {
                        // trigger change to update input fields on mobile
                        baton.model.trigger('change:start_time change:end_time');
                    }
                }).on('click:time', function () {
                    var target = this.$el.find('.dropdown-menu.calendaredit'),
                        container = target.scrollParent(),
                        pos = target.offset().top - container.offset().top;

                    if ((pos < 0) || (pos + target.height() > container.height())) {
                        // scroll to Node, leave 16px offset
                        container.scrollTop(container.scrollTop() + pos - 16);
                    }

                }).render().$el.attr('data-extension-id', 'end_time')
            );
        }
    });

    // full time
    point.extend({
        id: 'full_time',
        index: 700,
        className: 'col-md-6 collapsible',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                new mini.CustomCheckboxView({ id: guid, name: 'full_time', label: gt('All day'), model: this.model }).render().$el
            );
        }
    }, { row: '5' });

    point.extend({
        id: 'recurrence',
        className: 'col-xs-12 collapsible',
        tabindex: 0,
        index: 800,
        render: function () {
            this.$el.append(new RecurrenceView({
                model: this.model
            }).render().$el);
            this.$el.find('.recurrence-view checkbox').attr('tabindex', 0);
        }
    }, { row: 6 });

    //reminder selection
    point.basicExtend({
        id: 'alarm_select',
        index: 900,
        row: '7',
        draw: function (baton) {
            var selector;
            this.append(
                $('<div class="col-sm-6 collapsible">').append(
                    $('<label for="task-edit-reminder-select">').text(gt('Reminder')),
                    selector = $('<select id="task-edit-reminder-select" class="form-control">')
                    .append($('<option>')
                    //#. Text that is displayed in a select box for task reminders, when the user does not use a predefined time, like in 15minutes
                    .text(gt('Manual input')), taskUtil.buildDropdownMenu(),
                    $('<option>').text(gt('No reminder')))
                    .on('change', function () {
                        if (selector.prop('selectedIndex') === 0) {
                            // manual input selected, change nothing
                            return;
                        } else if (selector.prop('selectedIndex') === selector.prop('length') - 1) {
                            // no Reminder Selected, remove reminder
                            baton.model.set('alarm', null, { validate: true, setBy: 'selectbox' });
                        } else {
                            // set to correct time
                            baton.model.set('alarm', taskUtil.computePopupTime(selector.val()).alarmDate, { validate: true, setBy: 'selectbox' });
                        }
                    })
                )
            );
            baton.model.on('change:alarm', function (model, value, options) {
                // no need to update the selectbox if the new value was set by it (avoid invinite loop)
                if (options.setBy !== 'selectbox') {
                    if (_.isNull(value)) {
                        // set to no reminder
                        selector.prop('selectedIndex', selector.prop('length') - 1);
                    } else {
                        // set to manual input
                        selector.prop('selectedIndex', 0);
                    }
                }
            });
            if (!baton.model.get('alarm')) {
                // set to no reminder
                selector.prop('selectedIndex', selector.prop('length') - 1);
            }
        }
    });

    // reminder date
    point.basicExtend({
        id: 'alarm',
        index: 1000,
        row: '7',
        draw: function (baton) {
            this.append(
                new DatePicker({
                    model: baton.model,
                    display: 'DATETIME',
                    ignoreToggle: true,
                    className: 'col-xs-12 col-sm-6 collapsible',
                    attribute: 'alarm',
                    label: gt('Reminder date'),
                    clearButton: true
                }).on('click:time', function () {
                    var target = this.$el.find('.dropdown-menu.calendaredit'),
                        container = target.scrollParent(),
                        pos = target.offset().top - container.offset().top;

                    if ((pos < 0) || (pos + target.height() > container.height())) {
                        // scroll to Node, leave 16px offset
                        container.scrollTop(container.scrollTop() + pos - 16);
                    }

                }).render().$el.attr('data-extension-id', 'alarm')
            );
        }
    });

    // status
    point.extend({
        id: 'status',
        index: 1100,
        className: 'col-sm-3 collapsible',
        render: function () {
            var guid = _.uniqueId('form-control-label-'),
                self = this,
                options = [
                    { label: gt('Not started'), value: 1 },
                    { label: gt('In progress'), value: 2 },
                    { label: gt('Done'), value: 3 },
                    { label: gt('Waiting'), value: 4 },
                    { label: gt('Deferred'), value: 5 }
                ], selectInput;
            this.$el.append(
                $('<label class="control-label">').attr('for', guid).text(gt('Status')),
                $('<div>').append(
                    selectInput = new mini.SelectView({
                        list: options,
                        name: 'status',
                        model: this.baton.model,
                        id: guid,
                        className: 'form-control'
                    }).render().$el
                )
            );
            selectInput.on('change', function () {
                if ($(this).prop('selectedIndex') === 0) {
                    self.model.set('percent_completed', 0, { validate: true });
                } else if ($(this).prop('selectedIndex') === 2) {
                    self.model.set('percent_completed', 100, { validate: true });
                } else if ($(this).prop('selectedIndex') === 1 && (self.model.get('percent_completed') === 0 || self.model.get('percent_completed') === 100)) {
                    self.model.set('percent_completed', 25, { validate: true });
                }
            });
        }
    }, { row: '8' });

    point.basicExtend({
        id: 'progress',
        index: 1200,
        row: '8',
        draw: function (baton) {
            var progressField = util.buildProgress(baton.model.get('percent_completed'));
            this.append(
                $('<div class="col-sm-3 collapsible">').append(
                    $('<label for="task-edit-progress-field">').text(gt('Progress in %')), $(progressField.wrapper)
                    .val(baton.model.get('percent_completed'))
                    .on('change', function () {
                        var value = $.trim(progressField.progress.val()).replace(/\s*%$/, ''),
                            valid = /^\d+$/.test(value),
                            number = parseInt(value, 10);
                        if (valid && number >= 0 && number <= 100) {
                            if (number === 0 && baton.model.get('status') === 2) {
                                baton.model.set('status', 1, { validate: true });
                            } else if (number === 100 && baton.model.get('status') !== 3) {
                                baton.model.set('status', 3, { validate: true });
                            } else if (baton.model.get('status') === 3) {
                                baton.model.set('status', 2, { validate: true });
                            } else if (baton.model.get('status') === 1) {
                                baton.model.set('status', 2, { validate: true });
                            }
                            baton.model.set('percent_completed', number, { validate: true });
                        } else {
                            yell('error', gt('Please enter value between 0 and 100.'));
                            baton.model.trigger('change:percent_completed');
                        }
                    })
                )
            );
            baton.model.on('change:percent_completed', function () {
                progressField.progress.val(baton.model.get('percent_completed'));
            });
        }
    });

    // priority
    point.extend({
        id: 'priority',
        index: 1300,
        className: 'col-sm-3 collapsible',
        render: function () {
            var guid = _.uniqueId('form-control-label-'),
                options = [
                    { label: gt.pgettext('Tasks priority', 'None'), value: 'null' },
                    { label: gt.pgettext('Tasks priority', 'Low'), value: 1 },
                    { label: gt.pgettext('Tasks priority', 'Medium'), value: 2 },
                    { label: gt.pgettext('Tasks priority', 'High'), value: 3 }
                ], selectbox;
            this.$el.append(
                $('<label>').attr({
                    class: 'control-label',
                    for: guid
                }).text(gt.pgettext('Tasks', 'Priority')),
                $('<div>').append(
                    selectbox = new mini.SelectView({
                        list: options,
                        name: 'priority',
                        model: this.baton.model,
                        id: guid,
                        className: 'form-control'
                    }).render().$el
                )
            );
            if (!this.baton.model.get('priority')) {
                selectbox.find('option').first().attr('selected', 'selected');
            }
        }
    }, { row: '8' });

    //privateflag
    point.extend({
        id: 'private_flag',
        index: 1400,
        className: 'col-sm-3 collapsible',
        render: function () {

            // private flag only works in private folders
            var folder_id = this.model.get('folder_id');
            if (!folderAPI.pool.getModel(folder_id).is('private')) return;
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<fieldset>').append(
                    $('<legend class="simple">').text(gt('Type')),
                    new mini.CustomCheckboxView({ id: guid, name: 'private_flag', label: gt('Private'), model: this.model }).render().$el
                )
            );
        }
    }, { row: '8' });

    point.basicExtend({
        id: 'participants_list',
        index: 1600,
        row: '10',
        draw: function (baton) {
            this.append(
                new pViews.UserContainer({
                    collection: baton.model.getParticipants(),
                    baton: baton,
                    empty: gt('This task has no participants yet')
                }).render().$el.addClass('collapsible')
            );
        }
    });

    point.basicExtend({
        id: 'add_participant',
        index: 1700,
        className: 'row',
        row: '11',
        draw: function (baton) {
            var view = new AddParticipantView({
                apiOptions: {
                    contacts: true,
                    users: true,
                    groups: true,
                    resources: false,
                    distributionlists: true
                },
                placeholder: gt('Add contact') + ' \u2026',
                label: gt('Add contact'),
                collection: baton.model.getParticipants()
            });
            this.append(
                view.$el
            );
            view.render().$el.addClass('col-md-6 collapsible');
            view.$el.find('input.add-participant').addClass('task-participant-input-field');

            view.typeahead.on('typeahead-custom:dropdown-rendered', function () {

                var target = view.$el.find('.tt-dropdown-menu'),
                    container = target.scrollParent(),
                    pos = target.offset().top - container.offset().top;

                if (!target.is(':visible')) {
                    return;
                }

                if ((pos < 0) || (pos + target.height() > container.height())) {
                    // scroll to Node, leave 16px offset
                    container.scrollTop(container.scrollTop() + pos - 16);
                }
            });
        }
    });

    // Attachments

    // attachments label
    point.extend({
        id: 'attachments_legend',
        index: 1800,
        className: 'col-md-12 collapsible',
        render: function () {
            this.$el.append(
                $('<fieldset>').append(
                    $('<legend>').text(gt('Attachments'))
                )
            );
        }
    }, { row: '12' });

    point.extend(new attachments.EditableAttachmentList({
        id: 'attachment_list',
        registerAs: 'attachmentList',
        index: 1900,
        module: 4,
        className: 'collapsible',
        finishedCallback: function (model, id, errors) {
            var obj = {};
            obj.id = model.attributes.id || id;
            obj.folder_id = model.attributes.folder_id || model.attributes.folder;
            //show errors
            _(errors).each(function (error) {
                yell('error', error.error);
            });
            //no need to remove cachevalues if there was no upload
            if (api.uploadInProgress(_.ecid(obj))) {

                //make sure cache values are valid
                api.get(obj, false).done(function (data) {
                    $.when(
                        api.caches.get.add(data),
                        api.caches.list.merge(data).done(function (ok) {
                            if (ok) {
                                api.trigger('refresh.list');
                            }
                        })
                    ).done(function () {
                        api.removeFromUploadList(_.ecid(obj));
                    });
                });
            }
        }
    }), {
        row: '13'
    });

    point.basicExtend({
        id: 'attachment_upload',
        index: 2000,
        row: '14',
        draw: function (baton) {
            var guid = _.uniqueId('form-control-label-'),
                $node = $('<form class="attachments-form">').appendTo(this).attr('id', guid).addClass('col-sm-12 collapsible'),
                $inputWrap = attachments.fileUploadWidget(),
                $input = $inputWrap.find('input[type="file"]'),
                changeHandler = function (e) {
                    e.preventDefault();
                    if (_.browser.IE !== 9) {
                        _($input[0].files).each(function (fileData) {
                            baton.attachmentList.addFile(fileData);
                        });
                        //WORKAROUND "bug" in Chromium (no change event triggered when selecting the same file again,
                        //in file picker dialog - other browsers still seem to work)
                        $input[0].value = '';
                        $input.trigger('reset.fileupload');
                    } else if ($input.val()) {
                        //IE
                        var fileData = {
                            name: $input.val().match(/[^/\\]+$/),
                            size: 0,
                            hiddenField: $input
                        };
                        baton.attachmentList.addFile(fileData);
                        //hide input field with file
                        $input.addClass('add-attachment').hide();
                        //create new input field
                        $input = $('<input type="file" name="file">')
                            .on('change', changeHandler)
                            .appendTo($input.parent());
                    }
                    // look if the quota is exceeded
                    baton.model.validate();
                };
            $input.on('change', changeHandler);
            $inputWrap.on('change.fileupload', function () {
                //use bubbled event to add fileupload-new again (workaround to add multiple files with IE)
                $(this).find('div[data-provides="fileupload"]').addClass('fileupload-new').removeClass('fileupload-exists');
            });
            $node.append($('<div>').append($inputWrap));
        }
    });

    point.basicExtend({
        id: 'expand_detail_link',
        index: 2100,
        row: '15',
        draw: function (baton) {
            var text = gt('Hide details');
            if (baton.parentView.detailsCollapsed) {
                text = gt('Show details');
            }
            this.append(
                $('<div class="col-lg-12 collapsible">').append(
                    $('<button type="button" class="btn btn-link expand-details-link">').attr('aria-expanded', !baton.parentView.detailsCollapsed).text(text)
                    .on('click', function () {
                        baton.parentView.detailsCollapsed = !baton.parentView.detailsCollapsed;
                        baton.parentView.$el.toggleClass('details-expanded', !baton.parentView.detailsCollapsed);
                        $(this).attr('aria-expanded', !baton.parentView.detailsCollapsed).text((baton.parentView.detailsCollapsed ? gt('Show details') : gt('Hide details')));
                    })
                )
            );
        }
    });

    //estimated duration
    point.extend({
        id: 'target_duration',
        index: 2200,
        className: 'col-sm-6 task-edit-details',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label">').text(gt('Estimated duration in minutes')).attr({ for: guid }),
                new mini.InputView({ name: 'target_duration', model: this.model }).render().$el.attr({ id: guid }),
                new mini.ErrorView({ name: 'target_duration', model: this.model }).render().$el
            );
        }
    }, { row: '16' });

    //actual duration
    point.extend({
        id: 'actual_duration',
        index: 2300,
        className: 'col-sm-6 task-edit-details',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label">').text(gt('Actual duration in minutes')).attr({ for: guid }),
                new mini.InputView({ name: 'actual_duration', model: this.model }).render().$el.attr({ id: guid }),
                new mini.ErrorView({ name: 'actual_duration', model: this.model }).render().$el
            );
        }
    }, { row: '16' });

    //estimated costs
    point.extend({
        id: 'target_costs',
        index: 2400,
        className: 'col-sm-6 task-edit-details',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label">').text(gt('Estimated costs')).attr({ for: guid }),
                new mini.InputView({ name: 'target_costs', model: this.model }).render().$el.attr({ id: guid }),
                new mini.ErrorView({ name: 'target_costs', model: this.model }).render().$el
            );
        }
    }, { row: '17' });

    //actual costs
    point.extend({
        id: 'actual_costs',
        index: 2500,
        className: 'col-sm-4 task-edit-details',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label">').text(gt('Actual costs')).attr({ for: guid }),
                new mini.InputView({ name: 'actual_costs', model: this.model }).render().$el.attr({ id: guid }),
                new mini.ErrorView({ name: 'actual_costs', model: this.model }).render().$el
            );
        }
    }, { row: '17' });

    //currency
    point.extend({
        id: 'currency',
        index: 2600,
        className: 'col-sm-2 task-edit-details',
        render: function () {
            var guid = _.uniqueId('form-control-label-'),
                currencies = settings.get('currencies', ['CAD', 'CHF', 'DKK', 'EUR', 'GBP', 'JPY', 'PLN', 'RMB', 'RUB', 'SEK', 'USD']);

            // convenience: support string of comma separated values
            currencies = _.isString(currencies) ? currencies.split(',') : currencies;
            currencies.unshift('');
            this.$el.append(
                $('<label>').attr({
                    class: 'control-label',
                    for: guid
                }).text(gt('Currency')),
                $('<div>').append(
                    new mini.SelectView({
                        list: _.map(currencies, function (key) { return { label: key, value: key }; }),
                        name: 'currency',
                        model: this.baton.model,
                        id: guid,
                        className: 'form-control'
                    }).render().$el
                )
            );
        }
    }, { row: '17' });

    // distance
    point.extend({
        id: 'trip_meter',
        index: 2700,
        className: 'col-sm-12 task-edit-details',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label">').text(gt('Distance')).attr({ for: guid }),
                new mini.InputView({ name: 'trip_meter', model: this.model }).render().$el.attr({ id: guid })
            );
        }
    }, { row: '18' });

    // billing information
    point.extend({
        id: 'billing_information',
        index: 2800,
        className: 'col-sm-12 task-edit-details',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label">').text(gt('Billing information')).attr({ for: guid }),
                new mini.InputView({ name: 'billing_information', model: this.model }).render().$el.attr({ id: guid })
            );
        }
    }, { row: '19' });

    // companies
    point.extend({
        id: 'companies',
        index: 2900,
        className: 'col-sm-12 task-edit-details',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label">').text(gt('Companies')).attr({ for: guid }),
                new mini.InputView({ name: 'companies', model: this.model }).render().$el.attr({ id: guid })
            );
        }
    }, { row: '20' });

    // metrics
    point.extend({
        id: 'metrics',
        index: 3000,
        render: function () {
            var self = this;
            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;
                self.baton.app.getWindow().nodes.footer.on('mousedown', '[data-action]', function (e) {
                    var node =  $(e.target);
                    metrics.trackEvent({
                        app: 'tasks',
                        target: 'edit/toolbar',
                        type: 'click',
                        action: node.attr('data-action') || node.attr('data-name'),
                        detail: node.attr('data-value')
                    });
                });
                self.baton.app.getWindow().nodes.main.find('.file-input')
                    .on('change', function track() {
                        // metrics
                        require(['io.ox/metrics/main'], function (metrics) {
                            metrics.trackEvent({
                                app: 'tasks',
                                target: 'edit',
                                type: 'click',
                                action: 'add-attachment'
                            });
                        });
                    });
            });
        }
    });

    ext.point('io.ox/tasks/edit/dnd/actions').extend({
        id: 'attachment',
        index: 100,
        label: gt('Drop here to upload a <b class="dndignore">new attachment</b>'),
        multiple: function (files, app) {
            _(files).each(function (fileData) {
                app.view.baton.attachmentList.baton.attachmentList.addFile(fileData);
            });
            // ensure file representatives are visible
            if (app.view.baton.parentView.collapsed) app.view.$('.expand-link').trigger('click');
        }
    });
});
