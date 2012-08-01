/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 * Some flow control states that can be thrown and caught. Sometimes useful
 * for breaking out of underscore type loops, for example
 *
 */

define("io.ox/core/flowControl", function () {
    "use strict";
    
    return {
        BREAK: {type: "BREAK"},
        CONTINUE: {type: "CONTINUE"},
        CANCEL: {type: "CANCEL"},
        
        check: function () {
            var self = this;
            _(arguments).each(function (a) {
                console.log("CHECK:", a);
                if (a === self.BREAK || a === self.CONTINUE || a === self.CANCEL) {
                    throw a;
                }
            });
        }
    };
});
