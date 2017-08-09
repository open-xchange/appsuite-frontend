/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/calendar/edit/extensions', [
    'io.ox/core/extensions',
    'gettext!io.ox/calendar/edit/main',
    'io.ox/calendar/util',
    'io.ox/calendar/chronos-util',
    'io.ox/contacts/util',
    'io.ox/mail/util',
    'io.ox/core/util',
    'io.ox/backbone/views',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/datepicker',
    'io.ox/core/tk/attachments',
    'io.ox/backbone/views/recurrence-view',
    'io.ox/backbone/mini-views/alarms',
    'io.ox/calendar/chronos-api',
    'io.ox/participants/add',
    'io.ox/participants/chronos-views',
    'io.ox/core/capabilities',
    'io.ox/core/folder/picker',
    'io.ox/core/folder/api',
    'settings!io.ox/chronos',
    'settings!io.ox/core',
    'io.ox/calendar/color-picker',
    'less!io.ox/calendar/style'
], function (ext, gt, calendarUtil, chronosUtil, contactUtil, mailUtil, coreUtil, views, mini, DatePicker, attachments, RecurrenceView, AlarmsView, api, AddParticipantView, pViews, capabilities, picker, folderAPI, settings, coreSettings, ColorPicker) {

    'use strict';

    var point = views.point('io.ox/calendar/edit/section');

    point.basicExtend({
        id: 'header',
        index: 10,
        draw: function (baton) {
            var headerCol = $('<div class="header">');
            ext.point('io.ox/calendar/edit/section/title').invoke('draw', headerCol, baton);
            ext.point('io.ox/calendar/edit/section/buttons').invoke('draw', headerCol, baton);
            baton.app.getWindow().setHeader(headerCol);
        }
    });

    // pane title and button area
    ext.point('io.ox/calendar/edit/section/title').extend({
        index: 100,
        id: 'title',
        draw: function (baton) {
            this.append($('<h1>').addClass('sr-only').text(baton.mode === 'edit' ? gt('Edit appointment') : gt('Create appointment')));
        }// jkmrftjtk
    });

    // buttons
    ext.point('io.ox/calendar/edit/section/buttons').extend({
        index: 100,
        id: 'save',
        draw: function (baton) {
            var oldFolder = baton.model.get('folder');
            this.append($('<button type="button" class="btn btn-primary save" data-action="save">')
                .text(baton.mode === 'edit' ? gt('Save') : gt('Create'))
                .on('click', function () {
                    var save = _.bind(baton.app.onSave || _.noop, baton.app),
                        fail = _.bind(baton.app.onError || _.noop, baton.app),
                        folder = baton.model.get('folder'),
                        inputfieldVal = baton.parentView.$el.find('.add-participant.tt-input').val();

                    // check if attachments have changed
                    if (baton.attachmentList.attachmentsToDelete.length > 0) {
                        // attachments can be deleted without the need of another api call
                        baton.model.set('attachments', _(baton.model.get('attachments')).difference(baton.attachmentList.attachmentsToDelete));
                        baton.attachmentList.attachmentsToDelete = [];
                    }
                    if (baton.attachmentList.attachmentsToAdd.length > 0) {
                        //temporary indicator so the api knows that attachments needs to be handled even if nothing else changes
                        baton.model.attributes.tempAttachmentIndicator = true;
                    }

                    if (oldFolder !== folder && baton.mode === 'edit') {
                        baton.model.set({ 'folder': oldFolder }, { silent: true });
                        // actual moving is done in the app.onSave method, because this method is also called after confirming conflicts, so we don't need duplicated code
                        baton.app.moveAfterSave = folder;
                    }

                    // check if participants inputfield contains a valid email address
                    if (!_.isEmpty(inputfieldVal.replace(/\s*/, '')) && coreUtil.isValidMailAddress(inputfieldVal)) {
                        baton.model._attendees.add(
                            new baton.model._attendees.model({
                                cuType: 'INDIVIDUAL',
                                cn: mailUtil.parseRecipient(inputfieldVal)[0],
                                partStat: 'NEEDS-ACTION',
                                email: mailUtil.parseRecipient(inputfieldVal)[1],
                                uri: 'mailto:' + mailUtil.parseRecipient(inputfieldVal)[1],
                                comment: ''
                            })
                        );
                    }

                    if (!baton.model.isValid({ isSave: true })) return;

                    baton.app.getWindow().busy();

                    if (baton.mode === 'edit') {
                        api.update(baton.model).then(save, fail);
                        return;
                    }
                    api.create(baton.model).then(save, fail);
                })
            );

        }
    });

    ext.point('io.ox/calendar/edit/section/buttons').extend({
        index: 200,
        id: 'discard',
        draw: function (baton) {
            this.append($('<button type="button" class="btn btn-default discard" data-action="discard" >')
                .text(gt('Discard'))
                .on('click', function (e) {
                    e.stopPropagation();
                    baton.app.quit();
                })
            );
        }
    });

    ext.point('io.ox/calendar/edit/section/buttons').extend({
        id: 'metrics',
        draw: function () {
            var self = this;
            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;
                self.on('mousedown', '[data-action]', function (e) {
                    var node =  $(e.target);
                    metrics.trackEvent({
                        app: 'calendar',
                        target: 'edit/toolbar',
                        type: 'click',
                        action: node.attr('data-action') || node.attr('data-name'),
                        detail: node.attr('data-value')
                    });
                });
            });
        }
    });

    var CalendarSelectionView = mini.AbstractView.extend({
        tagName: 'div',
        className: 'header-right',
        events: {
            'click a': 'onSelect'
        },
        setup: function () {
            this.listenTo(this.model, 'change:folder', this.render);
        },
        onSelect: function () {
            var self = this;

            picker({
                async: true,
                button: gt('Select'),
                filter: function (id, model) {
                    return model.id !== 'virtual/all-my-appointments';
                },
                flat: true,
                indent: false,
                module: 'calendar',
                persistent: 'folderpopup',
                root: '1',
                settings: settings,
                title: gt('Select folder'),
                folder: this.model.get('folder'),

                done: function (id) {
                    self.model.set('folder', id);
                },

                disable: function (data, options) {
                    var create = folderAPI.can('create', data);
                    return !create || (options && /^virtual/.test(options.folder));
                }
            });
        },
        render: function () {
            var link = $('<a href="#">'),
                folderId = this.model.get('folder');

            folderAPI.get(folderId).done(function (folder) {
                link.text(folder.display_title || folder.title);
            });

            this.$el.empty().append(
                $('<span>').text(gt('Calendar:')),
                link
            );

            return this;
        }
    });

    ext.point('io.ox/calendar/edit/section/buttons').extend({
        index: 1000,
        id: 'folder-selection',
        draw: function (baton) {
            this.append(
                new CalendarSelectionView({ model: baton.model }).render().$el
            );
        }
    });

    // title
    point.extend({
        id: 'title',
        index: 200,
        render: function () {
            var self = this, input, guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label col-xs-12">').attr('for', guid).append(
                    $.txt(gt('Subject')),
                    input = new mini.InputView({ id: guid, name: 'summary', model: self.model, mandatory: true }).render().$el,
                    new mini.ErrorView({ name: 'summary', model: self.model }).render().$el
                )
            );
            input.on('keyup', function () {
                // update title on keyup
                self.model.trigger('keyup:summary', $(this).val());
            });
        }
    });

    // location input
    point.extend({
        id: 'location',
        index: 300,
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label col-xs-12">').attr('for', guid).append(
                    $.txt(gt('Location')),
                    // only trim on save
                    new mini.InputView({ id: guid, name: 'location', model: this.model }).render().$el
                )
            );
        }
    });

    function openTimezoneDialog() {
        var model = this.model;

        require(['io.ox/calendar/edit/timezone-dialog'], function (dialog) {
            dialog.open({ model: model });
        });
    }

    // start date
    point.basicExtend({
        id: 'start-date',
        index: 400,
        draw: function (baton) {
            this.append(
                new DatePicker({
                    model: baton.model,
                    className: 'col-xs-6',
                    display: baton.model.get('allDay') ? 'DATE' : 'DATETIME',
                    attribute: 'startDate',
                    label: gt('Starts on'),
                    timezoneButton: true,
                    closeOnScroll: true,
                    a11y: {
                        timeLabel: gt('Start time')
                    },
                    chronos: true
                }).listenTo(baton.model, 'change:allDay', function (model, fulltime) {
                    this.toggleTimeInput(!fulltime);
                }).on('click:timezone', openTimezoneDialog, baton)
                    .on('click:time', function () {
                        var target = this.$el.find('.dropdown-menu.calendaredit'),
                            container = target.scrollParent(),
                            pos = target.offset().top - container.offset().top;

                        if ((pos < 0) || (pos + target.height() > container.height())) {
                            // scroll to Node, leave 16px offset
                            container.scrollTop(container.scrollTop() + pos - 16);
                        }

                    }).render().$el
            );
        }
    });

    // end date
    point.basicExtend({
        id: 'end-date',
        index: 500,
        nextTo: 'start-date',
        draw: function (baton) {
            this.append(
                new DatePicker({
                    model: baton.model,
                    className: 'col-xs-6',
                    display: baton.model.get('allDay') ? 'DATE' : 'DATETIME',
                    attribute: 'endDate',
                    label: gt('Ends on'),
                    timezoneButton: true,
                    closeOnScroll: true,
                    a11y: {
                        timeLabel: gt('End time')
                    },
                    chronos: true
                }).listenTo(baton.model, 'change:allDay', function (model, fulltime) {
                    this.toggleTimeInput(!fulltime);
                }).on('click:timezone', openTimezoneDialog, baton)
                    .on('click:time', function () {
                        var target = this.$el.find('.dropdown-menu.calendaredit'),
                            container = target.scrollParent(),
                            pos = target.offset().top - container.offset().top;

                        if ((pos < 0) || (pos + target.height() > container.height())) {
                            // scroll to Node, leave 16px offset
                            container.scrollTop(container.scrollTop() + pos - 16);
                        }

                    }).render().$el
            );
        }
    });

    // timezone hint
    point.extend({
        id: 'timezone-hint',
        index: 550,
        nextTo: 'end-date',
        render: function () {
            var appointmentTimezoneAbbr = moment.tz(this.model.get('startDate').tzid).zoneAbbr(),
                userTimezoneAbbr = moment.tz(coreSettings.get('timezone')).zoneAbbr();

            if (appointmentTimezoneAbbr === userTimezoneAbbr) return;

            this.$el.append($('<div class="col-xs-12 help-block">').text(
                //#. %1$s timezone abbreviation of the appointment
                //#. %2$s default user timezone
                gt('The timezone of this appointment (%1$s) differs from your default timezone (%2$s).', appointmentTimezoneAbbr, userTimezoneAbbr)
            ));
        }
    });

    // full time
    point.extend({
        id: 'full_time',
        index: 600,
        className: 'col-sm-6',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                new mini.CustomCheckboxView({ id: guid, name: 'allDay', label: gt('All day'), model: this.model }).render().$el
            );
        }
    });

    // find free time link
    point.basicExtend({
        id: 'find-free-time-1',
        index: 650,
        nextTo: 'full_time',
        draw: function () {
            this.append(
                $('<div class="hidden-xs col-sm-6 find-free-time"></div>')
            );
        }
    });

    // move recurrence view to collapsible area on mobile devices
    var recurrenceIndex = _.device('smartphone') ? 950 : 650;
    // recurrence
    point.extend({
        id: 'recurrence',
        className: 'col-xs-12',
        index: recurrenceIndex,
        render: function () {
            this.$el.append(new RecurrenceView({
                model: this.model
            }).render().$el);
        }
    }, {
        rowClass: 'collapsed'
    });

    // note
    point.extend({
        id: 'note',
        index: 700,
        className: 'col-xs-12',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label">').text(gt('Description')).attr({ for: guid }),
                new mini.TextView({ name: 'description', model: this.model }).render().$el.attr({ id: guid }).addClass('note')
            );
        }
    });

    // separator or toggle
    point.basicExtend({
        id: 'noteSeparator',
        index: 750,
        draw: function (baton) {
            this.append(
                $('<a href="#">')
                    .text(gt('Expand form'))
                    .addClass('btn btn-link actionToggle')
                    .on('click', function (e) {
                        e.preventDefault();
                        if (baton.parentView.collapsed) {
                            $('.row.collapsed', baton.parentView.$el).css('display', '');
                            $(this).text(gt('Expand form'));
                        } else {
                            $('.row.collapsed', baton.parentView.$el).show();
                            $(this).text(gt('Collapse form'));
                        }
                        baton.parentView.collapsed = !baton.parentView.collapsed;
                    })
            );
        }
    });

    // shown as
    point.extend({
        id: 'shown_as',
        className: 'col-md-6',
        index: 800,
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<div class="checkbox">').append(
                    $('<label class="control-label">').attr('for', guid).append(
                        new mini.CheckboxView({ id: guid, name: 'transp', model: this.model, customValues: { 'false': 'OPAQUE', 'true': 'TRANSPARENT' }, defaultVal: 'OPAQUE' }).render().$el,
                        $.txt(gt('Show as free'))//#. Describes how a appointment is shown in the calendar
                    )
                )
            );
        }
    }, {
        rowClass: 'collapsed form-spacer'
    });

    //color selection
    point.extend({
        id: 'color',
        index: 900,
        className: 'col-md-6',
        render: function () {

            if (settings.get('colorScheme') !== 'custom') return;

            var picker = new ColorPicker({
                model: this.model,
                attribute: 'color',
                noColorOption: true,
                additionalColor: this.model.get('color') ? {
                    value: this.model.get('color'),
                    foreground: calendarUtil.getForegroundColor(this.model.get('color'))
                } : undefined
            });

            this.$el.append(
                picker.render().$el
            );

            function onChangeClass() {
                var elem = picker.$('.no-color .box');
                if (calendarUtil.isPrivate(picker.model)) {
                    elem.css({
                        'background-color': '#666',
                        color: '#fff'
                    });
                } else {
                    elem.css({
                        'background-color': '#fff',
                        color: '#000'
                    });
                }
            }
            picker.listenTo(this.model, 'change:class', onChangeClass);
            onChangeClass();
        }
    }, {
        rowClass: 'collapsed'
    });

    // private checkbox
    point.extend({
        id: 'private_flag',
        index: 1000,
        className: 'col-md-6',
        render: function () {

            // private flag only works in private folders
            var folder = this.model.get('folder');
            if (!folderAPI.pool.getModel(folder).is('private')) return;

            this.$el.append(
                $('<fieldset>').append(
                    $('<legend class="simple">').text(gt('Type')),
                    new mini.CustomCheckboxView({ label: gt('Private'), name: 'class', model: this.model, customValues: { 'false': 'PUBLIC', 'true': 'CONFIDENTIAL' }, defaultVal: 'PUBLIC' }).render().$el
                )
            );
        }
    }, {
        nextTo: 'color',
        rowClass: 'collapsed'
    });

    // alarms
    point.extend({
        id: 'alarms',
        index: 1100,
        className: 'col-md-12',
        render: function () {
            this.$el.append(
                $('<fieldset>').append(
                    $('<legend>').text(gt('Reminder')),
                    new AlarmsView({ model: this.model }).render().$el
                )
            );
        }
    }, {
        rowClass: 'collapsed form-spacer'
    });

    // participants container
    point.basicExtend({
        id: 'participants_list',
        index: 1400,
        rowClass: 'collapsed form-spacer',
        draw: function (baton) {
            this.append(new pViews.UserContainer({
                collection: baton.model.getAttendees(),
                baton: baton
            }).render().$el);
        }
    });

    // add participants view
    point.basicExtend({
        id: 'add-participant',
        index: 1500,
        rowClass: 'collapsed',
        draw: function (baton) {

            var typeahead = new AddParticipantView({
                apiOptions: {
                    contacts: true,
                    users: true,
                    groups: true,
                    resources: true,
                    distributionlists: true
                },
                convertToAttendee: true,
                collection: baton.model.getAttendees(),
                blacklist: settings.get('participantBlacklist') || false,
                scrollIntoView: true
            });

            this.append(typeahead.$el);
            typeahead.render().$el.addClass('col-md-6');
        }
    });

    // email notification
    point.extend({
        id: 'notify',
        index: 1510,
        className: 'col-md-6',
        render: function () {
            this.$el.append(
                new mini.CustomCheckboxView({ label: gt('Notify all participants by email.'), name: 'notification', model: this.model }).render().$el
            );
        }
    }, {
        nextTo: 'add-participant',
        rowClass: 'collapsed'
    });

    // Attachments

    // attachments label
    point.extend({
        id: 'attachments_legend',
        index: 1600,
        className: 'col-md-12',
        render: function () {
            this.$el.append(
                $('<fieldset>').append(
                    $('<legend>').text(gt('Attachments'))
                )
            );
        }
    }, {
        rowClass: 'collapsed form-spacer'
    });

    point.extend(new attachments.EditableAttachmentList({
        id: 'attachment_list',
        registerAs: 'attachmentList',
        className: 'div',
        index: 1700,
        module: 'chronos',
        finishedCallback: function (model, id) {
            var obj = model.attributes;
            //new objects have no id in model yet
            obj.id = id || model.attributes.id;
            obj.folder_id = model.attributes.folder_id || model.attributes.folder;
            api.attachmentCallback(obj);
        }
    }), {
        rowClass: 'collapsed'
    });

    point.basicExtend({
        id: 'attachments_upload',
        index: 1800,
        rowClass: 'collapsed',
        draw: function (baton) {
            var guid = _.uniqueId('form-control-label-'),
                $node = $('<form class="attachments-form">').appendTo(this).attr('id', guid),
                $inputWrap = attachments.fileUploadWidget({ multi: true }),
                $input = $inputWrap.find('input[type="file"]'),
                changeHandler = function (e) {
                    e.preventDefault();
                    _($input[0].files).each(function (fileData) {
                        baton.attachmentList.addFile(fileData);
                    });
                    //WORKAROUND "bug" in Chromium (no change event triggered when selecting the same file again,
                    //in file picker dialog - other browsers still seem to work)
                    $input[0].value = '';
                    $input.trigger('reset.fileupload');
                    // look if the quota is exceeded
                    baton.model.on('invalid:quota_exceeded', function (messages) {
                        require(['io.ox/core/yell'], function (yell) {
                            yell('error', messages[0]);
                        });
                    });
                    baton.model.validate();
                    // turn of again to prevent double yells on save
                    baton.model.off('invalid:quota_exceeded');
                };
            $input.on('change', changeHandler);
            $inputWrap.on('change.fileupload', function () {
                //use bubbled event to add fileupload-new again (workaround to add multiple files with IE)
                $(this).find('div[data-provides="fileupload"]').addClass('fileupload-new').removeClass('fileupload-exists');
            });
            $node.append($('<div>').addClass('col-md-12').append($inputWrap));
        }
    });

    point.basicExtend({
        id: 'attachments_upload_metrics',
        draw: function () {
            var self = this;
            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;
                self.parent()
                    .find('.file-input')
                    .on('change', function track() {
                        // metrics
                        metrics.trackEvent({
                            app: 'calendar',
                            target: 'edit',
                            type: 'click',
                            action: 'add-attachment'
                        });
                    });
            });
        }
    });

    ext.point('io.ox/calendar/edit/dnd/actions').extend({
        id: 'attachment',
        index: 10,
        label: gt('Drop here to upload a <b class="dndignore">new attachment</b>'),
        multiple: function (files, app) {
            _(files).each(function (fileData) {
                app.view.baton.attachmentList.addFile(fileData);
            });
        }
    });

    function openFreeBusyView(e) {
        require(['io.ox/calendar/freetime/main'], function (freetime) {
            //#. Applies changes to an existing appointment, used in scheduling view
            freetime.showDialog({ label: gt('Apply changes'), parentModel: e.data.model }).done(function (data) {
                var view = data.view;
                data.dialog.on('save', function () {
                    var appointment = view.createAppointment();

                    if (appointment) {
                        data.dialog.close();
                        // make sure we have correct dates. Do not change dates if a date is NaN
                        var validDate = !(_.isNaN(appointment.startDate) || _.isNaN(appointment.endDate));

                        if (validDate) {
                            e.data.model.set({ allDay: appointment.allDay });
                            e.data.model.set({ startDate: appointment.startDate });
                        }

                        e.data.model.getAttendees().reset(appointment.attendees);
                        // set end_date in a seperate call to avoid the appointment model applyAutoLengthMagic (Bug 27259)
                        if (validDate) {
                            e.data.model.set({
                                endDate: appointment.endDate
                            }, { validate: true });
                        }
                    } else {
                        data.dialog.idle();
                        require(['io.ox/core/yell'], function (yell) {
                            yell('info', gt('Please select a time for the appointment'));
                        });
                    }
                });
            });
        });
    }

    // link free/busy view
    point.basicExtend({
        id: 'link-free-busy',
        index: 100000,
        draw: function (baton) {
            // because that works
            if (capabilities.has('freebusy !alone')) {
                this.parent().find('.find-free-time').append(
                    $('<button type="button" class="btn btn-link">').text(gt('Find a free time'))
                        .on('click', { app: baton.app, model: baton.model }, openFreeBusyView)
                );
            }
        }
    });

    if (!coreSettings.get('features/PIMAttachments', capabilities.has('filestore'))) {
        ext.point('io.ox/calendar/edit/section')
            .disable('attachments_legend')
            .disable('attachments_upload');
    }

    return null;
});
