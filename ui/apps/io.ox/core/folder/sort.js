/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/sort', ['io.ox/core/extensions', 'io.ox/core/api/account'], function (ext, account) {

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

    return {
        apply: function (id, array) {
            var baton = ext.Baton({ id: id, data: array });
            point.invoke('sort', null, baton);
            return baton.data;
        }
    };

});
