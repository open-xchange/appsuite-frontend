/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/calendar/actions', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/calendar/api',
    'io.ox/calendar/util',
    'io.ox/core/print',
    'gettext!io.ox/calendar',
    'io.ox/core/capabilities',
    'io.ox/core/folder/api',
    'io.ox/core/yell',
    'io.ox/backbone/views/modal',
    'settings!io.ox/calendar'
], function (ext, actionsUtil, api, util, print, gt, capabilities, folderAPI, yell, ModalDialog, settings) {

    'use strict';

    var Action = actionsUtil.Action;

    // Actions
    new Action('io.ox/calendar/actions/switch-to-list-view', {
        action: function (baton) {
            baton.app.pages.changePage('list', { disableAnimations: true });
        }
    });

    new Action('io.ox/calendar/actions/switch-to-month-view', {
        action: function (baton) {
            baton.app.pages.changePage('month', { disableAnimations: true });
        }
    });

    new Action('io.ox/calendar/actions/switch-to-fullweek-view', {
        toggle: _.device('!smartphone'),
        action: function (baton) {
            baton.app.pages.changePage(baton.app, 'week:week');
        }
    });

    new Action('io.ox/calendar/actions/switch-to-week-view', {
        toggle: _.device('!smartphone'),
        action: function (baton) {
            baton.app.pages.changePage(baton.app, 'week:workweek');
        }
    });

    new Action('io.ox/calendar/actions/switch-to-day-view', {
        action: function (baton) {
            baton.app.pages.changePage(baton.app, 'week:day');
        }
    });

    new Action('io.ox/calendar/detail/actions/sendmail', {
        capabilities: 'webmail',
        collection: 'one',
        every: 'attendees !== undefined',
        action: function (baton) {
            var data = baton.first();
            util.resolveAttendees(data, { filterSelf: true }).done(function (recipients) {
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
                ox.registry.call('mail-compose', 'open', { to: recipients, subject: data.summary });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/invite', {
        capabilities: 'calendar !guest',
        collection: 'one',
        every: 'attendees !== undefined',
        action: function (baton) {
            ox.load(['io.ox/calendar/actions/invite']).done(function (action) {
                action(baton.first());
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/save-as-distlist', {
        capabilities: 'contacts',
        collection: 'one',
        matches: function (baton) {
            var data = baton.first();
            return _.isArray(data.attendees) && data.attendees.length > 1;
        },
        action: function (baton) {
            var data = baton.first();
            util.resolveAttendees(data).done(function (distlist) {
                require(['settings!io.ox/core'], function (coreSettings) {
                    ox.launch('io.ox/contacts/distrib/main')
                        .done(function () {
                            this.create(coreSettings.get('folder/contacts'), {
                                distribution_list: distlist,
                                display_name: data.summary
                            });
                        });
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/edit', {
        collection: 'one && modify',
        every: 'id !== undefined',
        matches: function (baton) {
            var data = baton.first(), folder = folderAPI.pool.getModel(data.folder);
            return util.allowedToEdit(data, folder);
        },
        action: function (baton) {
            ox.load(['io.ox/calendar/actions/edit']).done(function (action) {
                action(baton.first());
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/delete', {
        collection: 'some && delete',
        action: function (baton) {
            ox.load(['io.ox/calendar/actions/delete']).done(function (action) {
                var virtualSeriesIds = [],
                    // map in 2 steps. This way we can clear duplicates before making the api call.
                    defs = _(baton.array()).chain().map(function (event) {
                        return event.folder && event.seriesId && event.id !== event.seriesId ? { folder: event.folder, id: event.seriesId } : false;
                    }).compact().uniq().map(function (event) {
                        return api.get(event).fail(function () {
                            // series could not be found, treat it as a virtual series
                            virtualSeriesIds.push(event.id);
                        });
                    }).valueOf();

                $.when.apply($, defs).always(function () {
                    action(baton.array(), virtualSeriesIds);
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/create', {
        matches: function (data) {
            // if you are not a guest you always have your default folder to create appointments
            if (capabilities.has('!guest')) return true;
            // don't use collection.has(create) here, doesn't work when there is no appointment selected
            var folder = folderAPI.pool.getModel(data.folder_id);
            if (!folder) return false;
            // guests need create permissions in the current folder
            return folder.can('create');
        },
        action: _.debounce(function (baton, obj) {
            ox.load(['io.ox/calendar/actions/create']).done(function (action) {
                action(baton, obj);
            });
        }, 500, true)
    });

    new Action('io.ox/calendar/detail/actions/changeAlarms', {
        collection: 'one',
        matches: function (baton) {
            var data = baton.first(), f = generateFlagHash(data);
            // cannot confirm appointments without proper id or folder (happens when detail view was opened from mail invitation from external calendar)
            // must use buttons in invitation mail instead
            if (!data.id || !data.folder) return false;

            var folder = folderAPI.pool.getModel(data.folder).toJSON();
            // special case. Folder is just a dummy model. User usually has no reading rights and event is only visible in the all public appointments folder. Try to offer reminder change action.
            if (!folder.supported_capabilities && api.isInAllPublic(data) && (f.attendee || f.organizer)) return true;
            // folder must support alarms
            if (folder.supported_capabilities.indexOf('alarms') === -1) return false;
            // In public folders we must be organizer or attendee, not on behalf
            if (folderAPI.is('public', folder) && !(f.attendee || f.organizer)) return false;
            // do not show change reminder as this duplicates "edit"
            if (util.allowedToEdit(data, folder)) return false;
            return true;
        },
        action: function (baton) {
            ox.load(['io.ox/calendar/actions/change-alarms']).done(function (action) {
                action(baton.first());
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/changestatus', {
        collection: 'one',
        matches: function (baton) {
            var data = baton.first(), f = generateFlagHash(data);
            // cannot confirm appointments without proper id (happens when detail view was opened from mail invitation from external calendar)
            // must use buttons in invitation mail instead
            if (!data.id) return false;
            return supportsChangeStatus(f, baton);
        },
        action: function (baton) {
            var data = baton.first();
            ox.load(['io.ox/calendar/actions/acceptdeny']).done(function (action) {
                var noFolderCheck = baton.noFolderCheck;

                if (!noFolderCheck) {
                    folderAPI.pool.getModel(data.folder).toJSON();
                    // special case. Folder is just a dummy model. User usually has no reading rights and event is only visible in the all public appointments folder. Don't perform folder check then
                    if (!folderAPI.pool.getModel(data.folder).toJSON().supported_capabilities && api.isInAllPublic(data)) noFolderCheck = true;
                }
                // get full data if possible
                api.get(data).then(function (obj) {
                    action(obj.toJSON(), { noFolderCheck: noFolderCheck });
                }, function () {
                    action(data, { noFolderCheck: noFolderCheck });
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/follow-up', {
        collection: 'one && create && read',
        action: function (baton) {
            ox.load(['io.ox/calendar/actions/follow-up']).done(function (action) {
                action(baton.model);
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/print-appointment', {
        device: '!smartphone',
        capabilities: 'calendar-printing',
        collection: 'some && read',
        action: function (baton) {

            var list = baton.array();

            if (list.length === 1) {
                print.request('io.ox/calendar/print', list);
                return;
            }

            new ModalDialog({
                title: gt('Do you want the appointments printed in detail or as a compact list?'),
                previousFocus: $('.io-ox-calendar-main .classic-toolbar [data-action="more"]')
            })
                .addCancelButton()
                //#. answer Button to 'Do you want the appointments printed in detail or as a compact list?'
                .addButton({ label: gt('Compact'), action: 'compact', className: 'btn-default' })
                //#. answer Button to 'Do you want the appointments printed in detail or as a compact list?'
                .addButton({ label: gt('Detailed'), action: 'detailed' })
                .on('detailed', function () { print.request('io.ox/calendar/print', list); })
                .on('compact', function () { print.request('io.ox/calendar/print-compact', list); })
                .open();
        }
    });

    new Action('io.ox/calendar/detail/actions/export', {
        collection: 'some && read',
        action: function (baton) {
            require(['io.ox/core/download'], function (download) {
                download.exported({ list: [].concat(baton.data), format: 'ical' });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/print', {
        capabilities: 'calendar-printing',
        action: function (baton) {
            var p = baton.app.perspective;
            if (p.print) p.print();
        }
    });

    new Action('io.ox/calendar/detail/actions/move', {
        collection: 'some && delete',
        // moving recurring events is not supported
        every: 'recurrenceId === undefined',
        action: function (baton) {

            var list = baton.array();

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
                                otherAttendees = util.hasFlag(list[0], 'scheduled'),
                                create = folderAPI.can('create', data),
                                isOrganizer = util.hasFlag(list[0], 'organizer') || util.hasFlag(list[0], 'organizer_on_behalf');
                            // totally awesome check
                            // not same folder, must be folder of same user, public folder(if organizer) or there must only be one attendee(the organizer) , if the source folder is not public, must have create permission in that folder, folder must not be virtual
                            return sameFolder || !((!sourceFolderIsPublic && !otherAttendees) || sameOwner || (isPublic && isOrganizer)) || !create || (options && /^virtual/.test(options.folder));
                        }
                    });
                });
            });
        }
    });

    new Action('io.ox/calendar/detail/actions/change-organizer', {
        toggle: settings.get('chronos/allowChangeOfOrganizer', false),
        collection: 'one && modify',
        matches: function (baton) {
            var data = baton.first();
            if (!data || !data.flags) return false;
            // not allowed if there are external participants (update handling doesnt work correctly + single user contexts doesnt need this)
            if (_(data.attendees).some(function (attendee) { return !_(attendee).has('entity'); })) return false;
            // must have permission, must be organizer (or attendee with change rights) and it must be a group scheduled event (at least 2 participants. For one or zero participants you can just move the event, to achieve the same result)
            return ((util.hasFlag(data, 'organizer') || util.hasFlag(data, 'organizer_on_behalf'))
                    || ((util.hasFlag(data, 'attendee') || util.hasFlag(data, 'attendee_on_behalf')) && data.attendeePrivileges === 'MODIFY'))
                    && util.hasFlag(data, 'scheduled');
        },
        action: function (baton) {
            require(['io.ox/calendar/actions/change-organizer'], function (changeOrganizer) {
                changeOrganizer.openDialog(baton.first());
            });
        }
    });

    new Action('io.ox/calendar/actions/today', {
        matches: function (baton) {
            var p = baton.app.perspective;
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
        device: 'desktop',
        capabilities: 'freebusy !alone !guest',
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

        var data = baton.first(),
            appointment = api.reduce(data),
            def = baton.noFolderCheck ? $.when() : folderAPI.get(appointment.folder),
            confirm = function () {
                $(baton.e.target).addClass('disabled');
                util.confirmWithConflictCheck(appointment, _.extend(util.getCurrentRangeOptions(), { checkConflicts: true })).fail(function (e) {
                    if (e) yell(e);
                }).always(function () {
                    // always unlock the button
                    $(baton.e.target).removeClass('disabled');
                });
            };

        def.always(function (folder) {

            appointment.attendee = {
                // act as folder owner in shared folder
                entity: !folder.error && !baton.noFolderCheck && folderAPI.is('shared', folder) ? folder.created_by : ox.user_id,
                partStat: accept ? 'ACCEPTED' : 'DECLINED'
            };

            if (!appointment.attendee.entity && folder.created_from) {
                var prev = _(data.attendees).find(function (attendee) {
                    return attendee.extendedParameters && attendee.extendedParameters['X-OX-IDENTIFIER'] === folder.created_from.identifier;
                });
                if (prev) {
                    delete appointment.attendee.entity;
                    appointment.attendee.email = prev.email;
                    appointment.attendee.uri = prev.uri;
                }
            }

            // default reminder
            if (accept) appointment.alarms = util.getDefaultAlarms(data);

            // check if only one appointment or the whole series should be accepted
            // treat exceptions as part of the series and offer to accept the series as a whole
            if (data.seriesId && appointment.recurrenceId) {
                $(baton.e.target).addClass('disabled');

                // is this a real series or a virtual series (series is just used to keep track by MW (usually caused if user is invited to an series exception from an external calendar via mail), see MW-1134)
                (data.folder ? api.get({ folder: data.folder, id: data.seriesId }) : $.when()).always(function (seriesMaster) {
                    $(baton.e.target).removeClass('disabled');
                    // error when trying to request series master -> we can only accept this exception
                    if (seriesMaster && seriesMaster.error) return confirm();

                    new ModalDialog({
                        title: gt('Change appointment status'),
                        width: 600
                    })
                    .build(function () {
                        this.$body.append(accept
                            ? gt('This appointment is part of a series. Do you want to confirm the whole series or just one appointment within the series?')
                            : gt('This appointment is part of a series. Do you want to decline the whole series or just one appointment within the series?')
                        );
                    })
                    .addCancelButton({ left: true })
                    .addButton({ label: accept ? gt('Accept appointment') : gt('Decline appointment'), action: 'appointment', className: 'btn-default' })
                    //#. Use singular in this context
                    .addButton({ label: accept ? gt('Accept series') : gt('Decline series'), action: 'series' })
                    .on('action', function (action) {
                        if (action === 'cancel') return;
                        if (action === 'series') {
                            delete appointment.recurrenceId;
                            // use series id to make it work for exceptions
                            if (appointment.id !== data.seriesId) {
                                appointment.id = data.seriesId;
                            }
                        }

                        confirm();
                    })
                    .open();
                });
                return;
            }

            confirm();
        });
    }

    new Action('io.ox/calendar/actions/accept-appointment', {
        collection: 'one',
        matches: function (baton) {
            var f = generateFlagHash(baton.first());
            if (f.accepted) return false;
            return supportsChangeStatus(f, baton);
        },
        action: _.partial(acceptDecline, _, true)
    });

    new Action('io.ox/calendar/actions/decline-appointment', {
        collection: 'one',
        matches: function (baton) {
            var f = generateFlagHash(baton.first());
            if (f.declined) return false;
            return supportsChangeStatus(f, baton);
        },
        action: acceptDecline
    });

    function generateFlagHash(data) {
        var hash = {};
        _(data.flags).values().forEach(function (flag) { hash[flag] = true; });
        return hash;
    }

    function supportsChangeStatus(f, baton) {
        // no flags at all => public folder and user is no attendee. Not allowed to change attendee statuses
        if (!f.accepted && !f.declined && !f.tentative && !f.needs_action) return false;

        // normal attendee or organizer
        if (f.attendee || f.organizer) return true;
        // in shared and public folders we also have to check if we have the permission to modify
        if (f.attendee_on_behalf || f.organizer_on_behalf) return baton.collection.has('modify');
        return true;
    }

    var inlineLinks = [
        {
            index: 100,
            prio: 'hi',
            id: 'edit',
            title: gt('Edit'),
            ref: 'io.ox/calendar/detail/actions/edit'
        },
        {
            index: 110,
            prio: 'hi',
            mobile: 'hi',
            id: 'accept',
            title: gt('Accept'),
            ref: 'io.ox/calendar/actions/accept-appointment'
        },
        {
            index: 120,
            prio: 'hi',
            mobile: 'hi',
            id: 'decline',
            title: gt('Decline'),
            ref: 'io.ox/calendar/actions/decline-appointment'
        },
        {
            index: 150,
            prio: 'hi',
            mobile: 'lo',
            id: 'changestatus',
            title: gt('Change status'),
            ref: 'io.ox/calendar/detail/actions/changestatus'
        },
        {
            // 155 because itwas separated from changestatus. avoid conflicts
            index: 155,
            prio: 'lo',
            mobile: 'lo',
            id: 'changereminder',
            title: gt('Change reminders'),
            ref: 'io.ox/calendar/detail/actions/changeAlarms'
        },
        {
            index: 300,
            prio: 'hi',
            mobile: 'lo',
            id: 'delete',
            title: gt('Delete'),
            ref: 'io.ox/calendar/detail/actions/delete'
        },
        {
            index: 400,
            prio: 'hi',
            mobile: 'lo',
            id: 'follow-up',
            //#. Calendar: Create follow-up appointment. Maybe "Folgetermin" in German.
            title: gt('Follow-up'),
            ref: 'io.ox/calendar/detail/actions/follow-up'
        },
        {
            index: 500,
            prio: 'lo',
            mobile: 'lo',
            id: 'move',
            title: gt('Move'),
            drawDisabled: true,
            ref: 'io.ox/calendar/detail/actions/move'
        },
        {
            index: 550,
            prio: 'lo',
            id: 'export',
            title: gt('Export'),
            ref: 'io.ox/calendar/detail/actions/export'
        },
        {
            index: 600,
            prio: 'lo',
            id: 'print',
            title: gt('Print'),
            ref: 'io.ox/calendar/detail/actions/print-appointment'
        },
        {
            index: 700,
            prio: 'lo',
            mobile: 'lo',
            id: 'send mail',
            section: 'participants',
            sectionTitle: gt('Participant related actions'),
            title: gt('Send email to all participants'),
            ref: 'io.ox/calendar/detail/actions/sendmail'
        },
        {
            index: 800,
            prio: 'lo',
            mobile: 'lo',
            id: 'invite',
            section: 'participants',
            sectionTitle: gt('Participant related actions'),
            title: gt('Invite to new appointment'),
            ref: 'io.ox/calendar/detail/actions/invite'
        },
        {
            index: 900,
            prio: 'lo',
            mobile: 'lo',
            id: 'save as distlist',
            section: 'participants',
            sectionTitle: gt('Participant related actions'),
            title: gt('Save as distribution list'),
            ref: 'io.ox/calendar/detail/actions/save-as-distlist'
        },
        {
            index: 1000,
            prio: 'lo',
            mobile: 'lo',
            id: 'change-organizer',
            section: 'participants',
            sectionTitle: gt('Participant related actions'),
            title: gt('Change organizer'),
            ref: 'io.ox/calendar/detail/actions/change-organizer'
        }
    ];

    ext.point('io.ox/calendar/links/inline').extend(inlineLinks);

    ext.point('io.ox/calendar/folderview/premium-area').extend({
        index: 100,
        id: 'inline-premium-links',
        draw: function (baton) {
            this.append(
                baton.renderActions('io.ox/calendar/links/premium-links', baton)
            );
        }
    });

    ext.point('io.ox/calendar/links/premium-links').extend({
        index: 100,
        id: 'share-calendar',
        action: 'io.ox/calendar/premium/actions/share',
        title: gt('Synchronize calendar')
    });
});
