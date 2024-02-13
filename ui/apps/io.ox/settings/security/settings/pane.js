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

define('io.ox/settings/security/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/core/capabilities',
    'io.ox/core/settings/util',
    'settings!io.ox/core',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (ext, ExtensibleView, capabilities, util, settings, mailSettings, gt) {

    'use strict';

    var INDEX = 0,
        MINUTES = 60000;

    ext.point('io.ox/settings/security/settings/detail').extend(
        {
            index: INDEX += 100,
            id: 'header',
            draw: function () {
                this.append(
                    util.header(gt('Security'))
                );
            }
        }, {
            index: INDEX += 100,
            id: 'general',
            draw: function () {
                this.append(
                    new ExtensibleView({ point: 'io.ox/settings/security/settings/detail/general', model: settings })
                    .build(function () {
                        this.listenTo(this.model, 'change', this.model.saveAndYell.bind(this.model, undefined));
                        this.listenTo(this.model, 'change:autoLogout', function () {
                            ox.autoLogout.restart();
                        });
                    })
                    .inject({
                        getAutoLogoutOptions: function () {
                            return [
                                { label: gt('Never'), value: 0 },
                                { label: gt('5 minutes'), value: 5 * MINUTES },
                                { label: gt('10 minutes'), value: 10 * MINUTES },
                                { label: gt('15 minutes'), value: 15 * MINUTES },
                                { label: gt('30 minutes'), value: 30 * MINUTES }
                            ];
                        }
                    })
                    .render().$el
                );
            }
        }, {
            index: INDEX += 100,
            id: 'mail',
            draw: function () {

                if (!(capabilities.has('webmail')) || capabilities.has('guest')) return;

                this.append(
                    new ExtensibleView({ point: 'io.ox/settings/security/settings/detail/mail', model: mailSettings })
                    .build(function () {
                        this.listenTo(this.model, 'change', this.model.saveAndYell.bind(this.model, undefined));
                    })
                    .render().$el
                );
            }
        }
    );

    //
    // GENERAL
    //
    ext.point('io.ox/settings/security/settings/detail/general').extend({
        id: 'autoLogout',
        index: 100,
        render: function () {

            if (!this.model.isConfigurable('autoLogout')) return;

            this.$el.append(
                util.fieldset(
                    //#. headline for general settings
                    gt('General'),
                    util.compactSelect('autoLogout', gt('Automatic sign out'), this.model, this.getAutoLogoutOptions())
                )
            );
        }
    });

    //
    // MAIL
    //
    ext.point('io.ox/settings/security/settings/detail/mail').extend({
        id: 'mail',
        index: 100,
        render: function () {
            this.$el.append(
                util.fieldset(
                    gt.pgettext('app', 'Mail'),
                    // images
                    util.checkbox('allowHtmlImages', gt('Allow pre-loading of externally linked images'), this.model)
                ).addClass('mail')
            );
        }
    });

    // disabled
    ext.point('io.ox/settings/security/settings/detail/mail').disable('authenticity').extend({
        id: 'authenticity',
        index: 200,
        render: function () {
            // IMPORTANT: level currently hardcoded as 'fail_suspicious_trusted' by MW and not adjustable by any property file change or user interaction.
            if (!mailSettings.get('features/authenticity', false)) return;
            this.$('fieldset.mail').append(
                util.compactSelect('authenticity/level', gt('Show email authenticity'), this.model, [
                    //#. Status for mail authenticity features. Do not show any information at all
                    { label: gt('Disabled'), value: 'none' },
                    //#. Status for mail authenticity features. Show information for dangerous and unambiguous/inconclusive
                    { label: gt('Suspicious and unclassified emails only'), value: 'fail_suspicious_trusted' },
                    //#. Status for mail authenticity features. Show information for any mail
                    { label: gt('All emails'), value: 'fail_suspicious_neutral_none_pass_trusted' }
                ])
            );
        }
    });

    ext.point('io.ox/settings/security/settings/detail/mail').extend({
        id: 'trusted',
        index: 300,
        render: function () {
            if (!this.model.isConfigurable('features/trusted/user')) return;

            this.$('fieldset.mail').append(
                util.textarea('features/trusted/user', gt('Always trust mails from the following senders'), this.model, gt('Comma-separated list e.g. "example.org, alice@example.com"'))
            );
        }
    });
});
