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
