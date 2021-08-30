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
