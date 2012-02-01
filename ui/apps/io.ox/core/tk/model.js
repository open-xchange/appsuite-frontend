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
                return regEmail.test(val) ||
                    new Error(prop, _.printf('%s must be a valid email address', def.i18n || prop));
            },
            url: function (prop, val, def) {
                return true;
            }
        };

    /**
     * Model
     */
    function Model(data) {
        this.setData(data);
        Events.extend(this);
    }

    Model.prototype = {

        _data: {},
        _previous: {},
        _dirty: false,

        schema: {},
        formats: formats,

        get: function (key) {
            return this._data[key];
        },

        set: function (key, value) {
            // changed?
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
            this._dirty = true;
            this.trigger('change:' + key + ' change', key, value);
        },

        setData: function (data) {
            // deep clone to avoid side effects
            this._previous = _.clone(data || {}, true);
            this._data = data = _.clone(data || {}, true);
            // apply defaults
            _(this.schema).each(function (def, key) {
                if (data[key] === undefined) {
                    if (def.defaultValue !== undefined) {
                        data[key] = def.defaultValue;
                    } else if (def.mandatory === true) {
                        data[key] = '';
                    }
                }
            });
            // due to defaultValues, data and previous might differ.
            // however, the model is not dirty
            this._dirty = false;
        },

        getData: function () {
            // return deep copy
            return _.clone(this._data, true);
        },

        isDirty: function () {
            return this._dirty;
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

            if (consistent !== true) {
                self.trigger('error:inconsistent', consistent);
                return $.Deferred().reject();
            }

            // trigger store - expects deferred object
            return (this.store(this._data, this.getChanges()) || $.when())
                .done(function () {
                    self._dirty = false;
                });
        },

        // store method must be replaced by custom handler
        store: function (data, changes) { },

        // destructor
        destroy: function () {
            this.events.destroy();
            this._data = null;
            this._previous = null;
            this._dirty = false;
        }
    };

    _.makeExtendable(Model);

    /**
     * Stupid test cases - will be removed
     */
    window.modelTest = function () {

        var M = Model.extend({
            schema: {
                hallo: { format: 'string', defaultValue: 'welt' },
                huppi: { format: 'string', mandatory: true },
                num: { format: 'number', defaultValue: 1337, i18n: 'Hausnummer' },
                mail: { format: 'email', i18n: 'E-Mail #1' }
            },
            checkConsistency: function (data, Error) {
                if (data.num >= data.id) {
                    return new Error(['num', 'id'], 'num must be less than id');
                }
                return true;
            },
            store: function (data, changes) {
                console.warn('store!', data, changes);
            }
        });

        var m = window.model = new M({ id: 1000, hey: 'ho' });

        console.log('instance', m);
        console.log('data', m.getData());

        m.on('error:invalid error:inconsistent', function (e, error) {
            console.log('Fail!', e.type, error.message, error.properties);
        });

        m.set('hallo', 'world');
        m.set('num', 'hurz');
        m.save();
        m.set('num', 900);
        m.set('huppi', 'fluppi');
        console.log('dirty?', m.isDirty());
        m.save()
            .done(function () {
                console.log('Done: save. Is dirty?', m.isDirty());
            })
            .fail(function () {
                console.log('Could not save!');
            });
    };

    return Model;
});
