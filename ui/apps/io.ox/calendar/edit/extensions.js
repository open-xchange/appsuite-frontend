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
    'io.ox/core/tk/upload',
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
    'io.ox/backbone/mini-views/dropdown',
    'less!io.ox/calendar/style'
], function (ext, gt, calendarUtil, contactUtil, mailUtil, coreUtil, upload, views, mini, DatePicker, attachments, RecurrenceView, AlarmsView, api, AddParticipantView, pViews, capabilities, picker, folderAPI, settings, coreSettings, ColorPicker, Dropdown) {

    'use strict';

    var point = views.point('io.ox/calendar/edit/section');

    point.basicExtend({
        index: 100,
        id: 'dnd',
        draw: function (baton) {
            baton.app.view.$el.append(
                new upload.dnd.FloatingDropzone({
                    app: baton.app,
                    point: 'io.ox/calendar/edit/dnd/actions'
                }).render().$el
            );
        }
    });

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
                        inputfieldVal = baton.parentView.$el.find('.add-participant.tt-input').val();

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

                    // correct time for allday appointments (remove timezone and add 1 day to enddate)
                    if (calendarUtil.isAllday(baton.model)) {
                        // save unchanged dates, so they can be restored on error or when handling conflicts
                        baton.parentView.tempEndDate = baton.model.get('endDate');
                        baton.model.set('endDate', { value: moment(baton.model.get('endDate').value).add(1, 'days').format('YYYYMMDD') }, { silent: true });
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

                    // do some cleanup
                    // remove groups with entity. Those are not needed, as the attendees are also added individually.
                    // we only remove them if there where changes to the attendees, as we don't want to create a false dirty status
                    if (!_.isEqual(baton.app.initialModelData.attendees, baton.model.get('attendees'))) {
                        baton.model._attendees.remove(baton.model._attendees.filter(function (attendee) {
                            return attendee.get('cuType') === 'GROUP' && attendee.get('entity');
                        }));
                    }

                    baton.app.getWindow().busy();
                    // needed, so the formdata can be attached when selecting ignore conflicts in the conflict dialog
                    baton.app.attachmentsFormData = attachments;

                    // in case some attendees are still resolved we wait fot that. We don't want missing attendees
                    $.when(baton.model._attendees.toBeResolved).always(function () {
                        if (baton.mode === 'edit') {
                            var options = _.extend(calendarUtil.getCurrentRangeOptions(), {
                                    recurrenceRange: baton.model.mode === 'thisandfuture' ? 'THISANDFUTURE' : undefined,
                                    attachments: attachments,
                                    checkConflicts: true,
                                    usedGroups: baton.model._attendees.usedGroups,
                                    showRecurrenceInfo: true
                                }),
                                delta = baton.app.getDelta();
                            api.update(delta, options).then(save, fail);
                            return;
                        }

                        api.create(baton.model, _.extend(calendarUtil.getCurrentRangeOptions(), { usedGroups: baton.model._attendees.usedGroups, attachments: attachments, checkConflicts: true })).then(save, fail);

                    });
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
                    baton.app.quit(false, { type: 'discard' });
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
            input.on('keyup change', function () {
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
            var datepicker = baton.parentView.startDatePicker = new DatePicker({
                model: baton.model,
                className: 'col-sm-6 col-xs-12',
                display: calendarUtil.isAllday(baton.model) ? 'DATE' : 'DATETIME',
                attribute: 'startDate',
                label: gt('Starts on'),
                timezoneButton: true,
                closeOnScroll: true,
                a11y: {
                    timeLabel: gt('Start time')
                },
                chronos: true
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
            this.append(datepicker.render().$el);
            if (datepicker.nodes.timezoneField) {
                datepicker.nodes.timezoneField.attr('title', gt('Change timezone'));
            }
        }
    });

    // end date
    point.basicExtend({
        id: 'end-date',
        index: 500,
        nextTo: 'start-date',
        draw: function (baton) {
            var datepicker = baton.parentView.endDatePicker = new DatePicker({
                model: baton.model,
                className: 'col-sm-6 col-xs-12',
                display: calendarUtil.isAllday(baton.model) ? 'DATE' : 'DATETIME',
                attribute: 'endDate',
                label: gt('Ends on'),
                timezoneButton: true,
                closeOnScroll: true,
                a11y: {
                    timeLabel: gt('End time')
                },
                chronos: true
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
            this.append(datepicker.render().$el);
            if (datepicker.nodes.timezoneField) {
                datepicker.nodes.timezoneField.attr('title', gt('Change timezone'));
            }
        }
    });

    // timezone hint
    point.extend({
        id: 'timezone-hint',
        index: 550,
        nextTo: 'end-date',
        render: function () {
            var helpBlock = $('<div class="col-xs-12 help-block">').hide(),
                // compare by offset, not timezone name or we would show the hint oo often (eyample: Europe/Paris and Europe/Berlin)
                userOffset = moment().utcOffset(),
                userTimezone = moment().tz(),
                self = this;

            function setHint() {
                var startOffset = self.baton.model.getMoment('startDate').utcOffset(),
                    endOffset = self.baton.model.getMoment('endDate').utcOffset(),
                    isVisible = startOffset !== userOffset || endOffset !== userOffset;

                helpBlock.toggle(isVisible);
                if (isVisible) {
                    var interval = calendarUtil.getDateTimeIntervalMarkup(self.baton.model.attributes, { zone: moment().tz(), noTimezoneLabel: true });
                    interval.prepend($('<span>').append(userTimezone + ': '));
                    helpBlock.empty();
                    helpBlock.append(
                        interval
                    );
                }
            }

            this.$el.append(helpBlock);
            this.listenTo(this.baton.model, 'change:startDate change:endDate', setHint);
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
                parentView = this.baton.parentView,
                model = parentView.fullTimeToggleModel || new Backbone.Model({
                    allDay: calendarUtil.isAllday(this.model),
                    nonAlldayStartTime: moment(originalModel.getMoment('startDate')),
                    nonAlldayEndTime: moment(originalModel.getMoment('endDate'))
                }),
                view = new mini.CustomCheckboxView({ id: guid, name: 'allDay', label: gt('All day'), model: model });

            view.listenTo(model, 'change:allDay', function () {
                if (this.model.get('allDay')) {
                    this.model.set({
                        nonAlldayStartTime: moment(originalModel.getMoment('startDate')),
                        nonAlldayEndTime: moment(originalModel.getMoment('endDate'))
                    });
                    originalModel.set({
                        startDate: { value: originalModel.getMoment('startDate').format('YYYYMMDD') },
                        endDate: { value: originalModel.getMoment('endDate').format('YYYYMMDD') }
                    });
                } else {
                    // keep selected date but use the time saved from before the allday change
                    originalModel.set({
                        startDate: { value: originalModel.getMoment('startDate').format('YYYYMMDD') + this.model.get('nonAlldayStartTime').format('[T]HHmmss'), tzid: this.model.get('nonAlldayStartTime').tz() },
                        endDate: { value: originalModel.getMoment('endDate').format('YYYYMMDD') + this.model.get('nonAlldayEndTime').format('[T]HHmmss'), tzid: this.model.get('nonAlldayEndTime').tz() }
                    });
                }
            });
            this.$el.append(view.render().$el);

            if (!parentView.fullTimeToggleModel && this.baton.mode === 'create') {
                // if we restore alarms, check if they differ from the defaults
                var isDefault = JSON.stringify(_(originalModel.attributes.alarms).pluck('action', 'trigger')) === JSON.stringify(_(calendarUtil.getDefaultAlarms(originalModel)).pluck('action', 'trigger'));

                // automatically change default alarm in create mode when allDay changes and the user did not change the alarm before (we don't want data loss)
                if (isDefault) {
                    var applyDefaultAlarms = function () { originalModel.set('alarms', calendarUtil.getDefaultAlarms(originalModel)); };
                    model.on('change:allDay', applyDefaultAlarms);
                    originalModel.once('userChangedAlarms', function () { model.off('change:allDay', applyDefaultAlarms); });
                }

                // add some automatic for transparency here.
                // we want to change transparency according to the markFulltimeAppointmentsAsFree setting
                // if we detect a manual change of the transparency setting caused by a user we don't want to overwrite this.
                // cannot use originalModel.changed attribute here because of multiple issues (changed only stores attributes from last set, not from last sync for example)
                view.listenTo(model, 'change:allDay', function () {
                    if (settings.get('markFulltimeAppointmentsAsFree', false) && !parentView.userChangedTransp) {
                        originalModel.set('transp', this.model.get('allDay') ? 'TRANSPARENT' : 'OPAQUE');
                    }
                });
            }

            parentView.fullTimeToggleModel = model;
        }
    });

    // find free time link
    point.basicExtend({
        id: 'find-free-time-1',
        index: 650,
        nextTo: 'full_time',
        draw: function (baton) {
            if (capabilities.has('freebusy !alone !guest') && _.device('desktop')) {
                this.append(
                    $('<div class="hidden-xs col-sm-6 find-free-time">').append(
                        $('<button type="button" class="btn btn-link">').text(gt('Find a free time'))
                            .on('click', { app: baton.app, model: baton.model }, openFreeBusyView)
                    )
                );
            }
        }
    });

    // recurrence
    point.extend({
        id: 'recurrence',
        className: 'col-xs-12',
        index: 700,
        render: function () {

            // changes not allowed when editing or creating an exception
            if ((this.model.get('recurrenceId') && this.model.mode === 'appointment')) return;

            var helpNode = $('<div class="alert">'),
                errorText = gt('Your recurrence rule does not fit to your start date.'),
                helpText = gt('Your recurrence rule was changed automatically.'),
                self = this,
                recurrenceView = new RecurrenceView({
                    model: this.model
                });
            this.$el.append(
                recurrenceView.render().$el,
                helpNode.hide()
            );

            this.model.on('change:rrule', function () {
                if (!self.model.get('rrule')) {
                    helpNode.hide();
                    return;
                }
                // just return, no hide here (autochange hint might be there)
                if (self.model.checkRecurrenceRule()) return;
                helpNode.removeClass('alert-info').addClass('alert-warning').text(errorText).show();
            });
            this.model.getRruleMapModel().on('autochanged', function () {
                helpNode.removeClass('alert-warning').addClass('alert-info').text(helpText).show();
            });
            recurrenceView.on('openeddialog', function () {
                helpNode.hide();
            });
        }
    });

    // note
    point.extend({
        id: 'note',
        index: 800,
        className: 'col-xs-12',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<label class="control-label">').text(gt('Description')).attr({ for: guid }),
                new mini.TextView({ name: 'description', model: this.model }).render().$el.attr({ id: guid }).addClass('note')
            );
        }
    });

    var CalendarDropdownView = mini.AbstractView.extend({

        tagName: 'fieldset',
        dropDown: {},
        $toggle: $('<button class="btn btn-link dropdown-toggle" data-toggle="dropdown" type="button" aria-haspopup="true">'),

        getColor: function (folder) {
            var props = folder['com.openexchange.calendar.extendedProperties'],
                color = settings.get('defaultFolderColor', '#CFE6FF');

            if (props && props.color && props.color.value) color = props.color.value;
            var label = _(calendarUtil.colors).findWhere({ value: color }) || {};
            return { value: color, label: label.label || gt('User defined color') };
        },

        setup: function () {
            var self = this;

            this.listenTo(this.model, 'change:folder', function (model, folder) {
                var getNewModel = folderAPI.get(folder),
                    getPreviousModel = folderAPI.get(self.model.previous('folder'));

                $.when(getNewModel, getPreviousModel).done(function (newModel, previousModel) {
                    var prevOrg = self.model.previousAttributes().organizer.entity;
                    // check if we need to make changes to the appointment
                    // needed when switch from shared to private or private to shared happens
                    if (folderAPI.is('shared', newModel) || folderAPI.is('shared', previousModel)) {
                        self.model.setDefaultAttendees({ create: true, resetStates: !self.model.get('id') }).done(function () {
                            // trigger reset to trigger a redrawing of all participants (avoid 2 organizers)
                            self.model.getAttendees().trigger('reset');
                            // same organizer? No message needed (switched between shared calendars of the same user)
                            if (prevOrg === self.model.get('organizer').entity) return;

                            require(['io.ox/core/yell'], function (yell) {
                                if (folderAPI.is('shared', newModel)) {
                                    yell('info', gt('You are using a shared calendar. The calendar owner was added as organizer.'));
                                } else {
                                    yell('info', gt('You are no longer using a shared calendar. You were added as organizer.'));
                                }
                            });
                        });
                    } else if (folderAPI.is('public', newModel) && !folderAPI.is('public', previousModel)) {
                        // trigger redraw of attendees, organizer might be removable/not removable anymore
                        self.model.getAttendees().trigger('reset');
                    } else if (!folderAPI.is('public', newModel) && folderAPI.is('public', previousModel)) {
                        var prevLength = self.model.getAttendees().length;
                        self.model.setDefaultAttendees({ create: true, resetStates: !self.model.get('id') }).done(function () {
                            // trigger reset to trigger a redrawing of all participants (avoid 2 organizers)
                            self.model.getAttendees().trigger('reset');
                            // no user added -> user was organizer before, no yell needed
                            if (prevLength === self.model.getAttendees().length) return;

                            require(['io.ox/core/yell'], function (yell) {
                                yell('info', gt('You are no longer using a public calendar. You were added as organizer.'));
                            });
                        });
                    }
                });

                self.update();
            });
        },

        update: function () {
            var self = this;

            folderAPI.get(self.model.get('folder')).done(function (folder) {
                var folderLabel = folder.display_title || folder.title;
                self.$toggle.text(folderLabel);
            });

            self.dropDown.update();
        },

        render: function () {
            var self = this,
                folderDef = folderAPI.get(self.model.get('folder')),
                folderSectionsDef = folderAPI.flat({ module: 'calendar' });

            self.dropDown = new Dropdown({ caret: false, model: self.model, $toggle: self.$toggle });

            $.when(folderDef, folderSectionsDef).done(function (folder, folderSections) {

                //var color = self.getColor(folder),
                var folderLabel = folder.display_title || folder.title,
                    folderNames = {
                        'private':  gt('My calendars'),
                        'public':   gt('Public calendars'),
                        'shared':   gt('Shared calendars'),
                        'hidden':   gt('Hidden calendars')
                    },
                    i = 0;

                function addSection(text, sectionName) {
                    var folderSection = folderSections[sectionName];
                    if (!folderSection || folderSection.length === 0) return;

                    folderSection = _(folderSection).filter(function (folder) {
                        var create = folderAPI.can('create', folder),
                            // we dont allow moving an already existing appointment to a folder from another user (moving from shared user A's folder to shared user A's folder is allowed).
                            allowed = !self.model.get('id') || folderAPI.is('public', folder) || folder.created_by === self.model.get('organizer').entity;

                        return (create && allowed && !/^virtual/.test(folder.id));
                    });

                    if (folderSection.length === 0) return;

                    if (i !== 0) self.dropDown.divider();
                    self.dropDown.header(text);

                    _(folderSection).forEach(function (folder) {
                        var checkboxColor = self.getColor(folder);
                        self.dropDown.option(
                            'folder',
                            folder.id,
                            function () {
                                return [
                                    $.txt(folder.display_title || folder.title),
                                    $('<span class="sr-only">').text(', ' + gt('Color') + ': ' + checkboxColor.label)
                                ];
                            },
                            { radio: true, color: checkboxColor.value }
                        );
                    });
                    i++;
                }

                self.$toggle.text(folderLabel);

                _(folderNames).each(addSection);

                self.$el.append(
                    $('<legend>').addClass('simple').text(gt('Calendar')),
                    self.dropDown.render().$el
                );
            });

            return this;
        }
    });


    // separator or toggle
    point.basicExtend({
        id: 'noteSeparator',
        index: 850,
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

    // participants container
    point.basicExtend({
        id: 'participants_list',
        index: 900,
        rowClass: 'collapsed',
        draw: function (baton) {
            this.append(new pViews.UserContainer({
                collection: baton.model.getAttendees(),
                baton: baton,
                hideInternalGroups: true
            }).render().$el);

            if (baton.parentView.options.usedGroups) baton.model.getAttendees().usedGroups = _.uniq((baton.model.getAttendees().usedGroups || []).concat(baton.parentView.options.usedGroups));
        }
    });

    // add participants view
    point.basicExtend({
        id: 'add-participant',
        index: 1000,
        rowClass: 'collapsed',
        draw: function (baton) {

            baton.parentView.addParticipantsView = baton.parentView.addParticipantsView || new AddParticipantView({
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
                scrollIntoView: true,
                // to prevent addresspicker from processing data asynchronously.
                // Not needed and may cause issues with slow network (hitting save before requests return).
                processRaw: true
            });

            this.append(baton.parentView.addParticipantsView.$el);
            baton.parentView.addParticipantsView.render().$el.addClass('col-xs-12');
        }
    });

    point.extend({
        id: 'folder-selection',
        index: 1100,
        className: 'col-xs-12 col-sm-6 folder-selection',
        render: function () {
            var view = new CalendarDropdownView({ model: this.model }).render().$el;
            this.$el.append(view).addClass('col-xs-12');
        }
    }, {
        rowClass: 'collapsed form-spacer'
    });

    // private checkbox
    point.extend({
        id: 'private_flag',
        index: 1200,
        className: 'col-sm-6 col-xs-12',
        render: function () {

            // visibility flag only works in private folders and does not work with exceptions
            var folder = this.model.get('folder'),
                guid = _.uniqueId('form-control-label-');
            if (!folderAPI.pool.getModel(folder).is('private') || (this.model.get('recurrenceId') && this.model.mode === 'appointment')) return;

            this.$el.append(
                $('<div>').append(
                    $('<label class="simple">').attr('for', guid).text(gt('Visibility')),
                    new mini.SelectView({ id: guid, label: gt('Visibility'), name: 'class', model: this.model, list: [
                        { value: 'PUBLIC', label: gt('Standard') },
                        { value: 'CONFIDENTIAL', label: gt('Private') },
                        { value: 'PRIVATE', label: gt('Secret') }]
                    }).render().$el,
                    new mini.ErrorView({ name: 'class', model: this.model }).render().$el
                )
            );

        }
    }, {
        nextTo: 'folder-selection',
        rowClass: 'collapsed'
    });

    // container for alarms and color
    point.extend({
        id: 'alarms-container',
        index: 1300,
        className: 'col-xs-12 col-sm-6',
        render: function () {
            ext.point('io.ox/calendar/edit/section/alarms-container').invoke('render', this);
        }
    }, {
        rowClass: 'collapsed'
    });

    // alarms
    ext.point('io.ox/calendar/edit/section/alarms-container').extend({
        id: 'alarms',
        index: 100,
        render: function () {
            this.baton.parentView.alarmsView = this.baton.parentView.alarmsView || new AlarmsView.linkView({ model: this.model });
            this.$el.append(
                $('<fieldset>').append(
                    $('<legend class="simple">').text(gt('Reminder')),
                    this.baton.parentView.alarmsView.render().$el
                )
            );
        }
    });

    //color selection
    ext.point('io.ox/calendar/edit/section/alarms-container').extend({
        id: 'color',
        index: 200,
        render: function () {

            var self = this,
                picker = new ColorPicker({
                    model: this.model,
                    attribute: 'color',
                    additionalColor: this.model.get('color') ? { value: this.model.get('color') } : undefined
                }),
                toggle = $('<button class="btn btn-link dropdown-toggle" data-toggle="dropdown" type="button" aria-haspopup="true">').text(gt('Appointment color')),
                menu = $('<ul class="dropdown-menu">'),
                pickedColor = $('<span class="picked-color" aria-hidden="true">'),
                pickedColorLabel = $('<span class="sr-only">'),
                dropdown = new Dropdown({
                    smart: true,
                    className: 'color-picker-dropdown dropdown',
                    $toggle: toggle.append(pickedColor, pickedColorLabel),
                    $ul: menu,
                    margin: 24,
                    model: this.model,
                    carret: true,
                    allowUndefined: true
                });
            //#. showed inside a color picker. Used if an appointment should not have a custom color
            dropdown.option('color', '', gt('Use calendar color'), { radio: true });
            dropdown.$ul.find('[data-name="color"]').addClass('folder-default-color');
            menu.append($('<li role="presentation" class="io-ox-calendar-color-picker-container">').append($('<div class="color-picker-scroll">').append(picker.render().$el)));

            this.$el.append(dropdown.render().$el);

            function onChangeColor() {
                var colorLabel = gt('none');
                if (!self.model.get('color')) {
                    // try to get the folder color
                    var model = folderAPI.pool.getModel(self.model.get('folder')) || new Backbone.Model(),
                        props = model.get('com.openexchange.calendar.extendedProperties') || {},
                        color = '#fff';

                    if (props.color && props.color.value) color = props.color.value;
                    pickedColor.css({ 'background-color': color });
                    if (_(calendarUtil.colors).findWhere({ value: color })) colorLabel = _(calendarUtil.colors).findWhere({ value: color }).label;
                    pickedColorLabel.text(colorLabel);
                    picker.$el.find(':checked').prop('checked', false);
                    return;
                }
                if (_(calendarUtil.colors).findWhere({ value: self.model.get('color') })) colorLabel = _(calendarUtil.colors).findWhere({ value: self.model.get('color') }).label;
                pickedColorLabel.text(colorLabel);
                pickedColor.css('background-color', self.model.get('color'));
            }

            this.model.on('change:color change:folder', onChangeColor);
            onChangeColor();
        }
    });

    // container for alarms and color
    point.extend({
        id: 'visibility-container',
        index: 1400,
        className: 'col-xs-12 col-sm-6 visibility-container',
        render: function () {
            ext.point('io.ox/calendar/edit/section/visibility-container').invoke('render', this);
        }
    }, {
        nextTo: 'alarms-container',
        rowClass: 'collapsed'
    });

    // shown as
    ext.point('io.ox/calendar/edit/section/visibility-container').extend({
        id: 'shown_as',
        index: 100,
        render: function () {
            var parentView = this.baton.parentView,
                // used by all day checkbox
                visibilityCheckbox = mini.CustomCheckboxView.extend({
                    onChange: function () {
                        parentView.userChangedTransp = true;
                        this.model.set(this.name, this.getValue());
                    }
                });

            this.$el.append(
                new visibilityCheckbox({
                    label: gt('Show as free'),
                    name: 'transp',
                    model: this.model,
                    customValues: { 'false': 'OPAQUE', 'true': 'TRANSPARENT' },
                    defaultVal: 'OPAQUE'
                }).render().$el
            );
        }
    });

    ext.point('io.ox/calendar/edit/section/visibility-container').extend({
        id: 'allowAttendeeChanges',
        index: 200,
        render: function () {
            var checkboxView  = new mini.CustomCheckboxView({
                label: gt('Participants can make changes'),
                name: 'attendeePrivileges',
                model: this.model,
                customValues: { 'false': 'DEFAULT', 'true': 'MODIFY' }
            });

            this.$el.append(
                checkboxView.render().$el.addClass('attendee-change-checkbox')
            );

            // only the organizer is allowed to change this attribute
            // also not allowed for exceptions or in public folders
            var isNotOrganizer = this.baton.mode === 'edit' && !(calendarUtil.hasFlag(this.model, 'organizer') || calendarUtil.hasFlag(this.model, 'organizer_on_behalf')),
                isException = this.model.get('recurrenceId') && this.model.mode === 'appointment',
                onChangeFolder = function () {
                    // force true boolean
                    var disabled = !!(folderAPI.pool.getModel(this.model.get('folder')).is('public') || isNotOrganizer || isException);
                    checkboxView.$el.toggleClass('disabled', disabled).find('input').attr('aria-disabled', disabled).prop('disabled', disabled ? 'disabled' : null);
                    // if checkbox is disabled this means attendeePrivileges must be set to DEFAULT because MODIFY is not supported. Would cause error on save otherwise
                    if (disabled) this.model.set('attendeePrivileges', 'DEFAULT');
                }.bind(this);

            onChangeFolder();

            // no need for onChangeFolder listener when not organizer or if the appointment is an exception. Checkbox will stay disabled all the time;
            if (isNotOrganizer || isException) return;

            this.model.on('change:folder', onChangeFolder);
        }
    });

    // Attachments

    // attachments label
    point.extend({
        id: 'attachments_legend',
        index: 1500,
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
        index: 1600,
        noUploadOnSave: true,
        module: 1
    }), {
        rowClass: 'collapsed'
    });

    point.basicExtend({
        id: 'attachments_upload',
        index: 1700,
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
                    baton.model.validate();
                };

            $input.on('change', changeHandler);
            $inputWrap.on('change.fileupload', function () {
                //use bubbled event to add fileupload-new again (workaround to add multiple files with IE)
                $(this).find('div[data-provides="fileupload"]').addClass('fileupload-new').removeClass('fileupload-exists');
            });
            $node.append($('<div>').addClass('col-md-12').append($inputWrap));

            baton.model.on('invalid:quota_exceeded', function (messages) {
                require(['io.ox/core/yell'], function (yell) {
                    yell('error', messages[0]);
                });
            });
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

                        e.data.model.set({ startDate: appointment.startDate });
                        // use initialrendering attribute to avoid autoscrolling
                        e.data.app.view.addParticipantsView.initialRendering = true;
                        e.data.model.getAttendees().reset(appointment.attendees);
                        // set end_date in a seperate call to avoid the appointment model applyAutoLengthMagic (Bug 27259)
                        e.data.model.set({
                            endDate: appointment.endDate
                        }, { validate: true });
                        // make sure the correct allday state is set
                        e.data.app.view.fullTimeToggleModel.set('allDay', calendarUtil.isAllday(appointment));
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
