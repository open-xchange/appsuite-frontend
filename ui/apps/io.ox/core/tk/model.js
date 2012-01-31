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
      [], function () {
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
            options.properties = options.properties || {};

            this.dirty = false;
            this.setData(options.data);

            this.properties = options.properties;

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
        },
        ValidationError: function ValidationError(msg) {
            this.message = msg;
        },
        ConsistencyError: function ConsistencyError(msg) {
            this.message = msg;
        },
        formats: {
            string: function (key, val, fieldDesc) {
                return true;
            },
            pastDate: function (key, val, fieldDesc) {
                return true;
            },
            email: function (key, val, fieldDesc) {
                var emailRegExp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
                if (!emailRegExp.test(val)) {
                    return new this.ValidationError('should be a valid email address');
                }
                return true;
            }
        },
        validate: function (key, value) {
            var fieldDesc = this.properties[key];
            if (value === "" && fieldDesc.mandatory !== true) {
                return true;
            }
            if (fieldDesc && this.formats[fieldDesc.format] && _.isFunction(this.formats[fieldDesc.format])) {
                return this.formats[fieldDesc.format].apply(this, [key, value, fieldDesc]);
            }
        },
        getProp: function (key) {
            return this.properties[key] || {};
        }
    };
    _.makeExtendable(SimpleModel);
    return SimpleModel;
});
