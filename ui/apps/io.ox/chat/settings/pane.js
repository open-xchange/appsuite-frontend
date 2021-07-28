/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/chat/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/core/settings/util',
    'io.ox/backbone/views/extensible',
    'settings!io.ox/chat',
    'io.ox/chat/data',
    'gettext!io.ox/chat',
    'settings!io.ox/core'
], function (ext, util, ExtensibleView, settings, data, gt) {

    'use strict';

    ext.point('io.ox/chat/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            data.session.initialized.then(function () {
                this.append(
                    new ExtensibleView({ point: 'io.ox/chat/settings/detail/view', model: settings })
                    .build(function () {
                        this.listenTo(settings, 'change', function () {
                            settings.saveAndYell();
                        });
                    })
                    .render().$el
                );
            }.bind(this));
        }
    });

    var INDEX = 100;

    ext.point('io.ox/chat/settings/detail/view').extend(
        {
            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.header(gt('Chat'))
                );
            }
        },
        {
            id: 'view-options',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(
                        gt('View options'),
                        // util.checkbox('autoStart', gt('Open chat after login'), settings),
                        util.checkbox('selectLastRoom', gt('Select last chat on start'), settings),
                        //#. label of checkbox to enable/disable grouping chats by type
                        util.checkbox('groupByType', gt('Group chats by type'), settings),
                        //#. Sort chats by ... (alphabetical|last activity)
                        util.radio('sortBy', gt('Sort chats by'), settings, [
                            { label: gt('Last activity'), value: 'activity' },
                            { label: gt('Alphabetical'), value: 'alphabetical' }
                        ]),
                        //#. Visual List density (German "Kompaktheitsgrad"); can be compact, default, or detailed
                        util.compactSelect('density', gt('List density'), settings, [
                            { label: gt('Compact'), value: 'compact' },
                            { label: gt('Default'), value: 'default' },
                            { label: gt('Detailed'), value: 'detailed' }
                        ])
                    )
                );
            }
        },
        {
            id: 'notifications',
            index: INDEX += 100,
            render: function () {
                var soundList = [
                    { label: gt('Plop'), value: 'plop.mp3' },
                    { label: gt('Click'), value: 'click.mp3' },
                    { label: gt('Bongo'), value: 'bongo.mp3' }
                ];
                var playWhenOptions = [
                    { label: gt('Play sound for every message'), value: 'always' },
                    { label: gt('Play sound only if chat is in background'), value: 'onlyInactive' }
                ];
                this.$el.append(
                    util.fieldset(
                        //#. Should be "töne" in german, used for notification sounds. Not "geräusch"
                        gt('Notifications'),
                        util.checkbox('showChatNotifications', gt('Show desktop notifications for new messages'), settings),
                        util.checkbox('sounds/enabled', gt('Play notification sound for new messages'), settings),
                        util.compactSelect('sounds/file', gt('Sound'), settings, soundList),
                        util.compactSelect('sounds/playWhen', gt('Behavior'), settings, playWhenOptions)
                    ).addClass('fieldset-notifications')
                );
                function toggle(value) {
                    this.$('[name="sounds/file"],[name="sounds/playWhen"]').prop('disabled', !value ? 'disabled' : '');
                }
                toggle.call(this, settings.get('sounds/enabled'));
                this.listenTo(settings, 'change:sounds/enabled', toggle.bind(this));
            }
        },
        {
            id: 'email-notification',
            index: INDEX += 100,
            render: function () {
                if (!data.serverConfig.smtpEnabled) return;
                this.$el.find('.fieldset-notifications').append(
                    util.compactSelect('emailNotification', gt('Offline email notifications'), settings, [
                        { label: gt('Do not send any email notifications'), value: 'never' },
                        { label: gt('Send email notifications for my private chats'), value: 'private' },
                        { label: gt('Send email notifications for all chats and channels'), value: 'always' }
                    ])
                );
            }
        }
    );

});
