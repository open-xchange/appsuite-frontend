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

define('io.ox/tasks/edit/view-template',
    ['gettext!io.ox/tasks/edit',
     'io.ox/backbone/views',
     'io.ox/core/date',
     'io.ox/core/notifications',
     'io.ox/backbone/forms',
     'io.ox/backbone/mini-views/datepicker',
     'io.ox/calendar/util',
     'io.ox/tasks/edit/util',
     'io.ox/calendar/edit/recurrence-view',
     'io.ox/participants/views',
     'io.ox/core/tk/attachments',
     'io.ox/tasks/api',
     'io.ox/core/extensions',
     'io.ox/tasks/util',
     'settings!io.ox/tasks'
    ], function (gt, views, date, notifications, forms, DatePicker, calendarUtil, util, RecurrenceView, pViews, attachments, api, ext, taskUtil, settings) {

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
                headline,
                saveBtn,
                app = baton.app;
            if (baton.model.attributes.id) {
                saveBtnText = gt('Save');
                headlineText = gt('Edit task');
            }
            this.append($('<div class="col-lg-12">').append(
                    headline = $('<h1 class="clear-title">').text(headlineText),
                    saveBtn = $('<button type="button" data-action="save" class="btn btn-primary task-edit-save">')
                        .text(saveBtnText)
                        .on('click', function () {
                            app.getWindow().busy();

                            // check if waiting for attachmenthandling is needed
                            var list = baton.attachmentList;
                            if (list && (list.attachmentsToAdd.length + list.attachmentsToDelete.length) > 0) {
                                //temporary indicator so the api knows that attachments need to be handled even if nothing else changes
                                baton.model.attributes.tempAttachmentIndicator = true;
                            }
                            //accept any formating
                            if (baton.model.get('actual_costs')) {
                                baton.model.set('actual_costs', (String(baton.model.get('actual_costs'))).replace(/,/g, '.'));
                            }
                            if (baton.model.get('target_costs')) {
                                baton.model.set('target_costs', (String(baton.model.get('target_costs'))).replace(/,/g, '.'));
                            }

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
                    ));

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

    point.extend(new forms.InputField({
        id: 'title',
        index: 200,
        className: 'col-sm-12',
        control: '<input type="text" class="title-field form-control" tabindex="1">',
        attribute: 'title',
        label: gt('Subject')
    }), {
        row: '1'
    });

    point.extend(new forms.InputField({
        id: 'note',
        index: 300,
        className: 'col-sm-12',
        control: '<textarea class="note-field form-control" tabindex="1">',
        attribute: 'note',
        label: gt('Description')
    }), {
        row: '2'
    });

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
                    attribute: 'start_date',
                    label: gt('Start date'),
                    clearButton: true
                }).render().$el.attr('data-extension-id', 'start_date')
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
                    attribute: 'end_date',
                    label: gt('Due date'),
                    clearButton: true
                }).render().$el.attr('data-extension-id', 'end_date')
            );
        }
    });

    point.extend(new RecurrenceView({
        id: 'recurrence',
        className: 'col-sm-12 collapsed',
        tabindex: 1,
        index: 700
    }), {
        row: '5'
    });

    //reminder selection
    point.basicExtend({
        id: 'alarm_select',
        index: 800,
        row: '6',
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
        index: 900,
        row: '6',
        draw: function (baton) {
            this.append(
                new DatePicker({
                    model: baton.model,
                    display: 'DATETIME',
                    className: 'col-xs-6 collapsed',
                    attribute: 'alarm',
                    label: gt('Reminder date'),
                    clearButton: true
                }).render().$el.attr('data-extension-id', 'alarm')
            );
        }
    });

    point.extend(new forms.SelectBoxField({
        id: 'status',
        index: 1000,
        className: 'col-sm-3 collapsed',
        render: function () {
            var self = this,
                guid = _.uniqueId('form-control-label-');
            this.nodes = {};
            this.nodes.select = $('<select tabindex="1">').addClass('status-selector form-control').attr('id', guid);
            _(this.selectOptions).each(function (label, value) {
                self.nodes.select.append(
                    $('<option>', {value: value}).text(label)
                );
            });
            this.$el.append($('<label for="' + guid + '">').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
            this.updateChoice();
            this.nodes.select.on('change', function () {
                if (self.nodes.select.prop('selectedIndex') === 0) {
                    self.model.set('percent_completed', 0, {validate: true});
                } else if (self.nodes.select.prop('selectedIndex') === 2) {
                    self.model.set('percent_completed', 100, {validate: true});
                } else if (self.nodes.select.prop('selectedIndex') === 1 && (self.model.get('percent_completed') === 0 || self.model.get('percent_completed') === 100)) {
                    self.model.set('percent_completed', 25, {validate: true});
                }

                self.model.set(self.attribute, parseInt(self.nodes.select.val(), 10), {validate: true});
            });
        },
        attribute: 'status',
        selectOptions: {
            1: gt('Not started'),
            2: gt('In progress'),
            3: gt('Done'),
            4: gt('Waiting'),
            5: gt('Deferred')
        },
        label: gt('Status')
    }), {
        row: '7'
    });

    point.basicExtend({
        id: 'progress',
        index: 1100,
        row: '7',
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
                                baton.model.set('status', 1, {validate: true});
                            } else if (progressField.progress.val() === '0' && baton.model.get('status') === 2) {
                                baton.model.set('status', 1, {validate: true});
                            } else if (progressField.progress.val() === '100' && baton.model.get('status') !== 3) {
                                baton.model.set('status', 3, {validate: true});
                            } else if (baton.model.get('status') === 3) {
                                baton.model.set('status', 2, {validate: true});
                            } else if (baton.model.get('status') === 1) {
                                baton.model.set('status', 2, {validate: true});
                            }
                            baton.model.set('percent_completed', value, {validate: true});
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

    point.extend(new forms.SelectBoxField({
        id: 'priority',
        index: 1200,
        className: 'col-sm-3 collapsed',
        render: function () {
            var self = this,
                guid = _.uniqueId('form-control-label-');
            this.nodes = {};
            this.nodes.select = $('<select tabindex="1">').addClass('priority-selector form-control').attr('id', guid);
            self.nodes.select.append(
                    $('<option>', {value: 'null'}).text(gt('None'))
                );
            _(this.selectOptions).each(function (label, value) {
                self.nodes.select.append(
                    $('<option>', {value: value}).text(label)
                );
            });
            this.$el.append($('<label for="' + guid + '">').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
            this.updateChoice();
            this.nodes.select.on('change', function () {
                self.model.set(self.attribute, self.nodes.select.val(), {validate: true});
            });
        },
        attribute: 'priority',
        selectOptions: {
            1: gt('Low'),
            2: gt('Medium'),
            3: gt('High')
        },
        label: gt('Priority')
    }), {
        row: '7'
    });

    point.extend(new forms.CheckBoxField({
        id: 'private_flag',
        index: 1300,
        labelClassName: 'private-flag',
        className: 'col-sm-3 collapsed',
        label: gt('Private'),
        attribute: 'private_flag'
    }), {
        row: '7'
    });

    point.extend(new forms.SectionLegend({
        id: 'participants_legend',
        className: 'col-md-12 collapsed',
        label: gt('Participants'),
        index: 1400
    }), {
        row: '8'
    });

    point.basicExtend({
        id: 'participants_list',
        index: 1500,
        row: '9',
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
        index: 1600,
        row: '10',
        draw: function (options) {
            var node = $('<div class="col-sm-6 collapsed">').appendTo(this),
                guid = _.uniqueId('form-control-label-');
            require(['io.ox/calendar/edit/view-addparticipants'], function (AddParticipantsView) {

                var collection = options.model.getParticipants();

                node.append(
                    $('<div class="input-group">').append(
                        $('<label class="sr-only">').text(gt('Add participant/resource')).attr('for', guid),
                        $('<input type="text" class="add-participant task-participant-input-field form-control">')
                        .attr({placeholder: gt('Add participant/resource'),
                               id: guid,
                               tabindex: 1}),
                        $('<span class="input-group-btn">').append(
                            $('<button type="button" class="btn btn-default" data-action="add" tabindex="1">')
                                .append(
                                    $('<i class="fa fa-plus" aria-hidden="true">'),
                                    $('<span class="sr-only">').text(gt('Plus'))
                                )
                        )
                    )
                );

                var autocomplete = new AddParticipantsView({el: node});
                autocomplete.render({
                    parentSelector: '.io-ox-tasks-edit',
                    //adding resources throws a backend error
                    resources: false
                });

                //add recipents to baton-data-node; used to filter sugestions list in view
                autocomplete.on('update', function () {
                    var baton = {list: []};
                    collection.any(function (item) {
                        //participant vs. organizer
                        var email = item.get('email1') || item.get('email2');
                        if (email !== null)
                            baton.list.push({email: email, id: item.get('user_id') || item.get('internal_userid') || item.get('id'), type: item.get('type')});
                    });
                    $.data(node, 'baton', baton);
                });

                autocomplete.on('select', function (data) {
                    var alreadyParticipant = false, obj,
                    userId;
                    alreadyParticipant = collection.any(function (item) {
                        if (data.type === 5) {
                            return (item.get('mail') === data.mail && item.get('type') === data.type) || (item.get('mail') === data.email1 && item.get('type') === data.type);
                        } else if (data.type === 1) {
                            return item.get('id') ===  data.internal_userid;
                        } else {
                            return (item.id === data.id && item.get('type') === data.type);
                        }
                    });
                    if (!alreadyParticipant) {
                        if (data.type !== 5) {

                            if (data.mark_as_distributionlist) {
                                _.each(data.distribution_list, function (val) {
                                    if (val.folder_id === 6) {
                                        calendarUtil.getUserIdByInternalId(val.id).done(function (id) {
                                            userId = id;
                                            obj = {id: userId, type: 1 };
                                            collection.add(obj);
                                        });
                                    } else {
                                        obj = {type: 5, mail: val.mail, display_name: val.display_name};
                                        collection.add(obj);
                                    }
                                });
                            } else {
                                collection.add(data);
                            }

                        } else {
                            obj = {type: data.type, mail: data.mail || data.email1, display_name: data.display_name, image1_url: data.image1_url || ''};
                            collection.add(obj);
                        }
                    }
                });
            });
        }
    });

    // Attachments

    point.extend(new forms.SectionLegend({
        id: 'attachments_legend',
        className: 'col-md-12 collapsed',
        label: gt('Attachments'),
        index: 1700
    }), {
        row: '11'
    });

    point.extend(new attachments.EditableAttachmentList({
        id: 'attachment_list',
        registerAs: 'attachmentList',
        index: 1800,
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
        row: '12'
    });

    point.basicExtend({
        id: 'attachment_upload',
        index: 1900,
        row: '13',
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
        index: 2000,
        row: '14',
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
    point.extend(new forms.InputField({
        id: 'target_duration',
        index: 2100,
        className: 'col-sm-6 task-edit-details',
        control: '<input type="text" class="target_duration form-control" id="task-edit-target-duration" tabindex="1">',
        attribute: 'target_duration',
        label: gt('Estimated duration in minutes')
    }), {
        row: '15'
    });

    point.extend(new forms.InputField({
        id: 'actual_duration',
        index: 2200,
        className: 'col-sm-6 task-edit-details',
        control: '<input type="text" class="actual_duration form-control" id="task-edit-actual-duration" tabindex="1">',
        attribute: 'actual_duration',
        label: gt('Actual duration in minutes')
    }), {
        row: '15'
    });

    //estimated costs
    point.extend(new forms.InputField({
        id: 'target_costs',
        index: 2300,
        className: 'col-sm-6 task-edit-details',
        control: '<input type="text" class="target_costs form-control" id="task-edit-target-costs" tabindex="1">',
        attribute: 'target_costs',
        label: gt('Estimated costs')
    }), {
        row: '16'
    });

    point.extend(new forms.InputField({
        id: 'actual_costs',
        index: 2400,
        className: 'col-sm-4 task-edit-details',
        control: '<input type="text" class="actual_costs form-control" id="task-edit-actual-costs" tabindex="1">',
        attribute: 'actual_costs',
        label: gt('Actual costs')
    }), {
        row: '16'
    });

    point.extend(new forms.SelectBoxField({
        id: 'currency',
        index: 2500,
        className: 'col-sm-2 task-edit-details',
        render: function () {
            var self = this;
            this.nodes = {};
            this.nodes.select = $('<select tabindex="1">').addClass('currency form-control').attr('id', 'task-edit-currency');

            //add empty currency
            self.nodes.select.append(
                    $('<option>', {value: ''})
                );
            _(this.selectOptions).each(function (value) {
                self.nodes.select.append(
                    $('<option>', {value: value}).text(_.noI18n(value))
                );
            });
            this.$el.append($('<label for="task-edit-currency">').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
            this.updateChoice();
            this.nodes.select.on('change', function () {
                self.model.set(self.attribute, self.nodes.select.val(), {validate: true});
            });
        },
        attribute: 'currency',
        selectOptions: settings.get('currencies', ['CAD', 'CHF', 'DKK', 'EUR', 'GBP', 'JPY', 'PLN', 'RMB', 'RUB', 'SEK', 'USD']),
        label: gt('Currency')
    }), {
        row: '16'
    });

    // distance
    point.extend(new forms.InputField({
        id: 'trip_meter',
        index: 2600,
        className: 'col-sm-12 task-edit-details',
        control: '<input type="text" class="trip-meter form-control" id="task-edit-trip-meter" tabindex="1">',
        attribute: 'trip_meter',
        label: gt('Distance')
    }), {
        row: '17'
    });

    point.extend(new forms.InputField({
        id: 'billing_information',
        index: 2700,
        className: 'col-sm-12 task-edit-details',
        control: '<input type="text" class="billing-information form-control" id="task-edit-billing-information" tabindex="1">',
        attribute: 'billing_information',
        label: gt('Billing information')
    }), {
        row: '18'
    });

    point.extend(new forms.InputField({
        id: 'companies',
        index: 2800,
        className: 'col-sm-12 task-edit-details',
        control: '<input type="text" class="companies form-control" id="task-edit-companies" tabindex="1">',
        attribute: 'companies',
        label: gt('Companies')
    }), {
        row: '19'
    });

    // bottom toolbar for mobile only
    ext.point('io.ox/tasks/edit/bottomToolbar').extend({
        id: 'toolbar',
        index: 2900,
        draw: function (baton) {
            // must be on a non overflow container to work with position:fixed
            var node = $(baton.app.attributes.window.nodes.body),
                save = baton.parentView.$el.find('.task-edit-save'),
                cancel = baton.parentView.$el.find('.task-edit-cancel');
            node.append($('<div class="app-bottom-toolbar">').append(save, cancel));
        }
    });

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
