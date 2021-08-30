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

define('plugins/portal/client-onboarding/register', [
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'gettext!plugins/portal'
], function (ext, settings, gt) {

    'use strict';

    var id, type, title,
        wizard = settings.get('onboardingWizard', true);
    id = type = 'client-onboarding';
    title = gt('Connect your device');

    ext.point('io.ox/portal/widget').extend({ id: id });

    ext.point('io.ox/portal/widget/client-onboarding').extend({

        title: title,

        type: type,

        load: function (baton) {
            // define inline styles within baton
            // to allow simple customization
            baton.style = {
                content: {
                    'cursor': 'pointer'
                },
                devices: {
                    'display': 'flex',
                    'justify-content': 'space-around',
                    'font-size': '4em',
                    'max-width': '360px',
                    'margin': '24px auto'
                }
            };
        },

        preview: function (baton) {
            var style = $.extend(true, { content: {}, devices: {} }, baton.style);
            this.append(
                $('<div class="content">')
                    .css(style.content)
                    .append(
                        $('<div class="paragraph text-justify">').text(
                            //#. title for 1st and snd step of the client onboarding wizard
                            //#. users can configure their devices to access/sync appsuites data (f.e. install ox mail app)
                            //#. %1$s the product name
                            //#, c-format
                            gt('Take %1$s with you! Stay up-to-date on your favorite devices.', ox.serverConfig.productName)
                        ),
                        $('<div class="paragraph text-justify devices">').css(style.devices)
                            .append(
                                $('<i class="fa fa-fw fa-mobile" aria-hidden="true">'),
                                $('<i class="fa fa-fw fa-tablet" aria-hidden="true">'),
                                $('<i class="fa fa-fw fa-laptop" aria-hidden="true">')
                            ),
                        $('<div class="paragraph">').append(
                            $('<a role="button" class="action">')
                                //#. button label within the client-onboarding widget
                                //#. button opens the wizard to configure your device
                                .text(gt('Connect'))
                        )
                    )
                    // listener
                    .on('click', function () {
                        if (wizard) {
                            require(['io.ox/onboarding/main'], function (wizard) {
                                wizard.load();
                            });
                        } else {
                            require(['io.ox/onboarding/clients/wizard'], function (wizard) {
                                wizard.run();
                            });
                        }
                    })
            );
        }
    });

    ext.point('io.ox/portal/widget/client-onboarding/settings').extend({
        title: title,
        type: type,
        unique: true,
        editable: false
    });
});
