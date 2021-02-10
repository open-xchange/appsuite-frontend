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

define('io.ox/switchboard/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/core/settings/util',
    'io.ox/core/capabilities',
    'io.ox/backbone/views/extensible',
    'io.ox/backbone/views/disposable',
    'io.ox/switchboard/api',
    'io.ox/switchboard/zoom',
    'io.ox/contacts/util',
    'settings!io.ox/switchboard',
    'gettext!io.ox/switchboard'
], function (ext, util, capabilities, ExtensibleView, DisposableView, api, zoom, contactsUtil, settings, gt) {

    'use strict';

    ext.point('io.ox/switchboard/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/switchboard/settings/detail/view', model: settings })
                .build(function () {
                    this.listenTo(settings, 'change', function () {
                        settings.saveAndYell();
                    });
                })
                .render().$el
            );
        }
    });

    var INDEX = 100;

    ext.point('io.ox/switchboard/settings/detail/view').extend(
        {
            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.header(gt('Zoom Integration'))
                );
            }
        },
        {
            id: 'account',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    new AccountView().render().$el
                );
            }
        },
        {
            id: 'appointments',
            index: INDEX += 100,
            render: function () {
                if (!capabilities.has('calendar')) return;
                this.$el.append(
                    util.fieldset(
                        gt('Appointments'),
                        util.checkbox('zoom/addMeetingPassword', gt('Always add a random meeting password'), settings),
                        //#. Automatically copies the meeting link into an appointment's location field
                        util.checkbox('zoom/autoCopyToLocation', gt('Automatically copy link to location'), settings),
                        util.checkbox('zoom/autoCopyToDescription', gt('Automatically copy dial-in information to description'), settings)
                    )
                );
            }
        },
        {
            id: 'calls',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(
                        gt('Incoming calls'),
                        util.checkbox('call/showNativeNotifications', gt('Show desktop notifications'), settings),
                        util.checkbox('call/useRingtones', gt('Play ringtone on incoming call'), settings)
                    )
                );
            }
        },
        {
            id: 'dialin',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(
                        gt('Dial-in numbers'),
                        $('<p>').text(
                            //#. pro and business are names
                            gt('If you have a professional Zoom account, Zoom offers dial-in numbers per country and lets you choose which countries appear in meeting invitations.')
                        ),
                        $('<p>').text(
                            gt('You can edit the list of countries in your Zoom profile.')
                        ),
                        $('<p>').append(
                            $('<a href="" rel="noopener" target="_blank">')
                            .attr('href', 'https://zoom.us/profile/setting?tab=telephony')
                            .append(
                                $.txt(gt('Open Zoom profile')),
                                $('<i class="fa fa-external-link" aria-hidden="true" style="margin-left: 8px">')
                            )
                        )
                    )
                );
            }

        }
    );

    var AccountView = DisposableView.extend({
        className: 'conference-account-view',
        events: {
            'click [data-action="add"]': 'onAdd',
            'click [data-action="remove"]': 'onRemove'
        },
        initialize: function () {
            this.listenTo(ox, 'zoom:tokens:added', this.render);
            this.listenTo(ox, 'switchboard:disconnect switchboard:reconnect', this.render);
        },
        render: function () {
            this.$el.empty().append(this.$account);
            if (api.isOnline()) {
                zoom.getAccount().then(
                    this.renderAccount.bind(this),
                    this.renderMissingAccount.bind(this)
                );
            } else {
                this.renderSwitchboardOffline();
            }
            return this;
        },
        renderMissingAccount: function () {
            this.$el.empty().append(
                $('<p>').text(
                    gt('You first need to connect %1$s with Zoom. To do so, you need a Zoom Account. If you don\'t have an account yet, it is sufficient to create a free one.', ox.serverConfig.productName)
                ),
                // add button
                $('<button type="button" class="btn btn-primary" data-action="add">').text(
                    gt('Connect with Zoom')
                )
            );
        },
        renderAccount: function (data) {
            var name = contactsUtil.getFullName(data);
            var pmi = data.pmi && ('https://zoom.us/j/' + String(data.pmi).replace(/\D+/g, ''));
            this.$el.empty().append(
                $('<p>').text(
                    gt('You have linked the following Zoom account:')
                ),
                $('<div class="conference-account">').append(
                    // name
                    name && $('<div class="name">').text(name),
                    // email
                    data.email && $('<div>').append(
                        $('<a target="_blank" rel="noopener">')
                        .attr('href', 'mailto:' + data.email)
                        .text(data.email)
                    ),
                    // personal meeting
                    pmi && $('<div>').append(
                        $.txt(gt('Personal Meeting ID:') + ' '),
                        $('<a target="_blank" rel="noopener">')
                        .attr('href', pmi)
                        .text(data.pmi)
                    ),
                    // remove button
                    $('<button type="button" class="btn btn-default" data-action="remove">').text(gt('Remove account'))
                )
            );
        },
        renderSwitchboardOffline: function () {
            this.$el.empty().append(
                $('<p class="alert alert-warning">').text(
                    gt('The Zoom integration service is currently unavailable. Please try again later.')
                )
            );
        },
        onAdd: function () {
            zoom.startOAuthHandshake();
        },
        onRemove: function () {
            zoom.removeAccount().then(this.renderMissingAccount.bind(this));
        }
    });
});
