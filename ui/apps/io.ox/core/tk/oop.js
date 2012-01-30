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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
/*global
define: true
*/
define('io.ox/core/tk/oop', [], function () {
    'use strict';

    function OOPObject() {}
    OOPObject.extend = function (Child, obj) {
        var args = Array.prototype.slice.call(arguments);
        Child = args.shift();

        obj = obj || false;
        Child.extend = OOPObject.extend;
        Child.prototype = Object.create(this.prototype, {
            constructor: {
                value: Child,
                enumerable: false
            }
        });
        Child.prototype.__super = this.prototype.constructor;
        for (var parentProperty in this) {
            if (Child[parentProperty] !== undefined) {
                continue;
            }
            Child[parentProperty] = this[parentProperty];
        }
        // allowing inline style p.e. SomeClass.extend(function(){}, { def: function (){}});
        //
        if (args.length > 0) {
            var i = 0,
                len = args.length;

            for (; i < len; i++) {
                for (var overwriteProperty in args[i]) {
                    if (overwriteProperty !== '__proto__') {
                        Child.prototype[overwriteProperty] = args[i][overwriteProperty];
                    }
                }
            }
        }
    };
    return OOPObject;
});
