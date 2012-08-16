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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("io.ox/tasks/burger", function () {
    "use strict";
    // This is the list of burgers we know
    // Ordering a burger that we don't know, will lead to a rejected deferred
    var knownBurgers = [
        "Hamburger",
        "Cheeseburger",
        "Chickenburger",
        "Double Cheeseburger",
        "Big Mac",
        "Royal TS",
        "McRib"
    ];
    
    function isKnownBurger(burgerName) {
        // Underscore to the rescue!
        return _(knownBurgers).indexOf(burgerName) !== -1;
    }
    
    var burgerMachine = {
        getBurger: function (burgerName) {
            // This is the deferred object. this will be returned immediately, but resolved
            // after a random timeout of up to 4 seconds
            var def = $.Deferred();
            setTimeout(function () {
                // The random time has passed
                // Do we know this burger?
                if (isKnownBurger(burgerName)) {
                    // Yes we do, so, since this is the happy path
                    // we'll call resolve. This in turn will call all
                    // functions that were registered by calling #done on the
                    // deferred object
                    def.resolve(burgerName);
                } else {
                    // No! We don't know this burger. Hence we will call reject
                    // which in turn will invoke the error handlers registered with
                    // #fail.
                    def.reject(burgerName);
                }
                
            }, 1000 + Math.floor(Math.random() * 3001));
            
            return def;
        }
    };
    
    return burgerMachine;
});