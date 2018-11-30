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

define('io.ox/calendar/actions/create', [
    'io.ox/core/folder/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/api/user',
    'io.ox/contacts/util',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar',
    'settings!io.ox/calendar'
], function (api, dialogs, userAPI, util, calendarUtil, gt, settings) {

    'use strict';

    function openEditDialog(params) {
        ox.load(['io.ox/calendar/edit/main', 'io.ox/calendar/model']).done(function (edit, models) {
            edit.getApp().launch().done(function () {
                this.create(new models.Model(params));
            });
        });
    }

    function showDialog(params, folder) {

        userAPI.get({ id: folder.created_by }).done(function (user) {

            var fullname = util.getFullName(user);
            // standard 500px is too small in some languages (e.g. german)
            new dialogs.ModalDialog({ width: '550' })
            .header(
                $('<h4>').text(gt('Appointments in shared calendars'))
            )
            .build(function () {
                this.getContentNode().append(
                    $('<p>').text(gt('The selected calendar is shared by %1$s. Appointments in shared calendars will generally be created on behalf of the owner.', fullname) + ' '),
                    $('<p>').html(gt('Do you really want to create an appointment <b>on behalf of the folder owner</b> or do you want to create an appointment <b>with the folder owner</b> in your own calendar?'))
                );
            })
            .addPrimaryButton('behalf', gt('On behalf of the owner'))
            .addButton('invite', gt('Invite owner'))
            .addAlternativeButton('cancel', gt('Cancel'))
            .on('behalf', function () {
                openEditDialog(params);
            })
            .on('invite', function () {
                params.attendees = calendarUtil.createAttendee(user);
                params.folder = settings.get('chronos/defaultFolderId');
                openEditDialog(params);
            })
            .show();
        });
    }

    function showDialogPublic(params) {
        var folderTitle = api.pool.getModel(params.folder).get('title');
        // standard 500px is too small in some languages (e.g. german)
        new dialogs.ModalDialog({ width: '550' })
        .header(
            $('<h4>').text(gt('Appointments in public calendars'))
        )
        .build(function () {
            this.getContentNode().append(
                // .# Variable will be replaced with the name of the public calendar
                $('<p>').text(gt('The selected calendar "%1$s" is public. Do you really want to create an appointment in this calendar?', folderTitle))
            );
        })
        .addPrimaryButton('create', gt('Create in public calendar'))
        .addAlternativeButton('cancel', gt('Cancel'))
        .on('create', function () {
            openEditDialog(params);
        })
        .show();
    }

    return function (baton, obj) {

        obj = obj || {};
        // FIXME: if this action is invoked by the menu button, both
        // arguments are the same (the app)
        var params = {
            folder: obj.folder || baton.app.folder.get()
        };

        if (obj && obj.startDate) {
            _.extend(params, obj);
        } else {
            var refDate = moment().startOf('hour').add(1, 'hours'),
                perspective = baton.app.perspective,
                now = _.now(), range;

            switch (perspective.getName()) {
                case 'week':
                    range = calendarUtil.getCurrentRangeOptions();
                    break;
                case 'month':
                    range = {
                        rangeStart: perspective.current,
                        rangeEnd: moment(perspective.current).endOf('month')
                    };
                    break;
                case 'year':
                    range = {
                        rangeStart: moment({ year: perspective.year }),
                        rangeEnd: moment({ year: perspective.year }).endOf('year')
                    };
                    break;
                default:
            }

            if (range && (moment(range.rangeStart).valueOf() > now || now > moment(range.rangeEnd).valueOf())) {
                // use first visible date if today is not visible
                refDate = moment(range.rangeStart).hours(10);
            }

            params.startDate = { value: refDate.format('YYYYMMDD[T]HHmmss'), tzid: refDate.tz() };
            params.endDate = { value: refDate.add(1, 'hours').format('YYYYMMDD[T]HHmmss'), tzid: refDate.tz() };
        }

        // show warning for shared folders
        api.get(params.folder).then(function (folder) {
            if (api.can('create', folder)) return folder;
            params.folder = settings.get('chronos/defaultFolderId');
            return api.get(params.folder);
        }).done(function (folder) {
            if (!api.can('create', folder)) return;
            if (api.is('shared', folder)) showDialog(params, folder);
            else if (api.is('public', folder)) showDialogPublic(params, folder);
            else openEditDialog(params);
        });
    };
});
