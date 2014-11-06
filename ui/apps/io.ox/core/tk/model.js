/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */
/*global
define: true
*/
define('io.ox/core/tk/model', ['io.ox/core/event'], function (Events) {

    'use strict';

    var Error, regEmail, formats, isEqual, Schema, Model;

    /**
     * General local Error class
     */
    Error = function (props, message) {
        this.properties = _.isArray(props) ? props : [props];
        this.message = message;
    };

    /**
     * Formats for validation
     */
    regEmail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

    formats = {
        string: function () {
            // always true!
            return true;
        },
        text: function () {
            return true;
        },
        number: function (prop, val, def) {
            var regex = /^\d+$/;
            // return _.isNumber(val) ||
            return regex.test(val) ||
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
        date: function () {
            return true;
        },
        pastDate: function (prop, val, def) {
            if (_.isString(val)) {
                return new Error(prop, _.printf('%s is not a valide date', def.i18n || prop));
            }
            return _.now() > val || new Error(prop, _.printf('%s must be in the past', def.i18n || prop));
        },
        email: function (prop, val, def) {
            return regEmail.test(val) ||
                new Error(prop, _.printf('%s must be a valid email address', def.i18n || prop));
        },
        url: function () {
            return true;
        }
    };

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
    Schema = function (definitions) {
        this._definitions = definitions || {};
    };

    Schema.prototype = {

        formats: formats,

        get: function (key) {
            return this._definitions[key] || {};
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

        getMandatories: function () {
            var tmp = [];
            _(this._definitions).each(function (def, prop) {
                if (def.mandatory) {
                    tmp.push(prop);
                }
            });
            return tmp;
        },

        isMandatory: function (key) {
            return !!this.get(key).mandatory;
        },

        getFieldType: function (key) {
            return this.get(key).format;
        },

        getFieldLabel: function (key) {
            return this.get(key).label;
        },

        isTrimmed: function (key) {
            return this.get(key).trim !== false;
        },

        validate: function (key, value) {
            var def = this.get(key),
                format = def.format || 'string',
                isEmpty = value === '' || value === null,
                isNotMandatory = def.mandatory !== true;
            if (isEmpty) {
                return isNotMandatory ||
                    new Error(key, _.printf('%s is mandatory', def.i18n || key));
            }
            if (_.isFunction(this.formats[format])) {
                return this.formats[format](key, value, def);
            }
            // undefined format
            console.error('Unknown format used in model schema', format);
        },

        // can return deferred object / otherwise just instance of Error or nothing
        check: function () {
            return $.when();
        }
    };

    /**
     * Model
     */

    // yep, this could be done once upfront but we no longer pay for CPU ticks, so ...
    var triggerTransitives = function (key) {
        _(this._computed).each(function (o, computed) {
            if (_(o.deps).indexOf(key) > -1) {
                var memo = this._memoize[computed],
                    value = this.get(computed);
                if (!_.isEqual(memo, value)) {
                    this.trigger('change:' + computed, computed, value);
                    triggerTransitives.call(this, computed);
                }
            }
        }, this);
    };

    Model = function (options) {
        options = options || {};
        this._data = {};
        this._previous = {};
        this._defaults = this.schema.getDefaults();
        this._memoize = {};
        // automatically clientid
        this.cid = _.uniqueId('c');
        Events.extend(this);
        // TODO: we ALWAYS need data! do we have any options? I always forget to use key/value here
        this.initialize(options.data || options || {});
    };

    Model.addComputed = function (key, /* optional */ deps, callback) {
        if (!callback) {
            callback = deps;
            deps = [];
        }
        if (key && _.isFunction(callback)) {
            this.prototype._computed[key] = { deps: deps, callback: callback };
        }
        return this;
    };

    Model.prototype = {

        _computed: {},
        idAttribute: 'id',

        schema: new Schema(),

        initialize: function (data) {
            // deep copy to avoid side effects
            this._previous = _.copy(data || {}, true);
            // due to defaultValues, data and previous might differ.
            // however, the model is not dirty
            this._data = _.extend({}, this._defaults, _.copy(data || {}, true));

            // set the id additionally if possible (useful for identifying duplicates and the likes
            if (this.idAttribute in this._data) {
                this.id = this._data[this.idAttribute];
            }
            // memoize computed properties
            _(this._computed).each(function (o, key) {
                this.get(key);
            }, this);
        },

        isEmpty: function (key) {
            // check if value would appear as empty string in UI
            var value = this._data[key];
            return value === '' || value === undefined || value === null;
        },

        has: function (key) {
            return key in this._data;
        },

        get: function (key) {
            if (key === undefined) {
                // get all values
                return _.copy(this._data, true);
            } else if (this._computed[key] === undefined) {
                // get single value
                return _.copy(this._data[key], true);
            } else {
                // get computed value
                var o = this._computed[key],
                    params = _(o.deps).map(this.get, this),
                    value = o.callback.apply(this, params);
                return (this._memoize[key] = value);
            }
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
            // update value first
            this._data[key] = value;

            // trigger now
            if (result !== true) {
                this.trigger('error:invalid', result);
                // yep, we continue here to actually get invalid data
                // we need this for a proper final check during save
            }
            // trigger change event for property and global change
            this.trigger('change:' + key + ' change', key, value);
            // trigger change event for computed properties
            triggerTransitives.call(this, key);
        },

        isDirty: function () {
            // the model is dirty if any property differs from its previous or default value
            var key, value, previous = this._previous, defaults = this._defaults, changed;
            for (key in this._data) {
                value = this._data[key];
                // use 'soft' isEqual for previous, 'hard' isEqual for default values
                changed = !(isEqual(value, previous[key]) || _.isEqual(value, defaults[key]));
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
                    changes[key] = _.copy(value, true);
                }
            });
            return changes;
        },

        toString: function () {
            return JSON.stringify(this._data);
        },
        toJSON: function () {
            //just for compability with collection (backbone)
            return this.toString();
        },

        // DEPRECATED
        setData: function (data) {
            console.warn('DEPRECATED: setData - use initialize()');
            this.initialize(data);
        },

        /* DEPRECATED - get() without any parameter returns all data as well */
        getData: function () {
            console.warn('DEPRECATED: getData - use get()');
            // return deep copy
            return _.copy(this._data, true);
        },

        //just for compability with collection
        _validate: function () {
            return true;
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
                    var def = $.Deferred().notify(), self = this;
                    this.trigger('save:progress');
                    (this.store(this.get(), this.getChanges()) || $.when())
                        .done(function () {
                            // not yet destroyed?
                            if ('trigger' in self) {
                                self.initialize(self._data);
                                self.trigger.apply(self, ['save:beforedone'].concat($.makeArray(arguments)));
                                self.trigger.apply(self, ['save:done'].concat($.makeArray(arguments)));
                            }
                            def.resolve.apply(def, arguments);
                        })
                        .fail(function () {
                            if ('trigger' in self) {
                                self.trigger.apply(self, ['save:beforefail'].concat($.makeArray(arguments)));
                                self.trigger.apply(self, ['save:fail'].concat($.makeArray(arguments)));
                            }
                            def.reject.apply(def, arguments);
                        });
                    return def;
                },
                fail = function (error) {
                    // fail
                    this.trigger('error:invalid', error);
                    return error;
                };

            return function () {

                // add mandatory fields to force validation
                _(this.schema.getMandatories()).each(function (key) {
                    if (!(key in this._data)) {
                        this._data[key] = '';
                    }
                }, this);

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
        store: function () { },

        // destructor
        destroy: function () {
            this.events.destroy();
            this._data = null;
            this._previous = null;
            this._defaults = null;
            this._memoize = null;
        }
    };

    // allow extend()
    _.makeExtendable(Model);

    // publish Schema class
    Model.Schema = Schema;

    return Model;
});
