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

define('io.ox/core/folder/actions/archive', [
    'io.ox/mail/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/yell',
    'settings!io.ox/mail',
    'gettext!io.ox/core'
], function (api, ModalDialog, yell, settings, gt) {

    'use strict';

    return function (id) {

        var days = settings.get('archive/days');
        days = _.isNumber(days) && days > 1 ? days : 90;

        new ModalDialog({ title: gt('Archive messages'), description: gt('All messages older than %1$d days will be moved to the archive folder', days) + '.' })
            .addCancelButton()
            //#. Verb: (to) archive messages
            .addButton({ label: gt.pgettext('verb', 'Archive'), action: 'archive' })
            .on('archive', function () {
                //#. notification while archiving messages
                yell('busy', gt('Archiving messages ...'));
                api.archiveFolder(id, { days: days }).then(yell.done, yell);
            })
            .open();
    };
});
