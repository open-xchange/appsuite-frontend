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
    'io.ox/switchboard/views/call-history',
    'io.ox/core/capabilities',
    'io.ox/contacts/model',
    'settings!io.ox/core',
    'gettext!io.ox/switchboard',
    'less!io.ox/switchboard/style'
], function (ext, presence, api, account, actionsUtil, contactsAPI, contactsUtil, callHistory, capabilities, contactsModel, settings, gt) {

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
        index: 400,
        id: 'actions',
        draw: function (baton) {
            if (contactsAPI.looksLikeResource(baton.data)) return;
            var support = api.supports('zoom') || api.supports('jitsi');
            if (!support) return;
            var $actions = $('<div class="action-button-rounded">');
            ext.point('io.ox/contacts/detail/actions').invoke('draw', $actions, baton.clone());
            this.append(
                presence.getPresenceString(baton.data.email1),
                $actions
            );
        }
    });

    ext.point('io.ox/contacts/detail/actions').extend(
        {
            id: 'email',
            index: 100,
            draw: function (baton) {
                if (!capabilities.has('webmail')) return;
                this.append(
                    createButton('io.ox/contacts/actions/send', 'fa-envelope', gt('Email'), baton)
                );
            }
        },
        {
            id: 'chat',
            index: 120,
            draw: function (baton) {
                if (!capabilities.has('chat')) return;
                if (_.device('smartphone || !maintab')) return;
                this.append(
                    createButton('io.ox/chat/actions/start-chat-from-contacts', 'fa-comment', gt('Chat'), baton)
                );
            }
        },
        {
            id: 'call',
            index: 300,
            draw: function (baton) {
                var $ul = $('<ul class="dropdown-menu">');
                ext.point('io.ox/contacts/detail/actions/call').invoke('draw', $ul, baton.clone());
                // check only for visible items (not dividers, etc)
                var hasOptions = $ul.children('[role="presentation"]').length > 0;
                this.append(
                    $('<div class="dropdown">').append(
                        $('<button type="button" class="btn btn-link" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">')
                        .prop('disabled', !hasOptions)
                        .append(
                            $('<div class="icon-container">').append($.icon('fa-phone', false, 'call-icon')),
                            $.txt(gt.pgettext('verb', 'Call')),
                            hasOptions ? $('<i class="fa fa-caret-down" aria-hidden="true">') : $()
                        ),
                        $ul
                    )
                );
            }
        },

        {
            id: 'invite',
            index: 400,
            draw: function (baton) {
                if (!capabilities.has('calendar')) return;
                this.append(
                    createButton('io.ox/contacts/actions/invite', 'fa-calendar-plus-o', gt('Invite'), baton)
                );
            }
        }
    );

    function createButton(action, icon, label, baton) {
        // do not change the initial baton as it is reused
        baton = baton.clone();
        baton.data = [].concat(baton.data);
        var $button = $('<button type="button" class="btn btn-link">')
            .prop('disabled', true)
            .on('click', { baton: baton }, function (e) {
                actionsUtil.invoke(action, e.data.baton);
            })
            .append(
                $('<div class="icon-container">').append($.icon(icon)),
                $.txt(label)
            );
        actionsUtil.checkAction(action, baton).then(function () {
            $button.prop('disabled', false);
        });
        return $button;
    }

    function createConferenceItem(type, title, baton) {
        var disabled = api.isMyself(baton.data.email1) || (!api.isOnline() && type === 'zoom');
        return $('<li role="presentation">').append(
            $('<a href="#">').text(title)
                .toggleClass('disabled', disabled)
            .on('click', baton.data, function (e) {
                e.preventDefault();
                if (!disabled) actionsUtil.invoke('io.ox/switchboard/call-user', ext.Baton({ type: type, data: [e.data] }));
            })
        );
    }

    ext.point('io.ox/contacts/detail/actions/call').extend(
        {
            id: 'zoom',
            index: 100,
            draw: function (baton) {
                if (!api.online) return;
                if (!api.supports('zoom')) return;
                if (!api.isGAB(baton)) return;
                this.append(createConferenceItem('zoom', gt('Call via Zoom'), baton));
            }
        },
        {
            id: 'jitsi',
            index: 200,
            draw: function (baton) {
                if (!api.online) return;
                if (!api.supports('jitsi')) return;
                if (!api.isGAB(baton)) return;
                this.append(createConferenceItem('jitsi', gt('Call via Jitsi'), baton));
            }
        },
        {
            id: 'phone',
            index: 300,
            draw: function (baton) {
                var numbers = phoneFields.map(function (field) {
                    var number = baton.data[field];
                    if (!number) return $();
                    return $('<li role="presentation">').append(
                        $('<a>').attr('href', 'callto:' + number).append(
                            $('<small>').text(contactsModel.fields[field]),
                            $('<br>'),
                            $.txt(number)
                        )
                    );
                });
                if (!numbers.length) return;
                this.append(
                    $('<li class="divider" role="separator">'),
                    numbers
                );
            }
        }
    );

    var phoneFields = [
        'telephone_company', 'telephone_business1', 'telephone_business2',
        'cellular_telephone1', 'cellular_telephone2',
        'telephone_home1', 'telephone_home2', 'telephone_other'
    ];

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

    if (api.supports('zoom')) {
        // Settings
        ext.point('io.ox/settings/pane/tools').extend({
            id: 'zoom',
            title: gt('Zoom Integration'),
            ref: 'io.ox/switchboard',
            index: 10
        });
    }
});
