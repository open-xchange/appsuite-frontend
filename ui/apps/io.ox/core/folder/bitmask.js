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

define('io.ox/core/folder/bitmask', [], function () {

    'use strict';

    var parts = { folder: 0, read: 7, write: 14, modify: 14, 'delete': 21, admin: 28 },

        resolve = function (offset) {
            // use symbolic offset or plain numeric value?
            if (_.isString(offset)) {
                if (offset in parts) return parts[offset];
                console.error('Typo!?', offset);
            }
            return offset || 0;
        };

    return function Bitmask(value) {

        value = value || 0;

        // this way we may forget the new operator
        var Bitmask = {

            get: function (offset) {
                // return value OR relevant bits only
                return arguments.length === 0 ? value : (value >> resolve(offset)) & 127;
            },

            set: function (offset, bits) {
                offset = resolve(offset);
                bits = bits || 0;
                // clear 7 bits first
                value &= 536870911 ^ (127 << offset);
                // set bits
                value |= bits << offset;
                return this;
            }
        };

        return Bitmask;
    };

});
