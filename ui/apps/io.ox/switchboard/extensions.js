/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/switchboard/extensions', [
    'io.ox/core/extensions',
    'io.ox/switchboard/presence',
    'io.ox/switchboard/api',
    'io.ox/core/api/account',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/disposable',
    'io.ox/backbone/views/actions/util',
    'io.ox/contacts/api',
    'io.ox/switchboard/views/conference-select',
    'io.ox/switchboard/views/zoom-meeting',
    'settings!io.ox/core',
    'gettext!io.ox/switchboard'
], function (ext, presence, api, account, mini, DisposableView, actionsUtil, contactsAPI, ConferenceSelectView, ZoomMeetingView, settings, gt) {

    'use strict';

    // extend account dropdown
    ext.point('io.ox/core/appcontrol/right/dropdown').extend({
        id: 'availability',
        index: 10,
        extend: function () {
            // add to account dropdown
            var availability = presence.getMyAvailability();
            this.model.set('availability', availability);
            this.group(gt('Availability'));
            var options = { radio: true, group: true };
            _(availabilities).keys().forEach(function (type) {
                options.icon = presence.getFixedPresenceIcon(type);
                this.option('availability', type, availabilities[type], options);
            }, this);
            this.divider();

            // respond to user changes
            this.model.on('change:availability', function (model, availability) {
                presence.changeOwnAvailability(availability);
            });

            // respond to automatic state changes
            presence.on('change-own-availability', function (availability) {
                this.model.set('availability', availability);
            }.bind(this));

            // finally, add presence icon to dropdown node
            this.$el.append(presence.getPresenceIcon(api.userId));
        }
    });

    var availabilities = {
        online: gt('Online'),
        absent: gt('Absent'),
        busy: gt('Busy'),
        offline: gt('Offline')
    };

    // extend list view in contacts
    ext.point('io.ox/contacts/mediator').extend({
        id: 'presence',
        after: 'vgrid',
        setup: function (app) {
            app.grid.addTemplate({
                build: function () {
                    var $el = $('<div class="presence">');
                    this.append($el);
                    return { presence: $el };
                },
                set: function (data, fields) {
                    fields.presence.toggle(data.folder_id === 6);
                    fields.presence.replaceWith(presence.getPresenceIcon(data.email1));
                }
            });
        }
    });

    // add to contact detail view
    ext.point('io.ox/contacts/detail/summary').extend({
        index: 400,
        id: 'actions',
        draw: function (baton) {
            if (contactsAPI.looksLikeResource(baton.data)) return;
            this.append(
                presence.getPresenceString(baton.data.email1),
                $('<div class="switchboard-actions">').append(
                    // Call
                    $('<button class="btn btn-link" data-action="call">')
                        .prop('disabled', api.isMyself(baton.data.email1))
                        .append(
                            $('<i class="fa fa-phone" aria-hidden="true">'),
                            $.txt('Call')
                        ),
                    // Chat
                    $('<button class="btn btn-link" data-action="chat">')
                        .append(
                            $('<i class="fa fa-comment" aria-hidden="true">'),
                            $.txt('Chat')
                        ),
                    // Email
                    $('<button class="btn btn-link" data-action="send">')
                        .append(
                            $('<i class="fa fa-envelope" aria-hidden="true">'),
                            $.txt('Email')
                        ),
                    // Invite
                    $('<button class="btn btn-link" data-action="invite">')
                        .append(
                            $('<i class="fa fa-calendar-plus-o" aria-hidden="true">'),
                            $.txt('Invite')
                        )
                )
                .on('click', 'button', baton.data, function (e) {
                    var action = $(e.currentTarget).data('action'),
                        baton = ext.Baton({ data: [e.data] });
                    switch (action) {
                        case 'call':
                            actionsUtil.invoke('io.ox/switchboard/call-user', baton);
                            break;
                        case 'chat':
                            actionsUtil.invoke('io.ox/switchboard/wall-user', baton);
                            break;
                        case 'send':
                            actionsUtil.invoke('io.ox/contacts/actions/send', baton);
                            break;
                        case 'invite':
                            actionsUtil.invoke('io.ox/contacts/actions/invite', baton);
                            break;
                        // no default
                    }
                })
            );
        }
    });

    // extend list view in mail
    ext.point('io.ox/mail/listview/item/default').extend({
        id: 'presence',
        after: 'picture',
        draw: function (baton) {
            if (!baton.app) return;
            if (!baton.app.props.get('contactPictures')) return;
            var data = baton.data;
            var who = account.is('sent|drafts', data.folder_id) ? data.to : data.from;
            if (!who || !who.length) return;
            var id = who[0][1];
            if (!api.isInternal(id)) return;
            this.append(presence.getPresenceDot(id));
        }
    });

    // extend mail detail view
    ext.point('io.ox/mail/detail/header').extend({
        id: 'presence',
        after: 'picture',
        draw: function (baton) {
            var who = baton.data.from;
            if (!who || !who.length) return;
            var id = who[0][1];
            if (!api.isInternal(id)) return;
            this.append(presence.getPresenceIcon(id));
        }
    });

    // extend recipients
    ext.point('io.ox/core/person').extend({
        id: 'presence',
        draw: function (baton) {
            var id = baton.halo.email;
            if (!api.isInternal(id)) return;
            this.prepend(presence.getPresenceDot(id));
        }
    });

    // extend participants
    ext.point('io.ox/participants/view').extend({
        id: 'presence',
        render: function (baton) {
            // calendar has email, distribution lists email1, for example
            var id = baton.model.get('email') || baton.model.get('email1');
            if (!api.isInternal(id)) return;
            this.append(presence.getPresenceIcon(id));
        }
    });

    // disable calendar details (to get some room)
    ext.point('io.ox/calendar/detail').disable('details');

    // add to contact detail view
    ext.point('io.ox/calendar/detail').extend({
        after: 'location',
        id: 'join',
        draw: function (baton) {
            console.log('actions', baton.data);
            var match = String(baton.data.location).match(/(https:\/\/.*?\.zoom\.us\S+)/i);
            console.log('zoom?', match, 'location', baton.data.location);
            if (!match) return;
            this.append(
                $('<div class="switchboard-actions horizontal">').append(
                    // Call
                    $('<button class="btn btn-link" data-action="join">')
                        .append(
                            $('<i class="fa fa-phone" aria-hidden="true">'),
                            $.txt('Join')
                        )
                        .on('click', function () {
                            window.open(match[0]);
                        })
                )
            );
            // avoid actions
            baton.disable('io.ox/calendar/detail', 'actions');
        }
    });

    // edit appointment
    ext.point('io.ox/calendar/edit/section').extend({
        id: 'conference',
        before: 'location',
        draw: function (baton) {
            var point = ext.point('io.ox/calendar/conference-solutions');
            if (point.list().length <= 1) return;
            new ConferenceSelectView({ el: this, model: baton.model, point: point }).render();
        }
    });

    var solutions = ext.point('io.ox/calendar/conference-solutions')
        .extend({ id: 'none', index: 100, value: 'none', label: gt('None') });

    //
    // Zoom
    //
    (function () {

        if (!settings.get('switchboard/host')) return;

        solutions.extend({
            id: 'zoom',
            index: 200,
            value: 'zoom',
            label: gt('Zoom Meeting'),
            render: function (view) {
                this.append(
                    new ZoomMeetingView({ appointment: view.model }).render().$el
                );
            }
        });

    }());

    //
    // Jitsi
    //
    solutions.extend({
        id: 'jitsi',
        index: 300,
        value: 'jitsi',
        label: gt('Jitsi Meeting'),
        render: function () {

        }
    });

    // move location to later position
    ext.point('io.ox/calendar/edit/section').replace({ id: 'location', index: 750 });

    // add to contact detail view
    ext.point('io.ox/calendar/detail').extend({
        after: 'details',
        id: 'actions',
        draw: function (baton) {
            console.log('actions', baton.data);
            this.append(
                $('<div class="switchboard-actions">').append(
                    // Call
                    $('<button class="btn btn-link" data-action="call">')
                        .append(
                            $('<i class="fa fa-phone" aria-hidden="true">'),
                            $.txt('Call')
                        ),
                    // Chat
                    $('<button class="btn btn-link" data-action="chat">')
                        .append(
                            $('<i class="fa fa-comment" aria-hidden="true">'),
                            $.txt('Chat')
                        ),
                    // Email
                    $('<button class="btn btn-link" data-action="send">')
                        .append(
                            $('<i class="fa fa-envelope" aria-hidden="true">'),
                            $.txt('Email')
                        )
                )
                .on('click', 'button', { baton: baton }, function (e) {
                    var action = $(e.currentTarget).data('action'),
                        baton = e.data.baton,
                        data = _(baton.data.attendees).map(function (attendee) { return { email1: attendee.email, folder_id: 6 }; });
                    switch (action) {
                        case 'call':
                            actionsUtil.invoke('io.ox/switchboard/call-user', ext.Baton({ data: data }));
                            break;
                        case 'chat':
                            actionsUtil.invoke('io.ox/switchboard/wall-user', ext.Baton({ data: data }));
                            break;
                        case 'send':
                            actionsUtil.invoke('io.ox/calendar/detail/actions/sendmail', ext.Baton({ data: [baton.data] }));
                            break;
                        // no default
                    }
                })
            );
        }
    });
});
