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
define('io.ox/core/tk/model', [], function () {
    "use strict";
    var SimpleModel = function (flatdata) {
        this.data = flatdata;
        this.dirty = false;
        this.get = function (key) {
            console.log("getting from simple");
            console.log(key);
            return this.data[key];
        };

        this.set = function (key, value) {
            this.dirty = true;
            this.data[key] = value;
        };
        this.setData = function (data) {
            this.data = data;
        };
        this.getData = function () {
            return this.data;
        };
        this.isDirty = function () {
            return this.dirty;
        };
    };

    return SimpleModel;
});
