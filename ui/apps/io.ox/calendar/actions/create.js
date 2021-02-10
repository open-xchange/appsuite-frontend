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
    'io.ox/backbone/views/modal',
    'io.ox/core/api/user',
    'io.ox/contacts/util',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar',
    'settings!io.ox/calendar',
    'io.ox/core/capabilities'
], function (api, ModalDialog, userAPI, util, calendarUtil, gt, settings, capabilities) {

    'use strict';

    function openEditDialog(params) {
        ox.load(['io.ox/calendar/edit/main', 'io.ox/calendar/model']).done(function (edit, models) {
            edit.getApp().launch().done(function () {
                this.create(new models.Model(params));
            });
        });
    }

    function showDialog(params, folder) {
        var dev = ((folder.created_from && util.getFullName(folder.created_from)) ? $.when($.when({
            cn: folder.created_from.display_name,
            email: folder.created_from.contact.email1,
            uri: 'mailto:' + folder.created_from.contact.email1,
            entity: folder.created_from.entity,
            contact: folder.created_from.contact
        })) : userAPI.get({ id: folder.created_by }));
        dev.done(function (user) {
            new ModalDialog({
                title: gt('Appointments in shared calendars'),
                width: '550', // standard 500px is too small in some languages (e.g. german)
                description: [
                    $('<p>').text(gt('The selected calendar is shared by %1$s. Appointments in shared calendars will generally be created on behalf of the owner.', util.getFullName(user)) + ' '),
                    $('<p>').html(gt('Do you really want to create an appointment <b>on behalf of the folder owner</b> or do you want to create an appointment <b>with the folder owner</b> in your own calendar?'))
                ]
            })
            .addCancelButton({ left: true })
            .addButton({ label: gt('Invite owner'), action: 'invite', className: 'btn-default' })
            .addButton({ label: gt('On behalf of the owner'), action: 'behalf' })
            .on('behalf', function () { openEditDialog(params); })
            .on('invite', function () {
                params.attendees = calendarUtil.createAttendee(user);
                params.folder = settings.get('chronos/defaultFolderId');
                openEditDialog(params);
            })
            .open();
        });
    }

    function showDialogPublic(params) {
        var folderTitle = api.pool.getModel(params.folder).get('title');
        // standard 500px is too small in some languages (e.g. german)
        new ModalDialog({
            title: gt('Appointments in public calendars'),
            description: gt('The selected calendar "%1$s" is public. Do you really want to create an appointment in this calendar?', folderTitle),
            width: '550' })
        .addCancelButton()
        .addButton({ label: gt('Create in public calendar'), action: 'create' })
        .on('create', function () {
            openEditDialog(params);
        })
        .open();
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
            // there is no default folder for guests so always return the requested folder
            if (api.can('create', folder) || capabilities.has('guest')) return folder;
            params.folder = settings.get('chronos/defaultFolderId');
            return api.get(params.folder);
        }).done(function (folder) {
            if (!api.can('create', folder)) return;
            // guests can only create in the current folder
            if (api.is('shared', folder) && !capabilities.has('guest')) showDialog(params, folder);
            else if (api.is('public', folder) && !capabilities.has('guest')) showDialogPublic(params, folder);
            else openEditDialog(params);
        });
    };
});
