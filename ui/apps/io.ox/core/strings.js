/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define("io.ox/core/strings", function () {

    "use strict";

    return {

        shorten: function (string, maxlen) {
            string = string !== undefined && string !== null ? string : '';
            if (string.length > maxlen) {
                return string.substring(0, maxlen - 3) + "...";
            }
            return string;
        },

        shortenUri: function (uriString, maxlen) {
            uriString = uriString !== undefined && uriString !== null ? uriString : '';
            var string = uriString.replace(/^https?:\/\//, "");
            var difference = string.length - maxlen;
            if (difference <= 0) {
                return string;
            }
            var middle = string.length / 2;
            var left = middle - (difference / 2) - 1;
            var right = middle + (difference / 2) + 1;

            return string.substring(0, left)  + "..." + string.substring(right, string.length);
        }
    };
});