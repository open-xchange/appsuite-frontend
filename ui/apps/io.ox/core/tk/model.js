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
                return true;
            },
            email: function (prop, val, def) {
                console.log('is email?');
                console.log(regEmail.test(val));
                return regEmail.test(val) ||
                    new Error(prop, _.printf('%s must be a valid email address', def.i18n || prop));
            },
            url: function (prop, val, def) {
                return true;
            }
        },

        copyDefaults = function (def, key) {
            if (def.defaultValue !== undefined) {
                this._defaults[key] = def.defaultValue;
            }
        };

    /**
     * Model
     */
    function Model(options) {
        options = options || {};
        this._data = {};
        this._previous = {};
        this._defaults = {};
        _(this.schema).each(_.bind(copyDefaults, this));
        this.setData(options.data);
        Events.extend(this);
    }

    Model.prototype = {

        schema: {},
        formats: formats,

        get: function (key) {
            if (key !== undefined) {
                console.log('getting ' + key + ': ' + this._data[key]);
            }
            // return deep copy
            return _.copy(key !== undefined ? this._data[key] : this._data, true);
        },

        set: function (key, value) {
            // changed?
            console.log('set ' + key + ':' + value);
            if (_.isEqual(value, this._data[key])) {
                // TODO: guess isEqual is too strict here, e.g. undefined vs. ''
                return;
            }
            // validate only if really changed - yes, initial value might conflict with schema
            // but we validate each field again during final consistency checks
            var result = this.validate(key, value);
            if (result !== true) {
                this.trigger('error:invalid', result);
                return;
            }
            // update
            this._data[key] = value;
            this.trigger('change:' + key + ' change', key, value);
        },

        setData: function (data) {
            // deep copy to avoid side effects
            this._previous = _.copy(data || {}, true);
            // due to defaultValues, data and previous might differ.
            // however, the model is not dirty
            this._data = _.extend({}, this._defaults, _.copy(data || {}, true));
        },

        /* DEPRECATED - get() without any parameter returns all data as well */
        getData: function () {
            // return deep copy
            return _.copy(this._data, true);
        },

        isDirty: function () {
            // the model is dirty if any property differs from its previous or default value
            var key, value, previous = this._previous, defaults = this._defaults, isEqual;
            for (key in this._data) {
                value = this._data[key];
                isEqual = _.isEqual(value, previous[key]) || _.isEqual(value, defaults[key]);
                if (!isEqual) {
                    return true;
                }
            }
            return false;
        },

        getChanges: function () {
            var changes = {}, previous = this._previous;
            _(this._data).each(function (value, key) {
                if (!_.isEqual(value, previous[key])) {
                    changes[key] = value;
                }
            });
            return changes;
        },

        validate: function (prop, value) {
            var def = this.schema[prop] || {},
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

        checkConsistency: function (data, Error) {
            return true;
        },

        isMandatory: function (key) {
            return !!(this.getDefinition(key) || {}).mandatory;
        },

        getFieldtype: function (key) {
            return (this.getDefinition(key) || {}).format;
        },

        getDefinition: function (key) {
            var f = this.schema[key];
            return f || false; // this could be undefined!?
        },

        toString: function () {
            return JSON.stringify(this._data);
        },

        save: function () {

            var self = this, valid, consistent;

            // check all properties
            valid = _(this._data)
                .inject(function (state, value, key) {
                    var result = self.validate(key, value);
                    if (result !== true) {
                        self.trigger('error:invalid', result);
                        return false;
                    } else {
                        return state;
                    }
                }, true);

            if (!valid) {
                return $.Deferred().reject();
            }

            // check consistency
            consistent = this.checkConsistency(this._data, Error);

            if (typeof consistent === 'object') {
                self.trigger('error:inconsistent', consistent);
                return $.Deferred().reject();
            }

            // trigger store - expects deferred object
            return (this.store(this._data, this.getChanges()) || $.when())
                .done(function () {
                    self.setData(self._data);
                });
        },

        // store method must be replaced by custom handler
        store: function (data, changes) { },

        // destructor
        destroy: function () {
            this.events.destroy();
            this._data = null;
            this._previous = null;
            this._defaults = null;
        }
    };

    _.makeExtendable(Model);

    return Model;
});
