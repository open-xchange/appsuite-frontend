/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
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

        preview: function () {
            var style = {
                'display': 'flex',
                'justify-content': 'space-around',
                'font-size': '4em',
                'max-width': '360px',
                'margin': '24px auto'
            };

            this.append(
                $('<div class="content">').append(
                    $('<div class="paragraph text-justify">').text(
                         gt('Take %1$s with you! Stay up-to-date on your favorite devices.', ox.serverConfig.productName)
                    ),
                    $('<div class="paragraph text-justify">').css(style)
                        .append(
                            $('<i class="fa fa-fw fa-mobile">'),
                            $('<i class="fa fa-fw fa-tablet">'),
                            $('<i class="fa fa-fw fa-laptop">')
                        ),
                    // $('<div class="paragraph text-justify">').css(style)
                    //     .append(
                    //         $('<i class="fa fa-fw fa-windows">'),
                    //         $('<i class="fa fa-fw fa-apple">'),
                    //         $('<i class="fa fa-fw fa-android">')
                    //     ),
                    $('<div class="paragraph">').append(
                        $('<a>', { href: '#', tabindex: '1', 'role': 'button' })
                            .addClass('action')
                            .text(gt('Connect'))
                    )
                )
            );

            // listener
            this.on('click', function () {
                require(['io.ox/onboarding/clients/wizard'], function (wizard) {
                    wizard.run();
                });
            });
        }
    });

    ext.point('io.ox/portal/widget/client-onboarding/settings').extend({
        title: title,
        type: type,
        unique: true,
        editable: false
    });
});
