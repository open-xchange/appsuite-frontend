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

define('io.ox/contacts/actions/delete', [
    'io.ox/contacts/api',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/contacts'
], function (api, ModalDialog, gt) {

    'use strict';

    return function (baton) {
        var data = baton.data;
        new ModalDialog({ title: getTitle(data), description: getQuestion(data) })
            .addCancelButton()
            .addButton({ label: gt('Delete'), action: 'delete' })
            .on('delete', function () { api.remove(data); })
            .open();
    };

    //#. ''Delete items', 'Delete distribution list' and 'Delete contact' as headers of a modal dialog to delete items, distribution lists and contacts.
    function getTitle(data) {
        if (data.length > 1) return gt('Delete items');
        if (data[0].mark_as_distributionlist) return gt('Delete distribution list');
        return gt('Delete contact');
    }

    function getQuestion(data) {
        if (data.length > 1) return gt('Do you really want to delete these items?');
        if (data[0].mark_as_distributionlist) return gt('Do you really want to delete this distribution list?');
        return gt('Do you really want to delete this contact?');
    }
});
