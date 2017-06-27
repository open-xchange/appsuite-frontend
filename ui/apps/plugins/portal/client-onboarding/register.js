/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('plugins/portal/client-onboarding/register', [
    'io.ox/core/extensions',
    'gettext!plugins/portal'
], function (ext, gt) {

    'use strict';

    var id, type, title;
    id = type = 'client-onboarding';
    title = gt('Connect your Device');

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
                                $('<i class="fa fa-fw fa-mobile">'),
                                $('<i class="fa fa-fw fa-tablet">'),
                                $('<i class="fa fa-fw fa-laptop">')
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
                        require(['io.ox/onboarding/clients/wizard'], function (wizard) {
                            wizard.run();
                        });
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
