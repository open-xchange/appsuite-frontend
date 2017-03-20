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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
define('plugins/portal/powerdns-parental-control/register', [
    'io.ox/core/extensions',
    'gettext!plugins/portal'
], function (ext, gt) {

    'use strict';

    var id = 'powerdns-parental-control',
        title = gt('PowerDNS parental control');

    ext.point('io.ox/portal/widget').extend({ id: id });

    ext.point('io.ox/portal/widget/' + id).extend({

        title: title,

        preview: function () {
            this.append(
                $('<div class="content">').append(
                    $('<div class="paragraph">').append(
                        $('<a role="button" class="action">')
                            //#. button label within the client-onboarding widget
                            //#. button opens the wizard to configure your device
                            .text(gt('Open parental control settings'))
                    )
                )
                // listener
                .on('click', function () {
                    // TODO implement handling here
                })
            );
        }

    });

    ext.point('io.ox/portal/widget/' + id + '/settings').extend({

        title: title,

        type: id,

        unique: true

    });

});
