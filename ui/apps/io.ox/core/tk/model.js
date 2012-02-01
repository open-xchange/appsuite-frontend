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
        get: function (key) {
            return this.data[key];
        },
        set: function (key, value) {
            var validated = this.validate(key, value);
            if (validated !== true || validated.constructor.toString().indexOf('ValidationError') !== -1) {
                return $(this).trigger('error:validation', [validated]);
            }

            if (_.isEqual(value, this.data[key])) {
                return true;
            }

            this.dirty = true;
            this.data[key] = value;
            $(this).trigger('change:' + key, [key, value]);
            $(this).trigger('change', [key, value]);
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
            _.each(this.getData(), function (val, k) {
                if (val !== self.dataShadow[k]) {
                    changes[k] = val;
                }
            });
            return changes;
        },
        ValidationError: function ValidationError(key, value, msg) {
            this.message = msg;
            this.name = key;
            this.value = value;
        },
        ConsistencyError: function ConsistencyError(key, value, msg) {
            this.message = msg;
            this.name = key;
            this.value = value;
        },
        formats: {
            string: function (key, val, fieldDesc) {
                if (!_.isString(val)) {
                    return new this.ValidationError(key, val, 'should be a valid string');
                }
                return true;
            },
            number: function (key, val, fieldDesc) {
                if (!_.isNumber(val)) {
                    return new this.ValidationError(key, val, 'should be a number');
                }
                return true;
            },
            array: function (key, val, fieldDesc) {
                if (!_.isArray(val)) {
                    return new this.ValidationError(key, val, 'should be an array');
                }
                return true;
            },
            boolean: function (key, val, fieldDesc) {
                if (!_.isBoolean(val)) {
                    return new this.ValidationError(key, val, 'should be an boolean');
                }
                return true;
            },
            date: function (key, val, fieldDesc) {
                return true;
            },
            pastDate: function (key, val, fieldDesc) {
                return true;
            },
            email: function (key, val, fieldDesc) {
                var emailRegExp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
                if (!emailRegExp.test(val)) {
                    return new this.ValidationError(key, val, 'should be a valid email address');
                }
                return true;
            },
            url: function (key, val, fieldDesc) {
                return true;
            }
        },
        validate: function (key, value) {
            var fieldDesc = this.properties[key];
            if (key === undefined || value === "" && (fieldDesc === undefined || fieldDesc.mandatory !== true)) {
                return true;
            }
            if (fieldDesc && this.formats[fieldDesc.format] && _.isFunction(this.formats[fieldDesc.format])) {
                return this.formats[fieldDesc.format].apply(this, [key, value, fieldDesc]);
            }
            return true;
        },
        getProp: function (key) {
            return this.properties[key] || {};
        }
    };
    _.makeExtendable(SimpleModel);
    return SimpleModel;
});
