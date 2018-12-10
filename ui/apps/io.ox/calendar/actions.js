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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/actions', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/calendar/api',
    'io.ox/calendar/util',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/print',
    'gettext!io.ox/calendar',
    'io.ox/core/capabilities',
    'io.ox/core/folder/api',
    'io.ox/core/yell',
    'settings!io.ox/calendar'
], function (ext, links, api, util, actions, print, gt, capabilities, folderAPI, yell, settings) {

    'use strict';

    var Action = links.Action;

    // Actions
    new Action('io.ox/calendar/actions/switch-to-list-view', {
        requires: true,
        action: function (baton) {
            baton.app.pages.changePage('list', { disableAnimations: true });
        }
    });

    new Action('io.ox/calendar/actions/switch-to-month-view', {
        requires: function () {
            return true;
        },
        action: function (baton) {
            baton.app.pages.changePage('month', { disableAnimations: true });
        }
    });

    new Action('io.ox/calendar/actions/switch-to-fullweek-view', {
        requires: function () {
            return _.device('!smartphone');
        },
        action: function (baton) {
            baton.app.pages.changePage(baton.app, 'week:week');
        }
    });

    new Action('io.ox/calendar/actions/switch-to-week-view', {
        requires: function () {
            return _.device('!smartphone');
        },
        action: function (baton) {
            baton.app.pages.changePage(baton.app, 'week:workweek');
        }
    });

    new Action('io.ox/calendar/actions/switch-to-day-view', {
        requires: true,
        action: function (baton) {
            baton.app.pages.changePage(baton.app, 'week:day');
        }
    });

    new Action('io.ox/calendar/detail/actions/sendmail', {
        capabilities: 'webmail',
        requires: function (e) {
            return e.baton.model && e.baton.model.has('attendees');
        },
        action: function (baton) {
            util.resolveAttendees(baton.data, { filterSelf: true }).done(function (recipients) {
                var hash = {};
                recipients = _(recipients)
                    .chain()
                    .filter(function (rec) {
                        // don't add duplicates
                        return rec.mail in hash ? false : (hash[rec.mail] = true);
                    })
                    .map(function (rec) {
                        return [rec.display_name, rec.mail];
                    })
                    .value();
                ox.registry.call('mail-compose', 'open', { to: recipients, subject: baton.data.summary });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/invite', {
        capabilities: 'calendar',
        requires: function (e) {
            return e.baton.model && e.baton.model.has('attendees') && !capabilities.has('guest');
        },
        action: function (baton) {
            ox.load(['io.ox/calendar/actions/invite']).done(function (action) {
                action(baton);
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/save-as-distlist', {
        capabilities: 'contacts',
        requires: function (e) {
            return e.baton.model && e.baton.model.has('attendees') && e.baton.model.get('attendees').length > 1;
        },
        action: function (baton) {
            util.resolveAttendees(baton.data).done(function (distlist) {
                require(['settings!io.ox/core'], function (coreSettings) {
                    ox.launch('io.ox/contacts/distrib/main')
                        .done(function () {
                            this.create(coreSettings.get('folder/contacts'), {
                                distribution_list: distlist,
                                display_name: baton.data.summary
                            });
                        });
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/edit', {
        requires: function (e) {
            var exists = e.baton && e.baton.data && e.baton.data.id !== undefined,
                allowed = e.collection.has('one', 'modify');
            if (!exists || !allowed) return false;

            return util.allowedToEdit(e.baton.data);
        },
        action: function (baton) {
            ox.load(['io.ox/calendar/actions/edit']).done(function (action) {
                action(baton);
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/delete', {
        requires: function (e) {
            return e.collection.has('delete') && ((util.hasFlag(e.baton.data, 'organizer') || util.hasFlag(e.baton.data, 'organizer_on_behalf') || util.hasFlag(e.baton.data, 'attendee') || util.hasFlag(e.baton.data, 'attendee_on_behalf')));
        },
        multiple: function (list) {
            ox.load(['io.ox/calendar/actions/delete']).done(function (action) {
                action(list);
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/create', {
        requires: function () {
            return !capabilities.has('guest');
        },
        action: function (baton, obj) {
            ox.load(['io.ox/calendar/actions/create']).done(function (action) {
                action(baton, obj);
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/changeAlarms', {
        requires: function (e) {
            function cont(model, folderData) {
                // folder must support alarms. We don't show the action if attendee or organizer flag is present (change status is shown instead)
                return e.collection.has('one') &&
                    !(util.hasFlag(model, 'attendee') || util.hasFlag(model, 'attendee_on_behalf') || util.hasFlag(model, 'organizer') || util.hasFlag(model, 'organizer_on_behalf')) &&
                    folderData.supported_capabilities.indexOf('alarms') !== -1;
            }

            var model = e.baton.model,
                data = e.baton.data;

            // cannot confirm appointments without proper id (happens when detail view was opened from mail invitation from external calendar)
            // must use buttons in invitation mail instead
            if (!data.id) return false;

            // incomplete
            if (data && !model) {
                return $.when(api.get(data), folderAPI.get(data.folder)).then(cont, function () { return false; });
            }
            return $.when(model, folderAPI.get(data.folder)).then(cont, function () { return false; });
        },
        action: function (baton) {
            // load & call
            ox.load(['io.ox/calendar/actions/change-alarms']).done(function (action) {
                action(baton.data);
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/changestatus', {
        requires: function (e) {
            function cont(model) {
                //no flags at all => public folder and user is no attendee. Not allowed to change attendee statuses
                if (!util.hasFlag(model, 'accepted') && !util.hasFlag(model, 'declined') &&
                    !util.hasFlag(model, 'tentative') && !util.hasFlag(model, 'needs_action')) return false;

                // in shared calendars the attendee means the calendar owner is attendee, we have to look if we have modify permission
                if (util.hasFlag(model, 'attendee_on_behalf') || util.hasFlag(model, 'organizer_on_behalf') && !(util.hasFlag(model, 'attendee') || util.hasFlag(model, 'organizer'))) {
                    return e.collection.has('one', 'modify');
                }

                return e.collection.has('one') && (util.hasFlag(model, 'attendee') || util.hasFlag(model, 'organizer'));
            }

            var model = e.baton.model,
                data = e.baton.data;

            // cannot confirm appointments without proper id (happens when detail view was opened from mail invitation from external calendar)
            // must use buttons in invitation mail instead
            if (!data.id) return false;

            // incomplete
            if (data && !model) {
                return $.when(api.get(data)).then(cont, function () { return false; });
            }
            return $.when(model).then(cont, function () { return false; });
        },
        action: function (baton) {
            // load & call
            ox.load(['io.ox/calendar/actions/acceptdeny']).done(function (action) {
                // get full data if possible
                api.get(baton.data).then(function (obj) {
                    action(obj.toJSON(), { noFolderCheck: baton.noFolderCheck });
                }, function () {
                    action(baton.data, { noFolderCheck: baton.noFolderCheck });
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/follow-up', {
        requires: function (e) {
            return e.collection.has('create', 'read');
        },
        action: function (baton) {
            // load & call
            ox.load(['io.ox/calendar/actions/follow-up']).done(function (action) {
                action(baton.model);
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/print-appointment', {
        capabilities: 'calendar-printing',
        requires: function (e) {
            return e.collection.has('some', 'read') && _.device('!smartphone');
        },
        multiple: function (list) {
            if (list.length > 1) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    var dialog = new dialogs.ModalDialog()
                        .append($('<h4>').text(gt('Do you want the appointments printed in detail or as a compact list?')));

                    //#. answer Button to 'Do you want the appointments printed in detail or as a compact list?'
                    dialog.addPrimaryButton('detailed', gt('Detailed'), 'detailed');
                    //#. answer Button to 'Do you want the appointments printed in detail or as a compact list?'
                    dialog.addButton('compact', gt('Compact'), 'compact');

                    dialog.addButton('cancel', gt('Cancel'), 'cancel')
                        .show()
                        .done(function (action) {
                            if (action === 'detailed') {
                                print.request('io.ox/calendar/print', list);
                            } else if (action === 'compact') {
                                print.request('io.ox/calendar/print-compact', list);
                            }
                        });
                });
                return;
            }
            print.request('io.ox/calendar/print', list);
        }
    });


    new Action('io.ox/calendar/detail/actions/export', {
        requires: 'some read',
        action: function (baton) {
            require(['io.ox/core/download'], function (download) {
                download.exported({ list: [].concat(baton.data), format: 'ical' });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/print-appointment-disabled', {
        requires: 'one',
        capabilities: 'calendar-printing',
        action: function (baton) {
            var options = { template: 'print.appointment.tmpl' },
                POS = 'recurrence_position';
            if (baton.data[POS]) options[POS] = baton.data[POS];
            print.open('calendar', baton.data, options);
        }
    });

    new Action('io.ox/calendar/detail/actions/print', {
        capabilities: 'calendar-printing',
        action: function (baton) {
            var pers = baton.app.perspective;
            if (pers.print) {
                pers.print();
            }
        }
    });

    new Action('io.ox/calendar/detail/actions/move', {
        requires: function (e) {
            var isSeries = !!e.baton.data.recurrenceId;
            // support for multi selection
            if (_.isArray(e.baton.data)) {
                isSeries = false;
                _(e.baton.data).each(function (item) {
                    if (!isSeries) isSeries = !!item.recurrenceId;
                });
            }
            return e.collection.has('some', 'delete') && !isSeries;
        },
        multiple: function (list, baton) {
            ox.load(['io.ox/core/folder/actions/move', 'settings!io.ox/calendar']).done(function (move, settings) {
                folderAPI.get(list[0].folder).done(function (folderData) {

                    // maybe we need a whoAmI util function ...
                    var myId;
                    // acting myself
                    if (util.hasFlag(list[0], 'attendee') || util.hasFlag(list[0], 'organizer')) {
                        myId = ox.user_id;
                    // action on behalf of attendee
                    } else if (util.hasFlag(list[0], 'attendee_on_behalf')) {
                        myId = folderData.created_by;
                    // action on behalf of organizer
                    } else if (util.hasFlag(list[0], 'organizer_on_behalf')) {
                        myId = list[0].organizer.entity;
                    }

                    move.item({
                        api: api,
                        button: gt('Move'),
                        flat: true,
                        indent: false,
                        list: list,
                        module: 'calendar',
                        root: '1',
                        settings: settings,
                        success: {
                            single: 'Appointment has been moved',
                            multiple: 'Appointments have been moved'
                        },
                        target: baton.target,
                        title: gt('Move'),
                        type: 'move',
                        all: util.getCurrentRangeOptions(),
                        disable: function (data, options) {
                            var sameFolder = data.id === list[0].folder,
                                sameOwner = data.created_by === myId,
                                isPublic = folderAPI.is('public', data),
                                sourceFolderIsPublic = folderAPI.is('public', folderData),
                                noOtherAttendees = list[0].attendees.length < 2,
                                create = folderAPI.can('create', data);

                            // totally awesome check
                            // not same folder, must be folder of same user, public folder or there must only be one attendee(the organizer), if the source folder is not public, must have create permission in that folder, folder must not be virtual
                            return sameFolder || !((!sourceFolderIsPublic && noOtherAttendees) || sameOwner || isPublic) || !create || (options && /^virtual/.test(options.folder));
                        }
                    });
                });
            });
        }
    });

    new Action('io.ox/calendar/actions/today', {
        requires: function (baton) {
            var p = baton.baton.app.perspective;
            return !!p && (p.getName() === 'month' || p.getName() === 'week');
        },
        action: function (baton) {
            var p = baton.app.perspective;

            if (p.setStartDate) {
                p.setStartDate();
            } else if (p.gotoMonth) {
                p.gotoMonth('today');
            }
        }
    });

    new Action('io.ox/calendar/actions/freebusy', {
        capabilities: 'freebusy !alone !guest',
        requires: function () {
            return _.device('desktop');
        },
        action: function (baton) {
            require(['io.ox/calendar/freetime/main', 'io.ox/core/api/user'], function (freetime, userAPI) {
                userAPI.get().done(function (user) {
                    var perspective = baton.app.perspective,
                        now = _.now(),
                        startDate = perspective && perspective.model && perspective.model.get('date') ? perspective.model.get('date').valueOf() : now,
                        layout = perspective ? perspective.app.props.get('layout') : '';

                    // see if the current day is in the displayed week.
                    if (startDate < now && layout.indexOf('week:') === 0) {
                        // calculate end of week/workweek
                        var max = startDate + 86400000 * (layout === 'week:workweek' ? settings.get('numDaysWorkweek') : 7);
                        if (now < max) {
                            startDate = now;
                        }
                    }

                    freetime.getApp().launch({ startDate: startDate, attendees: [util.createAttendee(user, { partStat: 'ACCEPTED' })] });
                });
            });
        }
    });

    // Actions mobile
    new Action('io.ox/calendar/actions/showNext', {
        requires: true,
        action: function (baton) {
            var p = baton.app.perspective;
            if (!p) return;
            p.setStartDate('next');
        }
    });

    new Action('io.ox/calendar/actions/showPrevious', {
        requires: true,
        action: function (baton) {
            var p = baton.app.perspective;
            if (!p) return;
            p.setStartDate('prev');
        }
    });

    new Action('io.ox/calendar/actions/showToday', {
        requires: true,
        action: function (baton) {
            var p = baton.app.perspective;
            if (!p) return;
            p.setStartDate(moment());
        }
    });

    new Action('io.ox/calendar/premium/actions/share', {
        capabilities: 'caldav',
        requires: function () {
            // use client onboarding here, since it is a setting and not a capability
            return capabilities.has('client-onboarding');
        },
        action: function () {
            require(['io.ox/onboarding/clients/wizard'], function (wizard) {
                wizard.run();
            });
        }
    });

    function acceptDecline(baton, accept) {
        if ($(baton.e.target).hasClass('disabled')) return;
        var appointment = api.reduce(baton.data),
            def = baton.noFolderCheck ? $.when() : folderAPI.get(appointment.folder);

        def.always(function (folder) {

            appointment.attendee = {
                // act as folder owner in shared folder
                entity: !folder.error && !baton.noFolderCheck && folderAPI.is('shared', folder) ? folder.created_by : ox.user_id,
                partStat: accept ? 'ACCEPTED' : 'DECLINED'
            };

            if (accept) {
                // default reminder
                appointment.alarms = util.getDefaultAlarms(baton.data);
            }

            // check if only one appointment or the whole series should be accepted
            // exceptions don't have the same id and seriesId
            if (baton.data.seriesId === baton.data.id && appointment.recurrenceId) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(accept ? gt('Do you want to confirm the whole series or just one appointment within the series?') :
                            gt('Do you want to decline the whole series or just one appointment within the series?'))
                        .addPrimaryButton('series',
                            //#. Use singular in this context
                            gt('Series'), 'series')
                        .addButton('appointment', gt('Appointment'), 'appointment')
                        .addButton('cancel', gt('Cancel'), 'cancel')
                        .show()
                        .then(function (action) {
                            if (action === 'cancel') {
                                return;
                            }
                            if (action === 'series') {
                                delete appointment.recurrenceId;
                            }
                            $(baton.e.target).addClass('disabled');
                            // those links are for fast accept/decline, so don't check conflicts
                            api.confirm(appointment, util.getCurrentRangeOptions()).fail(function (e) {
                                yell(e);
                                $(baton.e.target).removeClass('disabled');
                            });
                        });
                });
                return;
            }
            $(baton.e.target).addClass('disabled');
            // those links are for fast accept/decline, so don't check conflicts
            api.confirm(appointment).fail(function (e) {
                yell(e);
                $(baton.e.target).removeClass('disabled');
            });
        });
    }

    new Action('io.ox/calendar/actions/accept-appointment', {
        requires: function (e) {
            if (!e || !e.baton || !e.baton.data || !e.baton.data.flags) return false;
            if (util.hasFlag(e.baton.data, 'accepted')) return false;
            //no flags at all => public folder and user is no attendee. Not allowed to change attendee statuses
            if (!util.hasFlag(e.baton.data, 'accepted') && !util.hasFlag(e.baton.data, 'declined') &&
                !util.hasFlag(e.baton.data, 'tentative') && !util.hasFlag(e.baton.data, 'needs_action')) return false;
            // in shared folders we also have to check if we have the permissin to modify
            if ((util.hasFlag(e.baton.data, 'attendee_on_behalf') || util.hasFlag(e.baton.data, 'organizer_on_behalf')) &&
                !(util.hasFlag(e.baton.data, 'attendee') || util.hasFlag(e.baton.data, 'organizer')) &&
                !e.collection.has('modify')) return false;
            return true;
        },
        action: _.partial(acceptDecline, _, true)
    });

    new Action('io.ox/calendar/actions/decline-appointment', {
        requires: function (e) {
            if (!e || !e.baton || !e.baton.data || !e.baton.data.flags) return false;
            if (util.hasFlag(e.baton.data, 'declined')) return false;
            //no flags at all => public folder and user is no attendee. Not allowed to change attendee statuses
            if (!util.hasFlag(e.baton.data, 'accepted') && !util.hasFlag(e.baton.data, 'declined') &&
                !util.hasFlag(e.baton.data, 'tentative') && !util.hasFlag(e.baton.data, 'needs_action')) return false;
            // in shared folders we also have to check if we have the permissin to modify
            if ((util.hasFlag(e.baton.data, 'attendee_on_behalf') || util.hasFlag(e.baton.data, 'organizer_on_behalf')) &&
                !(util.hasFlag(e.baton.data, 'attendee') || util.hasFlag(e.baton.data, 'organizer')) &&
                !e.collection.has('modify')) return false;
            return true;
        },
        action: acceptDecline
    });

    // Mobile multi select extension points
    // delete appointment(s)
    ext.point('io.ox/calendar/mobileMultiSelect/toolbar').extend({
        id: 'delete',
        index: 10,
        draw: function (data) {
            var baton = new ext.Baton({ data: data.data });
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-trash-o" aria-hidden="true">')
                            .on('click', { grid: data.grid }, function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.invoke('io.ox/calendar/detail/actions/delete', null, baton);
                                e.data.grid.selection.clear();
                            })
                    )
                )
            );
        }
    });

    // move appointment(s)
    ext.point('io.ox/calendar/mobileMultiSelect/toolbar').extend({
        id: 'move',
        index: 20,
        draw: function (data) {
            var baton = new ext.Baton({ data: data.data });
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="fa fa-sign-in" aria-hidden="true">')
                            .on('click', { grid: data.grid }, function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.invoke('io.ox/calendar/detail/actions/move', null, baton);
                                // need to clear the selection after aciton is invoked
                                e.data.grid.selection.clear();
                            })
                    )
                )
            );
        }
    });

    // FIXME: should only be visible if rights are ok
    ext.point('io.ox/calendar/detail/actions').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links',
        ref: 'io.ox/calendar/links/inline'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 110,
        prio: 'hi',
        mobile: 'hi',
        id: 'accept',
        label: gt('Accept'),
        ref: 'io.ox/calendar/actions/accept-appointment'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 120,
        prio: 'hi',
        mobile: 'hi',
        id: 'decline',
        label: gt('Decline'),
        ref: 'io.ox/calendar/actions/decline-appointment'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 150,
        prio: 'hi',
        mobile: 'hi',
        id: 'changestatus',
        label: gt('Change status'),
        ref: 'io.ox/calendar/detail/actions/changestatus'
    }));

    // 155 because it's either changestatus or changereminder, never both
    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 155,
        prio: 'hi',
        mobile: 'hi',
        id: 'changereminder',
        label: gt('Change reminder'),
        ref: 'io.ox/calendar/detail/actions/changeAlarms'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 200,
        prio: 'hi',
        mobile: 'lo',
        id: 'edit',
        label: gt('Edit'),
        ref: 'io.ox/calendar/detail/actions/edit'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 300,
        prio: 'hi',
        mobile: 'lo',
        id: 'follow-up',
        //#. Calendar: Create follow-up appointment. Maybe "Folgetermin" in German.
        label: gt('Follow-up'),
        ref: 'io.ox/calendar/detail/actions/follow-up'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 400,
        prio: 'hi',
        mobile: 'lo',
        id: 'delete',
        label: gt('Delete'),
        ref: 'io.ox/calendar/detail/actions/delete'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 500,
        prio: 'lo',
        mobile: 'lo',
        id: 'move',
        label: gt('Move'),
        drawDisabled: true,
        ref: 'io.ox/calendar/detail/actions/move'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 550,
        prio: 'lo',
        id: 'export',
        label: gt('Export'),
        ref: 'io.ox/calendar/detail/actions/export'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 600,
        prio: 'lo',
        id: 'print',
        label: gt('Print'),
        ref: 'io.ox/calendar/detail/actions/print-appointment'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 700,
        prio: 'lo',
        mobile: 'lo',
        id: 'send mail',
        section: 'participants',
        sectionDescription: gt('Participant related actions'),
        label: gt('Send mail to all participants'),
        ref: 'io.ox/calendar/detail/actions/sendmail'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 800,
        prio: 'lo',
        mobile: 'lo',
        id: 'invite',
        section: 'participants',
        sectionDescription: gt('Participant related actions'),
        label: gt('Invite to new appointment'),
        ref: 'io.ox/calendar/detail/actions/invite'
    }));

    ext.point('io.ox/calendar/links/inline').extend(new links.Link({
        index: 900,
        prio: 'lo',
        mobile: 'lo',
        id: 'save as distlist',
        section: 'participants',
        sectionDescription: gt('Participant related actions'),
        label: gt('Save as distribution list'),
        ref: 'io.ox/calendar/detail/actions/save-as-distlist'
    }));

    ext.point('io.ox/calendar/detail/actions-participantrelated').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links-participant',
        ref: 'io.ox/calendar/links/inline-participants',
        classes: 'io-ox-inline-links embedded'
    }));

    ext.point('io.ox/calendar/folderview/premium-area').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-premium-links',
        ref: 'io.ox/calendar/links/premium-links',
        classes: 'list-unstyled'
    }));

    ext.point('io.ox/calendar/links/premium-links').extend(new links.Link({
        index: 100,
        prio: 'hi',
        id: 'share-calendar',
        label: gt('Synchronize calendar'),
        ref: 'io.ox/calendar/premium/actions/share'
    }));
});
