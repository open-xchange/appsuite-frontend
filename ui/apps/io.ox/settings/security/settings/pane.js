/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
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

    ext.point('io.ox/settings/security/settings/detail/mail').extend({
        id: 'authenticity',
        index: 200,
        render: function () {
            var isEnabled = mailSettings.get('features/authenticity', false),
                isConfigurable = this.model.isConfigurable('authenticity/level');

            // IMPORTANT: level currently hardcoded as 'fail_neutral_trusted' and 'protected' by MW and not adjustable by any property file change or user interaction.
            if (!isEnabled || !isConfigurable) return;

            // fallback default value
            if (!this.model.get('authenticity/level')) this.model.set('authenticity/level', 'none');

            this.$('fieldset.mail').append(
                util.compactSelect('authenticity/level', gt('Show email authenticity'), this.model, [
                    //#. Status for mail authenticity features. Do not show any information at all
                    { label: gt('Disabled'), value: 'none' },
                    //#. Status for mail authenticity features. Show information for dangerous and unambiguous/inconclusive
                    { label: gt('Suspicious and unclassified emails only'), value: 'fail_neutral_trusted' },
                    //#. Status for mail authenticity features. Show information for any mail
                    { label: gt('All emails'), value: 'all' }
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
