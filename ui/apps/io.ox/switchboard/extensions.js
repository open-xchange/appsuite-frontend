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

define('io.ox/switchboard/extensions', [
    'io.ox/core/extensions',
    'io.ox/switchboard/presence',
    'io.ox/switchboard/api',
    'io.ox/core/api/account',
    'io.ox/backbone/views/actions/util',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'io.ox/switchboard/standalone/extensions',
    'io.ox/switchboard/views/zoom-meeting',
    'io.ox/switchboard/views/call-history',
    'io.ox/core/capabilities',
    'settings!io.ox/core',
    'gettext!io.ox/switchboard'
], function (ext, presence, api, account, actionsUtil, contactsAPI, contactsUtil, util, ZoomMeetingView, callHistory, capabilities, settings, gt) {

    'use strict';

    // no presence state for anonymous guests (check if they are allowed to edit their contact/user data to distinguish between invited by mail or anonymous link)
    if (capabilities.has('guest') && settings.get('user/internalUserEdit', true) === false) return;

    // extend account dropdown
    ext.point('io.ox/core/appcontrol/right/account').extend({
        id: 'availability',
        index: 10,
        extend: function () {
            var self = this;
            function addPresenceIcon() {
                _.defer(function () {
                    self.$toggle.append(presence.getPresenceIcon(api.userId));
                });
            }
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

            // redraw presence icon after updating contact picture (OXUIB-497)
            contactsAPI.on('reset:image update:image', addPresenceIcon);

            // respond to automatic state changes
            presence.on('change-own-availability', function (availability) {
                this.model.set('availability', availability);
            }.bind(this));

            // finally, add presence icon to dropdown node
            addPresenceIcon();
        }
    });

    var availabilities = {
        online: gt('Online'),
        absent: gt('Absent'),
        busy: gt('Busy'),
        invisible: gt('Invisible')
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
                    fields.presence.toggle(String(data.folder_id) === contactsUtil.getGabId());
                    var icon = presence.getPresenceIcon(data.email1);
                    fields.presence.replaceWith(icon);
                    fields.presence = icon;
                }
            });
        }
    });

    // add to contact detail view
    ext.point('io.ox/contacts/detail/summary').extend({
        index: 350,
        id: 'presence',
        draw: function (baton) {
            if (contactsAPI.looksLikeResource(baton.data)) return;
            this.append(presence.getPresenceString(baton.data.email1));
        }
    });

    ext.point('io.ox/contacts/detail/actions').extend(
        {
            id: 'chat',
            index: 120,
            draw: function (baton) {
                if (!capabilities.has('chat')) return;
                if (_.device('smartphone || !maintab')) return;
                this.append(
                    util.createButton('io.ox/chat/actions/start-chat-from-contacts', 'fa-comment', gt('Chat'), baton)
                );
            }
        }
    );

    util.createConferenceItem = function (type, title, baton) {
        var disabled = api.isMyself(baton.data.email1) || (!api.isOnline() && type === 'zoom');
        return $('<li role="presentation">').append(
            $('<a href="#">').text(title)
                .toggleClass('disabled', disabled)
            .on('click', baton.data, function (e) {
                e.preventDefault();
                if (!disabled) actionsUtil.invoke('io.ox/switchboard/call-user', ext.Baton({ type: type, data: [e.data] }));
            })
        );
    };

    ext.point('io.ox/contacts/detail/actions/call').extend(
        {
            id: 'zoom',
            index: 100,
            draw: function (baton) {
                if (!api.online) return;
                if (!api.supports('zoom')) return;
                if (!api.isGAB(baton)) return;
                this.append(util.createConferenceItem('zoom', gt('Call via Zoom'), baton));
            }
        }
    );

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
    // ext.point('io.ox/core/person').extend({
    //     id: 'presence',
    //     draw: function (baton) {
    //         var id = baton.halo.email;
    //         if (!api.isInternal(id)) return;
    //         this.prepend(presence.getPresenceDot(id));
    //     }
    // });

    // extend participants
    // ext.point('io.ox/participants/view').extend({
    //     id: 'presence',
    //     render: function (baton) {
    //         // calendar has email, distribution lists email1, for example
    //         var id = baton.model.get('email') || baton.model.get('email1');
    //         if (!api.isInternal(id)) return;
    //         this.append(presence.getPresenceIcon(id));
    //     }
    // });

    // disable calendar details (to get some room)
    // ext.point('io.ox/calendar/detail').disable('details');

    var supportsZoom = api.supports('zoom');

    if (supportsZoom) {
        ext.point('io.ox/calendar/conference-solutions').extend({
            id: 'zoom',
            index: 200,
            value: 'zoom',
            label: gt('Zoom Meeting'),
            joinLabel: gt('Join Zoom meeting'),
            render: function (view) {
                this.append(
                    new ZoomMeetingView({ appointment: view.appointment }).render().$el
                );
            }
        });
    }

    // add call history
    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'call-history',
        // 100 is notifications, 120 is app launcher
        index: 110,
        draw: function () {
            if (!api.supports('history')) return;
            this.append(callHistory.view.$el);
        }
    });

    if (supportsZoom) {
        // Settings
        ext.point('io.ox/settings/pane/tools').extend({
            id: 'zoom',
            title: gt('Zoom Integration'),
            ref: 'io.ox/switchboard',
            index: 10
        });
    }
});
