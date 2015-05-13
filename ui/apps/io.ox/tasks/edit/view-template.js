/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/edit/view-template', [
    'gettext!io.ox/tasks/edit',
    'io.ox/backbone/views',
    'io.ox/core/notifications',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/datepicker',
    'io.ox/tasks/edit/util',
    'io.ox/calendar/edit/recurrence-view',
    'io.ox/participants/add',
    'io.ox/participants/views',
    'io.ox/core/tk/attachments',
    'io.ox/tasks/api',
    'io.ox/core/extensions',
    'io.ox/tasks/util',
    'settings!io.ox/tasks'
], function (gt, views, notifications, mini, DatePicker, util, RecurrenceView, AddParticipant, pViews, attachments, api, ext, taskUtil, settings) {

    'use strict';

    var point = views.point('io.ox/tasks/edit/view');

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

                        baton.model.save().done(function () {
                            app.markClean();
                            app.quit();
                        }).fail(function (response) {
                            setTimeout(function () {
                                app.getWindow().idle();
                                notifications.yell(response);
                            }, 300);
                        });

                    }),
                //cancel button
                $('<button type="button" data-action="discard" class="btn btn-default cancel task-edit-cancel">')
                    .text(gt('Discard'))
                    .on('click', function () { app.quit(); })
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
                new mini.InputView({ name: 'title', model: this.model }).render().$el.attr({ id: guid }).addClass('title-field')
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
                    $('<button type="button" tabindex="1" class="btn btn-link expand-link">').attr('aria-expanded', !baton.parentView.collapsed).text(text)
                    .on('click', function () {
                        if (baton.parentView.collapsed) {
                            baton.parentView.$el.find('.collapsed').show();
                            //if details were open, show them too
                            if (!baton.parentView.detailsCollapsed) {
                                baton.parentView.$el.find('.task-edit-details').show();
                            }
                        } else {
                            baton.parentView.$el.find('.collapsed').hide();
                            //if details were open, hide them too
                            if (!baton.parentView.detailsCollapsed) {
                                baton.parentView.$el.find('.task-edit-details').hide();
                            }
                        }
                        baton.parentView.collapsed = !baton.parentView.collapsed;
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
                    className: 'col-xs-6 collapsed',
                    attribute: 'start_time',
                    label: gt('Start date'),
                    clearButton: true,
                    display: baton.model.get('full_time') ? 'DATE' : 'DATETIME'
                }).listenTo(baton.model, 'change:full_time', function (model, fulltime) {
                    this.toggleTimeInput(!fulltime);
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
                    className: 'col-xs-6 collapsed',
                    attribute: 'end_time',
                    label: gt('Due date'),
                    clearButton: true,
                    display: baton.model.get('full_time') ? 'DATE' : 'DATETIME'
                }).listenTo(baton.model, 'change:full_time', function (model, fulltime) {
                    this.toggleTimeInput(!fulltime);
                }).render().$el.attr('data-extension-id', 'end_time')
            );
        }
    });

    // full time
    point.extend({
        id: 'full_time',
        index: 700,
        className: 'col-md-6 collapsed',
        render: function () {
            this.$el.append(
                $('<div>').addClass('checkbox').append(
                    $('<label class="control-label">').append(
                        new mini.CheckboxView({ name: 'full_time', model: this.model }).render().$el,
                        $.txt(gt('All day'))
                    )
                )
            );
        }
    }, { row: '5' });

    point.extend(new RecurrenceView({
        id: 'recurrence',
        className: 'col-sm-12 collapsed',
        tabindex: 1,
        index: 800
    }), { row: '6' });

    //reminder selection
    point.basicExtend({
        id: 'alarm_select',
        index: 900,
        row: '7',
        draw: function (baton) {
            var selector;
            this.append($('<div class="col-sm-6 collapsed">').append(
                    $('<label>').text(gt('Remind me')).attr('for', 'task-edit-reminder-select'), selector = $('<select tabindex="1">').attr('id', 'task-edit-reminder-select').addClass('form-control')
                    .append($('<option>')
                    .text(''), taskUtil.buildDropdownMenu())
                    .on('change', function () {
                        if (selector.prop('selectedIndex') === 0) {
                            baton.model.set('alarm', null, { validate: true });
                        } else {
                            baton.model.set('alarm', taskUtil.computePopupTime(selector.val()).alarmDate, { validate: true });
                        }
                    })
                )
            );
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
                    className: 'col-xs-6 collapsed',
                    attribute: 'alarm',
                    label: gt('Reminder date'),
                    clearButton: true
                }).render().$el.attr('data-extension-id', 'alarm')
            );
        }
    });

    // status
    point.extend({
        id: 'status',
        index: 1100,
        className: 'col-sm-3 collapsed',
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
                $('<label>').attr({
                    class: 'control-label',
                    for: guid
                }).text(gt('Status')),
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
            this.append($('<div class="col-sm-3 collapsed">')
                .append(
                     $('<label>').text(gt('Progress in %')).attr('for', 'task-edit-progress-field'), $(progressField.wrapper)
                    .val(baton.model.get('percent_completed'))
                    .on('change', function () {
                        var value = parseInt(progressField.progress.val(), 10);
                        if (value !== 'NaN' && value >= 0 && value <= 100) {
                            if (progressField.progress.val() === '') {
                                progressField.progress.val(0);
                                baton.model.set('status', 1, { validate: true });
                            } else if (progressField.progress.val() === '0' && baton.model.get('status') === 2) {
                                baton.model.set('status', 1, { validate: true });
                            } else if (progressField.progress.val() === '100' && baton.model.get('status') !== 3) {
                                baton.model.set('status', 3, { validate: true });
                            } else if (baton.model.get('status') === 3) {
                                baton.model.set('status', 2, { validate: true });
                            } else if (baton.model.get('status') === 1) {
                                baton.model.set('status', 2, { validate: true });
                            }
                            baton.model.set('percent_completed', value, { validate: true });
                        } else {
                            notifications.yell('error', gt('Please enter value between 0 and 100.'));
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
        className: 'col-sm-3 collapsed',
        render: function () {
            var guid = _.uniqueId('form-control-label-'),
                options = [
                    { label: gt('None'), value: 'null' },
                    { label: gt('Low'), value: 1 },
                    { label: gt('Medium'), value: 2 },
                    { label: gt('High'), value: 3 }
                ];
            this.$el.append(
                $('<label>').attr({
                    class: 'control-label',
                    for: guid
                }).text(gt('Priority')),
                $('<div>').append(
                    new mini.SelectView({
                        list: options,
                        name: 'priority',
                        model: this.baton.model,
                        id: guid,
                        className: 'form-control'
                    }).render().$el
                )
            );
        }
    }, { row: '8' });

    //privateflag
    point.extend({
        id: 'private_flag',
        index: 1400,
        className: 'checkbox col-sm-3 collapsed',
        render: function () {
            this.$el.append(
                $('<fieldset>').append(
                    $('<legend>').addClass('simple').text(gt('Type')),
                    $('<label class="checkbox-inline control-label">').append(
                        new mini.CheckboxView({ name: 'private_flag', model: this.model }).render().$el,
                        $.txt(gt('Private'))
                    )
                )
            );
        }
    }, { row: '8' });

    // participants label
    point.extend({
        id: 'participants_legend',
        index: 1500,
        className: 'col-md-12 collapsed',
        render: function () {
            this.$el.append(
                $('<fieldset>').append(
                    $('<legend>').text(gt('Participants')).addClass('find-free-time')
                )
            );
        }
    }, { row: '9' });

    point.basicExtend({
        id: 'participants_list',
        index: 1600,
        row: '10',
        draw: function (baton) {
            this.append(
                new pViews.UserContainer({
                    collection: baton.model.getParticipants(),
                    baton: baton,
                    className: 'participantsrow col-xs-12 collapsed'
                }).render().$el
            );
        }
    });

    point.basicExtend({
        id: 'add_participant',
        index: 1700,
        row: '11',
        draw: function (baton) {
            var typeahead = new AddParticipant({
                placeholder: gt('Add participant/resource'),
                label: gt('Add participant/resource'),
                collection: baton.model.getParticipants()
            });
            this.append(
                typeahead.$el
            );
            typeahead.render().$el.addClass('col-xs-12 collapsed');
        }
    });

    // Attachments

    // attachments label
    point.extend({
        id: 'attachments_legend',
        index: 1800,
        className: 'col-md-12 collapsed',
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
        className: 'collapsed',
        finishedCallback: function (model, id, errors) {
            var obj = {};
            obj.id = model.attributes.id || id;
            obj.folder_id = model.attributes.folder_id || model.attributes.folder;
            //show errors
            _(errors).each(function (error) {
                notifications.yell('error', error.error);
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
                $node = $('<form class="attachments-form">').appendTo(this).attr('id', guid).addClass('col-sm-12 collapsed'),
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
                    } else {
                        //IE
                        if ($input.val()) {
                            var fileData = {
                                name: $input.val().match(/[^\/\\]+$/),
                                size: 0,
                                hiddenField: $input
                            };
                            baton.attachmentList.addFile(fileData);
                            //hide input field with file
                            $input.addClass('add-attachment').hide();
                            //create new input field
                            $input = $('<input>', { type: 'file', name: 'file', tabindex: 1 })
                                    .on('change', changeHandler)
                                    .appendTo($input.parent());
                        }
                    }
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
                $('<div class="col-lg-12 collapsed">').append(
                    $('<button tabindex="1" class="btn btn-link expand-details-link">').attr('aria-expanded', !baton.parentView.detailsCollapsed).text(text)
                    .on('click', function () {
                        baton.parentView.$el.find('.task-edit-details').toggle();
                        baton.parentView.detailsCollapsed = !baton.parentView.detailsCollapsed;
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
                new mini.InputView({ name: 'target_duration', model: this.model }).render().$el.attr({ id: guid })
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
                new mini.InputView({ name: 'actual_duration', model: this.model }).render().$el.attr({ id: guid })
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
                new mini.InputView({ name: 'target_costs', model: this.model }).render().$el.attr({ id: guid })
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
                new mini.InputView({ name: 'actual_costs', model: this.model }).render().$el.attr({ id: guid })
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

    ext.point('io.ox/tasks/edit/dnd/actions').extend({
        id: 'attachment',
        index: 100,
        label: gt('Drop here to upload a <b class="dndignore">new attachment</b>'),
        multiple: function (files, view) {
            _(files).each(function (fileData) {
                view.baton.attachmentList.addFile(fileData);
            });

        }
    });
});
