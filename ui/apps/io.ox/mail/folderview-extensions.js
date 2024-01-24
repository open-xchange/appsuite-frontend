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

define('io.ox/mail/folderview-extensions', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'gettext!io.ox/mail'
], function (ext, capabilities, gt) {

    'use strict';

    var POINT = 'io.ox/mail/folderview';

    function addAccount(e) {
        e.preventDefault();
        require(['io.ox/mail/accounts/settings'], function (m) {
            m.mailAutoconfigDialog(e);
        });
    }

    if (capabilities.has('multiple_mail_accounts')) {
        ext.point(POINT + '/sidepanel/links').extend({
            id: 'add-account',
            index: 300,
            draw: function () {
                if (_.device('!smartphone')) {
                    this.append($('<div>').append(
                        $('<a href="#" data-action="add-mail-account" role="button">')
                        .text(gt('Add mail account'))
                        .on('click', addAccount)
                    ));
                }
            }
        });
    }
});
