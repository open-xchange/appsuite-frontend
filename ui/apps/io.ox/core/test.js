/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 */

define("io.ox/core/test",
    ["io.ox/core/extensions",
     "io.ox/core/test/cacheStorage", "io.ox/core/test/cacheSimpleCache",
     "io.ox/core/test/cacheObjectCache"], function (ext) {
    
    "use strict";

    // test objects
    var TIMEOUT = 5000;

    // helpers
    function Done() {
        var f = function () {
            return f.value;
        };
        f.value = false;
        f.yep = function () {
            f.value = true;
        };
        return f;
    }

    
    
});