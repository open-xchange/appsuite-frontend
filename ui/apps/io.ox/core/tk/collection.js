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

// just a slightly modified version of the backbone collection,
// that should work with our model implementation and help us alot
define('io.ox/core/tk/collection', [
    'io.ox/core/event',
    'io.ox/core/tk/model'
], function (Events, Model) {
    'use strict';

    var Collection;

    var slice = Array.prototype.slice;
    var splice = Array.prototype.splice;


    Collection = function (models, options) {
        options = options || {};
        console.log('MODELS in constructor');
        console.log(models);
        if (options.model) {
            this.model = options.model;
        }
        if (options.comparator) {
            this.comparator = options.comparator;
        }
        Events.extend(this);
        this._reset();
        this.initialize.apply(arguments);
        if (models) {
            this.reset(models, {silent: true, parse: options.parse});
        }

    };

    Collection.prototype = {
        model: Model,
        initialize: function () {

        },
        toJSON: function (options) {
            return this.map(function (model) {
                return model.toJSON(options);
            });
        },

        // Add a model, or list of models to the set. Pass silent to avoid firing the add event for every new model.
        add: function (models, options) {
            var i, index, length, model, cid, id, cids = {}, ids = {}, dups = [];
            options = options || {};
            models = _.isArray(models) ? models.slice() : [models];


            //Begin by turning bare objects into model references, and preventing invalid models or duplicate models from being added.
            for (i = 0, length = models.length; i < length; i++) {
                if (!(model = models[i] = this._prepareModel(models[i], options))) {
                    throw new Error("Can't add an invalid model to a collection");
                }
                cid = model.cid;
                id = model.id;
                if (cids[cid] || this._byCid[cid] || ((id !== null) && (ids[id] || this._byId[id]))) {
                    dups.push(i);
                    continue;
                }
                cids[cid] = ids[id] = model;
            }

            //Remove duplicates.
            i = dups.length;
            while (i--) {
                models.splice(dups[i], 1);
            }
            // Listen to added models' events, and index models for lookup by id and by cid.
            for (i = 0, length = models.length; i < length; i++) {
                (model = models[i]).on('triggered', _.bind(this._onModelEvent, this));
                this._byCid[model.cid] = model;
                if (model.id !== null) {
                    this._byId[model.id] = model;
                }
            }
            console.log('hehehhe');
            console.log(models);
            //Insert models into the collection, re-sorting if needed, and triggering add events unless silenced.
            this.length += length;
            index = options.at !== null ? options.at : this.models.length;
            splice.apply(this.models, [index, 0].concat(models));
            if (this.comparator) {
                this.sort({silent: true});
            }
            if (options.silent) {
                return this;
            }
            console.log('ho');
            for (i = 0, length = this.models.length; i < length; i++) {
                if (!cids[(model = this.models[i]).cid]) {
                    continue;
                }
                options.index = i;
                console.log('triggeron modle');
                model.trigger('add', model, this, options);
                console.log('triggered away');
            }

            console.log('passed');

            return this;

        },
        // Remove a model, or a list of models from the set. Pass silent to avoid firing the remove event for every model removed.
        remove: function (models, options) {
            var i, l, index, model;
            options = options || {};
            models = _.isArray(models) ? models.slice() : [models];
            for (i = 0, l = models.length; i < l; i++) {
                model = this.getByCid(models[i]) || this.get(models[i]);
                if (!model) {
                    continue;
                }
                delete this._byId[model.id];
                delete this._byCid[model.cid];
                index = this.indexOf(model);
                this.models.splice(index, 1);
                this.length--;
                if (!options.silent) {
                    options.index = index;
                    model.trigger('remove', model, this, options);
                }
                this._removeReference(model);
            }
            return this;

        },

        _reset: function () {
            this.length = 0;
            this.models = [];
            this._byId = {};
            this._byCid = {};
        },

        push: function (model, options) {
            model = this._prepareModel(model, options);
            this.add(model, options);
            return model;
        },

        pop: function (options) {
            var model = this.at(this.length - 1);
            this.remove(model, options);
            return model;
        },
        unshift: function (model, options) {
            model = this._prepareModel(model, options);
            this.add(model, _.extend({at: 0}, options));
            return model;

        },
        shift: function (options) {
            var model = this.at(0);
            this.remove(model, options);
            return model;
        },

        get: function (id) {
            if (id === null) {
                return 0;
            }
            return this._byId[id.id !== null ? id.id : id];

        },
        getByCid: function (cid) {
            return cid && this._byCid[cid.cid || cid];
        },
        at: function (index) {
            return this.models[index];
        },
        where: function (attrs) {
            if (_.isEmpty(attrs)) {
                return [];
            }
            return this.filter(function (model) {
                for (var key in attrs) {
                    if (attrs[key] !== model.get(key)) {
                        return false;
                    }
                }
                return true;
            });
        },
        sort: function (options) {
            options = options || {};
            if (!this.comparator) {
                throw new Error('Cannot sort a set without a comparator');
            }
            var boundComparator = _.bind(this.comparator, this);
            if (this.comparator.length === 1) {
                this.models = this.sortBy(boundComparator);
            } else {
                this.models.sort(boundComparator);
            }
            if (!options.silent) this.trigger('reset', this, options);
            return this;
        },
        pluck: function (attr) {
            return _.map(this.models, function (model) { return model.get(attr); });
        },
        reset: function (models, options) {
            models = models || [];
            options = options || {};
            for (var i = 0, l = this.models.length; i < l; i++) {
                this._removeReference(this.models[i]);
            }
            this._reset();
            this.add(models, _.extend({silent: true}, options));
            if (!options.silent) this.trigger('reset', this, options);
            return this;
        },
        fetch: function (options) {
            // should be overwritten
        },
        create: function (model, options) {
            // just no need i can see now
        },
        parse: function (resp, xhr) {
            // also no need, yet
            return resp;
        },
        chain: function () {
            return _(this.models).chain();
        },
        _prepareModel: function (model, options) {
            options = options || {};
            if (!(model instanceof Model)) {
                var attrs = model;
                options.collection = this;
                //model = new this.model(attrs, options);
                model = new this.model({data: attrs});
                model.collection = this;
                if (!model._validate(model.attributes, options)) {
                    model = false;
                }
            } else if (!model.collection) {
                model.collection = this;
            }
            return model;
        },
        _removeReference: function (model) {
            if (this === model.collection) {
                delete model.collection;
            }
            model.off('triggered', _.bind(this._onModelEvent, this));
        },
        _onModelEvent: function (evt, event, model, collection, options) {
            // just to make this work with our event model
            var args = $.makeArray(arguments), evt = args.shift();

            if ((event === 'add' || event === 'remove') && collection !== this) {
                return;
            }
            if (event === 'destroy') {
                this.remove(model, options);
            }
            if (model && event === 'change:' + model.idAttribute) {
                delete this._byId[model.previous(model.idAttribute)];
                this._byId[model.id] = model;
            }
            this.trigger.apply(this, args);
        }
    };




    // Underscore methods that we want to implement on the Collection.
    var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find',
    'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any',
    'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex',
    'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf',
    'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'];


    _.each(methods, function (method) {
        Collection.prototype[method] = function () {
            return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
        };
    });

    _.makeExtendable(Collection);
    return Collection;
});
