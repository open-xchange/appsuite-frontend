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

define('io.ox/chat/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/core/settings/util',
    'io.ox/backbone/views/extensible',
    'settings!io.ox/chat',
    'io.ox/chat/data',
    'gettext!io.ox/chat'
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
        }, {
            id: 'email-notifications',
            index: INDEX += 100,
            render: function () {
                if (!data.serverConfig.smtpEnabled) return;

                this.$el.append(
                    util.compactSelect('emailNotification', gt('Receive email notifications'), data.userSettings, [
                        { label: gt('Never'), value: 'never' },
                        { label: gt('Private chats only'), value: 'private' },
                        { label: gt('Always'), value: 'always' }
                    ])
                );
            }
        }
    );
});
