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
    'io.ox/contacts/util',
    'io.ox/mail/util',
    'io.ox/core/util',
    'io.ox/backbone/views',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/datepicker',
    'io.ox/core/tk/attachments',
    'io.ox/backbone/views/recurrence-view',
    'io.ox/backbone/mini-views/alarms',
    'io.ox/calendar/api',
    'io.ox/participants/add',
    'io.ox/participants/chronos-views',
    'io.ox/core/capabilities',
    'io.ox/core/folder/picker',
    'io.ox/core/folder/api',
    'settings!io.ox/calendar',
    'settings!io.ox/core',
    'io.ox/calendar/color-picker',
    'less!io.ox/calendar/style'
], function (ext, gt, calendarUtil, contactUtil, mailUtil, coreUtil, views, mini, DatePicker, attachments, RecurrenceView, AlarmsView, api, AddParticipantView, pViews, capabilities, picker, folderAPI, settings, coreSettings, ColorPicker) {

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
        }
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
                        attachments = [],
                        inputfieldVal = baton.parentView.$el.find('.add-participant.tt-input').val(),
                        sendNotifications = baton.app.get('sendInternalNotifications');

                    // check if attachments have changed
                    if (baton.attachmentList.attachmentsToDelete.length > 0) {
                        baton.model.set('attachments', _(baton.model.get('attachments')).difference(baton.attachmentList.attachmentsToDelete));
                        baton.attachmentList.attachmentsToDelete = [];
                    }
                    if (baton.attachmentList.attachmentsToAdd.length > 0) {
                        attachments = attachments.concat(baton.attachmentList.attachmentsToAdd);
                    }

                    if (oldFolder !== folder && baton.mode === 'edit') {
                        baton.model.set({ 'folder': oldFolder }, { silent: true });
                        // actual moving is done in the app.onSave method, because this method is also called after confirming conflicts, so we don't need duplicated code
                        baton.app.moveAfterSave = folder;
                    }
                    // correct time for allday appointments (remove timezone and add 1 day to enddate)
                    if (calendarUtil.isAllday(baton.model)) {
                        // save unchanged dates, so they can be restored on error or when handling conflicts
                        baton.parentView.tempEndDate = baton.model.get('endDate');
                        baton.parentView.tempStartDate = baton.model.get('startDate');
                        baton.model.set('endDate', { value: moment(baton.model.get('endDate').value).add(1, 'days').format('YYYYMMDD') }, { silent: true });
                        baton.model.set('startDate', { value: moment(baton.model.get('startDate').value).format('YYYYMMDD') }, { silent: true });
                    }

                    // save attachment data to model
                    if (attachments.length) {
                        var attachmentData = [];
                        _(attachments).each(function (attachment) {
                            attachmentData.push({
                                filename: attachment.filename,
                                fmtType: attachment.file.type,
                                uri: 'cid:' + 'file_' + attachment.cid
                            });
                        });
                        // add already uploaded attachments (you can distinguish them as they have no uri but a managedId)
                        attachmentData = attachmentData.concat(_(baton.model.get('attachments')).filter(function (att) { return att.managedId !== undefined; }) || []);
                        baton.model.set('attachments', attachmentData, { silent: true });
                    }

                    // check if participants inputfield contains a valid email address
                    if (!_.isEmpty(inputfieldVal.replace(/\s*/, '')) && coreUtil.isValidMailAddress(inputfieldVal)) {
                        baton.model._attendees.add(
                            new baton.model._attendees.model({
                                cuType: 'INDIVIDUAL',
                                cn: mailUtil.parseRecipient(inputfieldVal)[0],
                                partStat: 'NEEDS-ACTION',
                                email: mailUtil.parseRecipient(inputfieldVal)[1],
                                uri: 'mailto:' + mailUtil.parseRecipient(inputfieldVal)[1]
                            })
                        );
                    }

                    if (!baton.model.isValid({ isSave: true })) return;

                    baton.app.getWindow().busy();
                    // needed, so the formdata can be attached when selecting ignore conflicts in the conflict dialog
                    baton.app.attachmentsFormData = attachments;
                    if (baton.mode === 'edit') {
                        var options = _.extend(calendarUtil.getCurrentRangeOptions(), {
                            recurrenceRange: baton.model.mode === 'thisandfuture' ? 'THISANDFUTURE' : undefined,
                            attachments: attachments,
                            checkConflicts: true,
                            sendInternalNotifications: sendNotifications
                        });
                        api.update(baton.model, options).then(save, fail);
                        return;
                    }

                    api.create(baton.model, _.extend(calendarUtil.getCurrentRangeOptions(), { attachments: attachments, checkConflicts: true, sendInternalNotifications: sendNotifications })).then(save, fail);
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
                flat: true,
                indent: false,
                module: 'calendar',
                persistent: 'folderpopup',
                root: '1',
                settings: settings,
                title: gt('Select calendar'),
                createFolderText: gt('Create new calendar'),
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
            baton.parentView.startDatePicker = new DatePicker({
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
            }).listenTo(baton.model, 'change:startDate', function (model) {
                this.toggleTimeInput(!calendarUtil.isAllday(model));
            }).on('click:timezone', openTimezoneDialog, baton)
                .on('click:time', function () {
                    var target = this.$el.find('.dropdown-menu.calendaredit'),
                        container = target.scrollParent(),
                        pos = target.offset().top - container.offset().top;

                    if ((pos < 0) || (pos + target.height() > container.height())) {
                        // scroll to Node, leave 16px offset
                        container.scrollTop(container.scrollTop() + pos - 16);
                    }

                });
            this.append(baton.parentView.startDatePicker.render().$el);
        }
    });

    // end date
    point.basicExtend({
        id: 'end-date',
        index: 500,
        nextTo: 'start-date',
        draw: function (baton) {
            baton.parentView.endDatePicker = new DatePicker({
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
            }).listenTo(baton.model, 'change:endDate', function (model) {
                this.toggleTimeInput(!calendarUtil.isAllday(model));
            }).on('click:timezone', openTimezoneDialog, baton)
                .on('click:time', function () {
                    var target = this.$el.find('.dropdown-menu.calendaredit'),
                        container = target.scrollParent(),
                        pos = target.offset().top - container.offset().top;

                    if ((pos < 0) || (pos + target.height() > container.height())) {
                        // scroll to Node, leave 16px offset
                        container.scrollTop(container.scrollTop() + pos - 16);
                    }

                });
            this.append(baton.parentView.endDatePicker.render().$el);
        }
    });

    // timezone hint
    point.extend({
        id: 'timezone-hint',
        index: 550,
        nextTo: 'end-date',
        render: function () {
            var model = this.model,
                userTimezone = moment().zoneAbbr(),
                helpBlock = $('<div class="col-xs-12 help-block">').hide();

            function setHint() {
                var startTimezone = model.getMoment('startDate').zoneAbbr(),
                    endTimezone = model.getMoment('endDate').zoneAbbr(),
                    isVisible = startTimezone !== userTimezone || endTimezone !== userTimezone;
                helpBlock.toggle(isVisible);
                if (isVisible) {
                    var start = model.getMoment('startDate'),
                        end = model.getMoment('endDate'),
                        interval = calendarUtil.getTimeInterval(model.attributes, moment().tz()),
                        duration = moment.duration(end.diff(start, 'ms')).humanize();
                    helpBlock.text(
                        //#. %1$s timezone abbreviation of the user
                        //#. %2$s time interval of event
                        //#. %2$s duration of event
                        gt('In your timezone (%1$s): %2$s (Duration: %3$s)', userTimezone, interval, duration)
                    );
                }
            }
            this.$el.append(helpBlock);
            this.listenTo(model, 'change:startDate change:endDate', setHint);
            setHint();
        }
    });

    // full time
    point.extend({
        id: 'full_time',
        index: 600,
        className: 'col-sm-6',
        render: function () {
            var guid = _.uniqueId('form-control-label-'),
                originalModel = this.model,
                model = new Backbone.Model({ allDay: calendarUtil.isAllday(this.model) }),
                view = new mini.CustomCheckboxView({ id: guid, name: 'allDay', label: gt('All day'), model: model });
            view.listenTo(model, 'change:allDay', function () {
                if (this.model.get('allDay')) {
                    originalModel.set({
                        startDate: { value: originalModel.getMoment('startDate').format('YYYYMMDD') },
                        endDate: { value: originalModel.getMoment('endDate').format('YYYYMMDD') }
                    });
                } else {
                    var tzid = moment().tz();
                    originalModel.set({
                        startDate: { value: originalModel.getMoment('startDate').format('YYYYMMDD[T]HHmmss'), tzid: tzid },
                        endDate: { value: originalModel.getMoment('endDate').format('YYYYMMDD[T]HHmmss'), tzid: tzid }
                    });
                }
            });
            this.$el.append(view.render().$el);
        }
    });

    // find free time link
    point.basicExtend({
        id: 'find-free-time-1',
        index: 650,
        nextTo: 'full_time',
        draw: function (baton) {
            if (capabilities.has('freebusy !alone') && _.device('desktop')) {
                this.append(
                    $('<div class="hidden-xs col-sm-6 find-free-time">').append(
                        $('<button type="button" class="btn btn-link">').text(gt('Find a free time'))
                            .on('click', { app: baton.app, model: baton.model }, openFreeBusyView)
                    )
                );
            }
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
            this.$el.append(
                new mini.CustomCheckboxView({
                    label: gt('Show as free'),
                    name: 'transp',
                    model: this.model,
                    customValues: { 'false': 'OPAQUE', 'true': 'TRANSPARENT' },
                    defaultVal: 'OPAQUE'
                }).render().$el
            );
        }
    }, {
        rowClass: 'collapsed form-spacer'
    });

    //color selection
    point.extend({
        id: 'color',
        index: 900,
        className: 'col-xs-12 col-sm-6',
        render: function () {

            if (settings.get('colorScheme') !== 'custom') return;

            var picker = new ColorPicker({
                model: this.model,
                attribute: 'color',
                noColorOption: true,
                additionalColor: this.model.get('color') ? { value: this.model.get('color') } : undefined
            });

            this.$el.append(
                $('<fieldset>').append(
                    $('<legend class="simple">').text(gt('Color')),
                    picker.render().$el
                )
            );

            function onChangeClass() {
                var elem = picker.$('.no-color .box');
                if (calendarUtil.isPrivate(picker.model)) {
                    elem.css({
                        'background-color': calendarUtil.PRIVATE_EVENT_COLOR,
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
        className: 'col-sm-5 col-xs-10',
        render: function () {

            // visibility flag only works in private folders
            var folder = this.model.get('folder');
            if (!folderAPI.pool.getModel(folder).is('private')) return;

            this.$el.append(
                $('<fieldset>').append(
                    $('<legend class="simple">').text(gt('Visibility')),
                    new mini.SelectView({ label: gt('Visibility'), name: 'class', model: this.model, list: [
                        { value: 'PUBLIC', label: gt('Public') },
                        { value: 'CONFIDENTIAL', label: gt('Private') },
                        { value: 'PRIVATE', label: gt('Secret') }]
                    }).render().$el
                )
            );

        }
    }, {
        nextTo: 'color',
        rowClass: 'collapsed'
    });

    // visibility helper
    point.extend({
        id: 'visibility-helper',
        index: 1050,
        className: 'col-sm-1 col-xs-2',
        render: function () {

            // visibility flag only works in private folders
            var folder = this.model.get('folder');
            if (!folderAPI.pool.getModel(folder).is('private')) return;
            var helpNode = $('<a href="#" tabindex="0" role="button" class="visibility-helper-button btn btn-link" data-toggle="popover" data-trigger="focus hover" data-placement="left" data-content=" ">').append('<i class="fa fa-question-circle">')
                .attr('data-template', '<div class="popover calendar-popover" role="tooltip"><div class="arrow"></div><div>' +
                    '<div class="ox-popover-title">' + gt('Public') + '</div>' +
                    '<div>' + gt('The appointment is visible for all users in shared calendars.') + '</div>' +
                    '<div class="ox-popover-title">' + gt('Private') + '</div>' +
                    '<div>' + gt('In shared calendars, the appointment is displayed as a simple time slot for non-attending users.') + '</div>' +
                    '<div class="ox-popover-title">' + gt('Secret') + '</div>' +
                    '<div>' + gt('The appointment is not visible to non-attending users in shared calendars at all. The appointment is not considered for conflicts and does not appear in the scheduling view.') + '</div>' +
                    '</div></div>')
                    .popover({
                        container: '#' + this.baton.app.get('window').id + ' .window-content.scrollable'
                    });

            this.$el.append(
                $('<fieldset>').append(
                    helpNode
                )
            );

        }
    }, {
        nextTo: 'private_flag',
        rowClass: 'collapsed'
    });

    // alarms
    point.extend({
        id: 'alarms',
        index: 1100,
        className: 'col-md-12',
        render: function () {
            this.baton.parentView.alarmsView = this.baton.parentView.alarmsView || new AlarmsView.linkView({ model: this.model });
            this.$el.append(
                $('<fieldset>').append(
                    $('<legend>').text(gt('Reminder')),
                    this.baton.parentView.alarmsView.render().$el
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
            var app = this.baton.app,
                model = new Backbone.Model({ notification: app.get('sendInternalNotifications') });
            model.on('change:notification', function () {
                app.set('sendInternalNotifications', this.get('notification'), { silent: true });
            });
            this.$el.append(
                new mini.CustomCheckboxView({ label: gt('Notify all participants by email.'), name: 'notification', model: model }).render().$el
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
        noUploadOnSave: true,
        module: 1
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

    if (!coreSettings.get('features/PIMAttachments', capabilities.has('filestore'))) {
        ext.point('io.ox/calendar/edit/section')
            .disable('attachments_legend')
            .disable('attachments_upload');
    }

    return null;
});
