
define("io.ox/core/async", [], function () {

    "use strict";

    function looksLikeDeferred(object) {
        if (!object) {
            return false;
        }
        return object.done && object.fail && object.always;
    }

    /**
    * Turns its arguments into a composite deferred object. Useful if you want to accept both
    * asynchronously determined values and regular values
    */
    function defer() {
        if (arguments.length === 0) {
            return $.when();
        }

        if (arguments.length === 1) {
            if (looksLikeDeferred(arguments[0])) {
                return arguments[0];
            }
            return $.Deferred().resolve(arguments[0]);
        }

        return $.when.apply($, _(arguments).map(defer));
    }

    return {
        defer: defer
    };
});
