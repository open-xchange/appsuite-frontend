define("io.ox/core/strings", function () {
    "use strict";
    return {
        shorten: function (string, maxlen) {
            if (string.length > maxlen) {
                return string.substring(0, maxlen - 3) + "...";
            }
            return string;
        },
        shortenUri: function (uriString, maxlen) {
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