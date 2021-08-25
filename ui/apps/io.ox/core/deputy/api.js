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

define('io.ox/core/deputy/api', [
], function () {

    'use strict';


    var mockdata = [{
        'deputyId': 'dc5b3fbbee434035a94a7c949721cb77',
        'user': 395,
        'sendOnBehalf': true,
        'modulePermissions': {
            'mail': {
                'permission': 4227332,
                'folderIds': [
                    123
                ]
            },
            'calendar': {
                'permission': 257,
                'folderIds': [
                    1337
                ]
            }
        }
    }];

    var api = {
        getAll: function () {
            return $.when(mockdata);
        },
        create: function (model) {
            var params =  _.clone(model.attributes);
            delete params.userData;
            console.log('create', params);
            // return random deputyid
            return $.when(Math.floor(Math.random() * (10000)));
        },
        remove: function (model) {
            var id = model.get('deputyId');
            console.log('remove', id);
            return $.when();
        },
        update: function (model) {
            var params =  _.clone(model.attributes);
            delete params.userData;
            console.log('update', params);
            return $.when();
        }
    };
    return api;

});
