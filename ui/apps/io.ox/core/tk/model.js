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
define('io.ox/core/tk/model',
      ['io.ox/core/tk/oop'], function (oop) {
    "use strict";

    function SimpleModel(options) {
        options = options || {};
        options.data = options.data || {};
        this.dirty = false;
        this.setData(options.data);
    }

    SimpleModel.prototype = {
        data: null,
        dataShadow: null,
        schema: {},
        init:  function (options) {
            options = options || {};
            options.data = options.data || {};
            this.dirty = false;
            this.setData(options.data);
        },
        get: function (key) {
            return this.data[key];
        },
        set: function (key, value) {
            var validated = this.validate(key, value);
            if (validated !== true || validated.constructor.toString().indexOf('ValidationError') !== -1) {
                return $(this).trigger('validation.error', [validated]);
            }

            this.dirty = true;
            this.data[key] = value;
            $(this).trigger(key + '.changed', value);
        },
        validate: function (key, value) {
            return this.schema.validate(key, value);
        },
        checkConsistency: function () {
            return true;
        },
        setData: function (data) {
            this.data = data;
            this.dataShadow = _.clone(data); //Shallow Copy data
        },
        getData: function () {
            return this.data;
        },
        isDirty: function () {
            return this.dirty;
        },
        getChanges:  function () {
            var changes = {},
                self = this;
            _.each(this.data, function (val, k) {
                if (val !== self.dataShadow[k]) {
                    changes[k] = val;
                }
            });
            return changes;
        }
    };
    SimpleModel.extend = oop.extend;
    return SimpleModel;
});
