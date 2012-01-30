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
    };

    SimpleModel.prototype.data = null;
    SimpleModel.prototype.dataShadow = null;
    SimpleModel.prototype.init = function (options) {
        options = options || {};
        options.data = options.data || {};
        this.dirty = false;
        this.setData(options.data);
    };

    SimpleModel.prototype.get = function (key) {
        return this.data[key];
    };

    SimpleModel.prototype.set = function (key, value) {
        this.dirty = true;
        this.data[key] = value;
    };
    SimpleModel.prototype.setData = function (data) {
        this.data = data;
        this.dataShadow = _.clone(data);
    };
    SimpleModel.prototype.getData = function () {
        return this.data;
    };
    SimpleModel.prototype.isDirty = function () {
        return this.dirty;
    };
    SimpleModel.prototype.getChanges = function () {
        var changes = {},
            self = this;
        _.each(this.data, function (val, k) {
            if (val !== self.dataShadow[k]) {
                changes[k] = val;
            }
        });
        return changes;
    };

    return SimpleModel;
});
