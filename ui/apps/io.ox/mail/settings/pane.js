/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define.async('io.ox/mail/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/core/capabilities',
    'io.ox/core/settings/util',
    'io.ox/core/notifications',
    'io.ox/mail/mailfilter/vacationnotice/model',
    'io.ox/mail/mailfilter/autoforward/model',
    'io.ox/core/api/mailfilter',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (ext, ExtensibleView, capabilities, util, notifications, vacationNoticeModel, autoforwardModel, mailfilter, settings, gt) {

    'use strict';

    // not possible to set nested defaults, so do it here
    if (settings.get('features/registerProtocolHandler') === undefined) {
        settings.set('features/registerProtocolHandler', true);
    }

    ext.point('io.ox/mail/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/mail/settings/detail/view', model: settings })
                .inject({
                    // this gets overwritten elsewhere
                    getSoundOptions: function () {
                        return [{ label: gt('Bell'), value: 'bell' }];
                    }
                })
                .build(function () {
                    this.listenTo(settings, 'change', function () {
                        settings.saveAndYell().then(
                            function ok() {
                                // update mail API
                                require(['io.ox/mail/api'], function (mailAPI) {
                                    mailAPI.updateViewSettings();
                                });
                            },
                            function fail() {
                                notifications.yell('error', gt('Could not save settings'));
                            }
                        );
                    });
                })
                .render().$el
            );
        }
    });

    function isConfigurable(id) {
        return settings.isConfigurable(id);
    }

    var INDEX = 0;

    ext.point('io.ox/mail/settings/detail/view').extend(
        //
        // Header
        //
        {
            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.addClass('io-ox-mail-settings').append(
                    util.header(gt.pgettext('app', 'Mail'))
                );
            }
        },
        //
        // Buttons
        //
        {
            id: 'buttons',
            index: INDEX += 100,
            render: function (baton) {
                this.$el.append(
                    baton.branch('buttons', null, $('<div class="form-group buttons">'))
                );
            }
        },
        //
        // Display
        //
        {
            id: 'display',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(
                        //#. the noun, not the verb (e.g. German "Anzeige")
                        gt.pgettext('noun', 'View'),
                        // html
                        util.checkbox('allowHtmlMessages', gt('Allow html formatted emails'), settings),
                        // colored quotes
                        util.checkbox('isColorQuoted', gt('Color quoted lines'), settings),
                        // fixed width
                        util.checkbox('useFixedWidthFont', gt('Use fixed-width font for text mails'), settings),
                        // read receipts
                        util.checkbox('sendDispositionNotification', gt('Show requests for read receipts'), settings),
                        // unseen folder
                        settings.get('features/unseenFolder', false) && isConfigurable('unseenMessagesFolder') ?
                            util.checkbox('unseenMessagesFolder', gt('Show folder with all unseen messages'), settings) : []
                    )
                );
            }
        },
        //
        // Sounds
        //
        {
            id: 'sounds',
            index: INDEX += 100,
            render: function () {

                if (_.device('smartphone') || !(capabilities.has('websocket') || ox.debug) || !Modernizr.websockets) return;

                this.$el.append(
                    util.fieldset(
                        //#. Should be "töne" in german, used for notification sounds. Not "geräusch"
                        gt('Notification sounds'),
                        util.checkbox('playSound', gt('Play sound on incoming mail'), settings),
                        util.compactSelect('notificationSoundName', gt('Sound'), settings, this.getSoundOptions())
                            .prop('disabled', !settings.get('playSound'))
                    )
                );

                this.listenTo(settings, 'change:playSound', function (value) {
                    this.$('[name="notificationSoundName"]').prop('disabled', !value ? 'disabled' : '');
                });
            }
        },
        //
        // Behavior
        //
        {
            id: 'behavior',
            index: INDEX += 100,
            render: function () {

                if (capabilities.has('guest')) return;

                var contactCollect = !!capabilities.has('collect_email_addresses');

                this.$el.append(
                    util.fieldset(
                        gt('Behavior'),
                        util.checkbox('removeDeletedPermanently', gt('Permanently remove deleted emails'), settings),
                        contactCollect ? util.checkbox('contactCollectOnMailTransport', gt('Automatically collect contacts in the folder "Collected addresses" while sending'), settings) : [],
                        contactCollect ? util.checkbox('contactCollectOnMailAccess', gt('Automatically collect contacts in the folder "Collected addresses" while reading'), settings) : [],
                        // mailto handler registration
                        util.checkbox('features/registerProtocolHandler', gt('Ask for mailto link registration'), settings)
                        .find('label').css('margin-right', '8px').end()
                        .append(
                            // if supported add register now link
                            navigator.registerProtocolHandler ?
                                $('<a href="#" role="button">').text(gt('Register now')).on('click', function (e) {
                                    e.preventDefault();
                                    var l = location, $l = l.href.indexOf('#'), url = l.href.substr(0, $l);
                                    navigator.registerProtocolHandler(
                                        'mailto', url + '#app=' + ox.registry.get('mail-compose') + ':compose&mailto=%s', ox.serverConfig.productNameMail
                                    );
                                }) : []
                        )
                    )
                );
            }
        }
    );

    var hasVacationNoticeAction,
        moduleReady = mailfilter.getConfig().then(function doneFilter(config) {
            hasVacationNoticeAction = !!_(config.actioncmds).findWhere({ id: 'vacation' });
        }, function failFilter() {
            hasVacationNoticeAction = false;
        });

    //
    // Buttons
    //
    ext.point('io.ox/mail/settings/detail/view/buttons').extend(
        //
        // Vacation notice
        //
        {
            id: 'vacation-notice',
            index: 100,
            render: function () {

                if (!capabilities.has('mailfilter_v2') || !hasVacationNoticeAction) return;

                this.append(
                    $('<button type="button" class="btn btn-default" data-action="edit-vacation-notice">')
                    .append(
                        $('<i class="fa fa-toggle-on" aria-hidden="true">').hide(),
                        $.txt(gt('Vacation notice') + ' ...')
                    )
                    .on('click', openDialog)
                );

                // check whether it's active
                var model = new vacationNoticeModel();
                model.fetch().done(updateToggle.bind(this, model));
                ox.on('mail:change:vacation-notice', updateToggle.bind(this));

                function updateToggle(model) {
                    this.find('[data-action="edit-vacation-notice"] .fa-toggle-on').toggle(model.get('active'));
                }

                function openDialog() {
                    ox.load(['io.ox/mail/mailfilter/vacationnotice/view']).done(function (view) {
                        view.open();
                    });
                }
            }
        },
        //
        // Auto Forward
        //
        {
            id: 'auto-forward',
            index: 200,
            render: function () {

                if (!capabilities.has('mailfilter_v2')) return;

                this.append(
                    $('<button type="button" class="btn btn-default" data-action="edit-auto-forward">')
                    .append(
                        $('<i class="fa fa-toggle-on" aria-hidden="true">').hide(),
                        $.txt(gt('Auto forward') + ' ...')
                    )
                    .on('click', openDialog)
                );

                // check whether it's active
                var model = new autoforwardModel();
                model.fetch().done(updateToggle.bind(this, model));
                ox.on('mail:change:auto-forward', updateToggle.bind(this));

                function updateToggle(model) {
                    this.find('[data-action="edit-auto-forward"] .fa-toggle-on').toggle(model.isActive());
                }

                function openDialog() {
                    ox.load(['io.ox/mail/mailfilter/autoforward/view']).done(function (view) {
                        view.open();
                    });
                }
            }
        },
        //
        // IMAP subscription
        //
        {
            id: 'imap-subscription',
            index: 300,
            render: function () {

                // we don't really need that on a smartphone (I guess) nor guests
                // also  don't show it if diabled via server property
                if (settings.get('ignoreSubscription', false) || _.device('smartphone') || capabilities.has('guest')) return;

                this.append(
                    $('<button type="button" class="btn btn-default">')
                    .text(gt('Change IMAP subscriptions') + ' ...')
                    .on('click', openDialog)
                );

                function openDialog() {
                    ox.load(['io.ox/core/folder/actions/imap-subscription']).done(function (subscribe) {
                        subscribe();
                    });
                }
            }
        }
    );

    return moduleReady;
});
