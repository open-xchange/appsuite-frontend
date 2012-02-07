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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */
/*global
define: true
*/
define('io.ox/core/tk/model',
    ['io.ox/core/event'], function (Events) {

    'use strict';

    /**
     * General local Error class
     */
    var Error = function (props, message) {
        this.properties = _.isArray(props) ? props : [props];
        this.message = message;
    };

    /**
     * Formats for validation
     */
    var regEmail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
        formats = {
            string: function (prop, val, def) {
                // always true!
                return true;
            },
            number: function (prop, val, def) {
                return _.isNumber(val) ||
                    new Error(prop, _.printf('%s must be a number', def.i18n || prop));
            },
            array: function (prop, val, def) {
                return _.isArray(val) ||
                    new Error(prop, _.printf('%s must be an array', def.i18n || prop));
            },
            boolean: function (prop, val, def) {
                return _.isBoolean(val) ||
                    new Error(prop, _.printf('%s must be bool', def.i18n || prop));
            },
            date: function (prop, val, def) {
                return true;
            },
            pastDate: function (prop, val, def) {
                var now = _.now();
                if (isNaN(val) && val !== '') {
                    return new Error(prop, _.printf('%s is not a valide date', def.i18n || prop));
                } else {
                    return now > val ||
                    new Error(prop, _.printf('%s must be in the past', def.i18n || prop));
                }

            },
            email: function (prop, val, def) {
                return regEmail.test(val) ||
                    new Error(prop, _.printf('%s must be a valid email address', def.i18n || prop));
            },
            url: function (prop, val, def) {
                return true;
            }
        },

        isEqual = function (newValue, previousValue) {
            if (newValue === '' && previousValue === undefined) {
                return true;
            } else {
                return _.isEqual(newValue, previousValue);
            }
        };

    /**
     * Schema class
     */
    function Schema(definitions) {
        this._definitions = definitions || {};
    }

    Schema.prototype = {

        formats: formats,

        get: function (prop) {
            return this._definitions[prop] || {};
        },

        getDefaults: function () {
            var defaults = {};
            _(this._definitions).each(function (def, prop) {
                if (def.defaultValue !== undefined) {
                    defaults[prop] = def.defaultValue;
                }
            });
            return defaults;
        },

        isMandatory: function (key) {
            return !!this.get(key).mandatory;
        },

        getFieldType: function (key) {
            return this.get(key).format;
        },

        isTrimmed: function (key) {
            return this.get(key).trim !== false;
        },

        validate: function (prop, value) {
            var def = this.get(prop),
                format = def.format || 'string',
                isEmpty = value === '',
                isNotMandatory = def.mandatory !== true;
            if (isEmpty) {
                return isNotMandatory ||
                    new Error(prop, _.printf('%s is mandatory', def.i18n || prop));
            }
            if (_.isFunction(this.formats[format])) {
                return this.formats[format](prop, value, def);
            }
            // undefined format
            console.error('Unknown format used in model schema', format);
        },

        // can return deferred object / otherwise just instance of Error or nothing
        check: function (data, Error) {
            return $.when();
        }
    };

    /**
     * Model
     */
    function Model(options) {
        options = options || {};
        this._data = {};
        this._previous = {};
        this._defaults = this.schema.getDefaults();
        this.initialize(options.data);
        Events.extend(this);
    }

    Model.prototype = {

        schema: new Schema(),

        initialize: function (data) {
            // deep copy to avoid side effects
            this._previous = _.copy(data || {}, true);
            // due to defaultValues, data and previous might differ.
            // however, the model is not dirty
            this._data = _.extend({}, this._defaults, _.copy(data || {}, true));
        },

        get: function (key) {
            // return deep copy
            return _.copy(key !== undefined ? this._data[key] : this._data, true);
        },

        set: function (key, value) {
            // key?
            if (key === undefined) {
                return;
            }
            // trim?
            if (_.isString(value) && this.schema.isTrimmed(key)) {
                value = $.trim(value);
            }
            // changed?
            if (isEqual(value, this._data[key])) {
                return;
            }
            // validate only if really changed - yes, initial value might conflict with schema
            // but we validate each field again during final consistency checks
            var result = this.schema.validate(key, value);
            if (result !== true) {
                this.trigger('error:invalid', result);
                return;
            }
            // update
            this._data[key] = value;
            this.trigger('change:' + key + ' change', key, value);
        },

        isDirty: function () {
            // the model is dirty if any property differs from its previous or default value
            var key, value, previous = this._previous, defaults = this._defaults, changed;
            for (key in this._data) {
                value = this._data[key];
                changed = !(isEqual(value, previous[key]) || isEqual(value, defaults[key]));
                if (changed) {
                    return true;
                }
            }
            return false;
        },

        getChanges: function () {
            var changes = {}, previous = this._previous;
            _(this._data).each(function (value, key) {
                if (!isEqual(value, previous[key])) {
                    changes[key] = value;
                }
            });
            return changes;
        },

        toString: function () {
            return JSON.stringify(this._data);
        },

        // DEPRECATED
        setData: function (data) {
            console.warn('DEPRECATED: setData - use initialize()');
            this.init(data);
        },

        /* DEPRECATED - get() without any parameter returns all data as well */
        getData: function () {
            console.warn('DEPRECATED: getData - use get()');
            // return deep copy
            return _.copy(this._data, true);
        },


        // DEPRECATED
        getDefinition: function (prop) {
            console.warn('DEPRECATED: getDefinition -> schema.get()');
            return this.schema.get(prop);
        },

        // DEPRECATED
        validate: function (prop, value) {
            console.warn('DEPRECATED: validate -> schema.validate()');
            return this.schema.validate(prop, value);
        },

        // DEPRECATED
        // can return deferred object / otherwise just instance of Error or nothing
        check: function (data, Error) {
            console.warn('DEPRECATED: check -> schema.check()');
            return this.schema.check(data, Error);
        },

        // DEPRECATED
        isMandatory: function (prop) {
            console.warn('DEPRECATED: isMandatory');
            return this.schema.isMandatory(prop);
        },

        // DEPRECATED
        isTrimmed: function (prop) {
            console.warn('DEPRECATED: isTrimmed');
            return this.schema.isTrimmed(prop);
        },

        save: (function () {

            var checkValid = function (valid, value, key) {
                    var result = this.schema.validate(key, value);
                    if (result !== true) {
                        this.trigger('error:invalid', result);
                        return false;
                    } else {
                        return valid;
                    }
                },
                success = function () {
                    // trigger store - expects deferred object
                    return (this.store(this._data, this.getChanges()) || $.when())
                        .done(_.bind(this.initialize, this, this._data));
                },
                fail = function (error) {
                    // fail
                    this.trigger('error:inconsistent', error);
                    return error;
                };

            return function () {

                // check all properties
                if (!_(this._data).inject(checkValid, true, this)) {
                    return $.Deferred().reject();
                }

                // check consistency
                var consistency = this.schema.check(this._data, Error);

                if (!_.isFunction((consistency || {}).promise)) {
                    consistency = typeof consistency === 'object' ?
                        $.Deferred().reject(consistency) : $.when();
                }

                return consistency.pipe(_.bind(success, this), _.bind(fail, this));
            };
        }()),

        // store method must be replaced by custom handler
        store: function (data, changes) {
        },

        // destructor
        destroy: function () {
            this.events.destroy();
            this._data = null;
            this._previous = null;
            this._defaults = null;
        }
    };

    // allow extend()
    _.makeExtendable(Model);

    // publish Schema class
    Model.Schema = Schema;

    return Model;
});
