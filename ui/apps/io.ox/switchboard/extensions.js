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
    'io.ox/switchboard/views/jitsi-meeting',
    'io.ox/switchboard/views/call-history',
    'io.ox/core/capabilities',
    'io.ox/contacts/model',
    'settings!io.ox/core',
    'gettext!io.ox/switchboard',
    'less!io.ox/switchboard/style'
], function (ext, presence, api, account, mini, DisposableView, actionsUtil, contactsAPI, ConferenceSelectView, ZoomMeetingView, JitsiMeetingView, callHistory, capabilities, contactsModel, settings, gt) {

    'use strict';

    // no presence state for anonymous guests (check if they are allowed to edit their contact/user data to distinguish between invited by mail or anonymous link)
    if (capabilities.has('guest') && settings.get('user/internalUserEdit', true) === false) return;

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
            _.defer(function () {
                this.$toggle.append(presence.getPresenceIcon(api.userId));
            }.bind(this));
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
            var $actions = $('<div class="switchboard-actions">');
            ext.point('io.ox/contacts/detail/actions').invoke('draw', $actions, baton.clone());
            this.append(
                presence.getPresenceString(baton.data.email1),
                $actions
            );
        }
    });

    ext.point('io.ox/contacts/detail/actions').extend(
        {
            id: 'call',
            index: 100,
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
                            $('<i class="fa fa-phone" aria-hidden="true">'),
                            $.txt(gt.pgettext('verb', 'Call')),
                            hasOptions ? $('<i class="fa fa-caret-down" aria-hidden="true">') : $()
                        ),
                        $ul
                    )
                );
            }
        },
        {
            id: 'email',
            index: 200,
            draw: function (baton) {
                if (!capabilities.has('webmail')) return;
                this.append(
                    createButton('io.ox/contacts/actions/send', 'fa-envelope', gt('Email'), baton)
                );
            }
        },
        {
            id: 'invite',
            index: 300,
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
                $('<i class="fa" aria-hidden="true">').addClass(icon),
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

    // add to contact detail view
    ext.point('io.ox/calendar/detail').extend({
        after: 'location',
        id: 'join',
        draw: function (baton) {
            // TODO: Split this for compability with pure location and real conference
            // conference field should also be printed in the view
            var match = [], conference = api.getConference(baton.data.conferences), title;
            if (conference) {
                match.push(conference.joinURL);
                title = getTitle(conference);
            } else {
                match = String(baton.data.location).match(/(https:\/\/.*?\.zoom\.us\S+)/i);
                title = gt('Join Zoom meeting');
            }
            if (!match) return;
            this.append(
                $('<div class="switchboard-actions horizontal">').append(
                    // Call
                    $('<button type="button" class="btn btn-link" data-action="join">')
                        .append(
                            $('<i class="fa fa-phone" aria-hidden="true">'),
                            $('<div>').text(title)
                        )
                        .on('click', function () {
                            window.open(match[0]);
                        })
                )
            );
            // avoid actions
            baton.disable('io.ox/calendar/detail', 'actions');

            function getTitle(conference) {
                switch (conference.type) {
                    case 'zoom': return gt('Join Zoom meeting');
                    case 'jitsi': return gt('Join Jitsi meeting');
                    default: return gt('Join conference call');
                }
            }
        }
    });

    // edit appointment
    ext.point('io.ox/calendar/edit/section').extend({
        id: 'conference',
        before: 'location',
        draw: function (baton) {
            var point = ext.point('io.ox/calendar/conference-solutions');
            if (point.list().length <= 1) return;
            new ConferenceSelectView({ el: this, appointment: baton.model, point: point }).render();
        }
    });

    var solutions = ext.point('io.ox/calendar/conference-solutions')
        .extend({ id: 'none', index: 100, value: 'none', label: gt('None') });

    var supportsZoom = api.supports('zoom'),
        supportsJitsi = api.supports('jitsi');

    if (supportsZoom || supportsJitsi) {

        if (supportsZoom) {
            solutions.extend({
                id: 'zoom',
                index: 200,
                value: 'zoom',
                label: gt('Zoom Meeting'),
                render: function (view) {
                    this.append(
                        new ZoomMeetingView({ appointment: view.appointment }).render().$el
                    );
                }
            });
        }

        if (supportsJitsi) {
            solutions.extend({
                id: 'jitsi',
                index: 300,
                value: 'jitsi',
                label: gt('Jitsi Meeting'),
                render: function (view) {
                    this.append(
                        new JitsiMeetingView({ appointment: view.appointment }).render().$el
                    );
                }
            });
        }

        // move location to later position
        ext.point('io.ox/calendar/edit/section').replace({ id: 'location', index: 750 });
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
