define("io.ox/core/strings", function () {
    "use strict";
    return {
        shorten: function (string, maxlen) {
            if (string.length > maxlen) {
                return string.substring(0, maxlen - 3) + "...";
            }
            return string;
        }
    };
});