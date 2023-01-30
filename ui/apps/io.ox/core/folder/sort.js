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

define('io.ox/core/folder/sort', ['io.ox/core/extensions', 'io.ox/core/api/account', 'settings!io.ox/core'], function (ext, account, settings) {

    'use strict';

    var point = ext.point('io.ox/core/folder/sort');

    point.extend({
        id: '1',
        sort: function (baton) {

            if (baton.id !== '1') return;

            var array = baton.data,
                head = new Array(1 + 5),
                types = 'inbox sent drafts trash spam'.split(' ');

            // get unified folder first
            _(array).find(function (folder) {
                return account.isUnified(folder.id) && !!(head[0] = folder);
            });

            // get standard folders
            _(array).each(function (folder) {
                _(types).find(function (type, index) {
                    return account.is(type, folder.id) && !!(head[index + 1] = folder);
                });
            });

            // exclude unified and standard folders
            array = _(array).reject(function (folder) {
                return account.isUnified(folder.id) || account.isStandardFolder(folder.id);
            });

            // sort the rest
            array.sort(function (a, b) {
                // external accounts at last
                var extA = account.isExternal(a.id),
                    extB = account.isExternal(b.id),
                    order = a.title.toLowerCase() > b.title.toLowerCase() ? +1 : -1;
                if (extA && extB) return order;
                if (extA) return +1;
                if (extB) return -1;
                return order;
            });

            // combine
            array.unshift.apply(array, _(head).compact());

            baton.data = array;
        }
    });

    point.extend({
        id: 'my-files',
        sort: function (baton) {
            // sort folders below "My files"; otherwise standard folders appear first unsorted
            // sort folders of "Public files" as well (id: '15')
            if (baton.id !== settings.get('folder/infostore') && baton.id !== '15') return;
            baton.data = baton.data.sort(function (a, b) {
                return a.title.localeCompare(b.title);
            });
        }
    });

    return {
        apply: function (id, array) {
            var baton = ext.Baton({ id: id, data: array });
            point.invoke('sort', null, baton);
            return baton.data;
        }
    };

});
