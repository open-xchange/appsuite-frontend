/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('io.ox/core/strings', ['gettext!io.ox/core'], function (gt) {

    'use strict';

    var n_size;
    function init_n_size() {
        n_size = [/*#. Bytes*/      gt('B'),
                  /*#. Kilobytes*/  gt('KB'),
                  /*#. Megabytes*/  gt('MB'),
                  /*#. Gigabytes*/  gt('GB'),
                  /*#. Terabytes*/  gt('TB'),
                  /*#. Petabytes*/  gt('PB'),
                  /*#. Exabytes*/   gt('EB'),
                  /*#. Zettabytes*/ gt('ZB'),
                  /*#. Yottabytes*/ gt('YB')];
    }

    return {

        shortenUri: function (uriString, maxlen) {
            uriString = uriString !== undefined && uriString !== null ? uriString : '';
            var string = uriString.replace(/^https?:\/\//, '');
            var difference = string.length - maxlen;
            if (difference <= 0) {
                return string;
            }
            var middle = string.length / 2;
            var left = middle - (difference / 2) - 1;
            var right = middle + (difference / 2) + 1;

            return string.substring(0, left)  + '...' + string.substring(right, string.length);
        },

        fileSize: function (size, decimalPlaces) {
            if (!n_size) init_n_size();
            var i = 0, $i = n_size.length;
            if (decimalPlaces > 10) {
                //for security so math.pow doesn't get really high values
                decimalPlaces = 10;
            }
            var dp = Math.pow(10, decimalPlaces || 0);
            while (size > 1024 && i < $i) {
                size = size / 1024;
                i++;
            }
            return (
                //#. File size
                //#. %1$d is the number
                //#. %2$s is the unit (B, KB, MB etc.)
                gt('%1$d %2$s', (Math.round(size * dp, 1) / dp), n_size[i]));
        }

    };
});
