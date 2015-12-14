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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/backbone/modelFactory', [
    'io.ox/backbone/basicModel',
    'io.ox/core/extensions'
], function (BasicModel, ext) {

    'use strict';

    var OXModel = BasicModel.extend({
        idAttribute: '_uid',
        initialize: function () {
            BasicModel.prototype.initialize.apply(this, $.makeArray(arguments));

            this.realm = this.get('_realm') || this.factory.realm('default');
            delete this.attributes._realm;

            this.syncer = this.factory.internal;

            var self = this;
            this.on('sync', function () {
                self.touchedAttributes = {};
            });
        },
        point: function (subpath) {
            return this.factory.point(subpath);
        },
        touch: function () {
            var self = this;
            this.touchedAttributes = this.touchedAttributes || {};

            _(arguments).each(function (attribute) {
                self.touchedAttributes[attribute] = true;
            });

        },
        changedSinceLoading: function () {
            var self = this,
                oldAttributes = this.realm.internal.cachedServerAttributes(this.id) || {},
                currentAttributes = this.attributes,
                keys = {},
                retval = {};

            // Collect keys set
            _(oldAttributes).chain().keys().each(function (key) {
                keys[key] = 1;
            });

            _(currentAttributes).chain().keys().each(function (key) {
                keys[key] = 1;
            });

            _(keys).chain().keys().each(function (key) {

                var o = oldAttributes[key],
                    c = currentAttributes[key],
                    different = false;

                if (self.touchedAttributes && self.touchedAttributes[key]) {
                    retval[key] = c;
                } else if (o !== c) {
                    if (_.isArray(o) && _.isArray(c)) {
                        if (_(o).difference(c).length !== 0 || _(c).difference(o).length !== 0) {
                            if (o.length !== c.length) {
                                different = true;
                            } else {
                                _.each(c, function (val, key) {

                                    _.each(c[key], function (val2, key2) {

                                        if (o[key] === undefined) {
                                            different = true;
                                        } else if (val2 !== o[key][key2]) {
                                            different = true;
                                        }
                                    });

                                });
                            }

                            if (different === true) {
                                retval[key] = c;
                            }

                        }
                    } else {
                        retval[key] = c;
                    }
                }

            });
            return retval;
        },

        isDirty: function () {
            return !_.isEmpty(this.changedSinceLoading());
        },
        getCompositeId: function () {
            return (this.get('folder') || this.get('folder_id')) + '.' + (this.get('id') || 'new-object');
        }
    });

    function ModelRealm(name, factory) {
        var models = {},
            serverAttributes = {},
            self = this,
            refCount = 0;

        this.internal = {
            cachedServerAttributes: function (uid) {
                return serverAttributes[uid] || {};
            }
        };

        this.create = function (options) {
            var loaded = new factory.model(options),
                uid = factory.internal.toUniqueIdFromObject(options);

            models[uid] = loaded;
            serverAttributes[uid] = JSON.parse(JSON.stringify(loaded.toJSON()));
            return loaded;
        };

        this.get = function () {
            var args = $.makeArray(arguments),
                uid = factory.internal.toUniqueIdFromGet.apply(factory, args),
                def = $.Deferred();
            if (models[uid]) {
                return $.Deferred().resolve(models[uid]);
            }

            factory.internal.load.apply(factory.internal, args).done(function (data) {
                data._realm = self;

                var loaded = new factory.model(data);
                models[loaded.id] = loaded;
                serverAttributes[loaded.id] = JSON.parse(JSON.stringify(loaded.toJSON()));
                def.resolve(loaded);
            }).fail(def.reject);

            return def;
        };

        this.getAll = function () {
            var def = $.Deferred();
            factory.internal.loadAll.apply(factory.internal, $.makeArray(arguments)).done(function () {
                self.getList.apply(self, $.makeArray(arguments)).done(def.resolve).fail(def.reject);
            }).fail(def.reject);
            return def;
        };

        this.getList = function () {
            var def = $.Deferred(),
                uidIdList = factory.internal.componentizeList.apply(factory.internal, $.makeArray(arguments)),
                idsToLoad = [];

            _(uidIdList).each(function (tuple) {
                if (!models[tuple.uid]) {
                    idsToLoad.push(tuple.id);
                }
            });

            function resolveResult() {
                var allModels = _(uidIdList).map(function (tuple) {
                    return models[tuple.uid];
                });
                def.resolve(allModels);
            }

            if (_.isEmpty(idsToLoad)) {
                resolveResult();
                return def;
            }

            factory.internal.loadBulk(idsToLoad).done(function (result) {
                _(result).each(function (data) {
                    data._realm = self;

                    var loaded = factory.create(data);
                    models[loaded.id] = loaded;
                    serverAttributes[loaded.id] = JSON.parse(JSON.stringify(loaded.toJSON()));
                });
                resolveResult();

            }).fail(def.reject);

            return def;
        };

        this.refresh = function (uid, data) {
            // TODO: Implement non-destructive refresh, i.e. keep changes in the model and only update unchanged fields, throw a conflict event for other fields
            if (models[uid]) {
                var model = models[uid];
                // Unset all
                _(model.attributes).each(function (value, name) {
                    if (!/^_/.test(name)) {
                        model.unset(name, { silent: true });
                    }
                });
                model.set(data);
                serverAttributes[uid] = JSON.parse(JSON.stringify(model.toJSON()));
            }
        };

        this.markDestroyed = function (uid) {
            if (models[uid]) {
                var model = models[uid];
                delete models[uid];
                model.trigger('destroy', model);
            }
        };

        this.destroy = function () {
            _(models).each(function (model) {
                model.off();
            });
            models = {};
        };

        this.retain = function () {
            refCount++;
            return this;
        };

        this.release = function () {
            refCount--;
            if (refCount <= 0) {
                refCount = 0;
                this.destroy();
            }
        };

        factory.point('realm').invoke('extend', this);

    }

    function ModelFactory(delegate) {
        this.internal = {};

        var self = this,
            realms = {};

        this.realm = function (name) {
            if (!name) {
                return this.realm('default');
            }
            return realms[name] || (realms[name] = new ModelRealm(name, this));
        };

        this.model = OXModel.extend(_.extend({
            factory: this
        }, (delegate.model || {})));
        this.collection = Backbone.Collection.extend({
            model: this.model,
            sync: function () {
                return self.point('collection/sync').invoke('sync', this, $.makeArray(arguments));
            }
        });

        this.api = delegate.api;
        this.ref = delegate.ref;

        function processLoaded(loaded) {
            var uid = self.internal.toUniqueIdFromObject(loaded);
            loaded._uid = uid;
            return loaded;
        }

        this.internal.load = delegate.load || function () {
            var args = $.makeArray(arguments);

            return self.api.get.apply(self.api, args).then(processLoaded);
        };

        this.internal.loadAll = delegate.loadAll || function () {
            return self.api.getAll.apply(self.api, $.makeArray(arguments));
        };

        this.internal.loadBulk = delegate.loadBulk || function (idsToLoad) {
            return self.api.getList(idsToLoad).then(function (result) {
                _(result).each(processLoaded);
                return result;
            });
        };

        this.internal.create = delegate.create || function (model) {
            return self.api.create(model.toJSON());
        };

        this.internal.read = delegate.read || function (model) {
            return self.api.get({ id: model.get('id'), folder: model.get('folder') || model.get('folder_id') }).done(function (data) {
                model.realm.refresh(self.internal.toUniqueIdFromObject(data), data);
            });
        };

        this.internal.update = delegate.update || function (model) {
            var attributesToSave = null;
            if (delegate.getUpdatedAttributes) {
                attributesToSave = delegate.getUpdatedAttributes(model);
            } else {
                attributesToSave = model.changedSinceLoading();
                attributesToSave.id = model.id;
                attributesToSave.last_modified = model.get('last_modified');
                if (!attributesToSave.folder) {
                    attributesToSave.folder = model.get('folder') || model.get('folder_id');
                }
            }

            return self.api.update(attributesToSave);
        };

        this.internal.destroy = delegate.destroy || function (model) {
            return self.api.remove({ id: model.id, folder: model.get('folder_id') || model.get('folder') });
        };

        this.internal.toUniqueId = delegate.toUniqueId || function (options) {
            return options.id;
        };

        this.internal.toUniqueIdFromGet = delegate.toUniqueIdFromGet || this.internal.toUniqueId;
        this.internal.toUniqueIdFromObject = delegate.toUniqueIdFromObject || this.internal.toUniqueId;

        this.internal.eventToGetArguments = delegate.eventToGetArguments || function (evt, obj) {
            return [{ id: obj.id, folder: obj.folder || obj.folder_id }];
        };

        this.internal.componentizeList = delegate.componentizeList || function (entities) {
            return _(entities).map(function (entity) {
                return {
                    uid: self.internal.toUniqueIdFromObject(entity),
                    id: entity
                };
            });
        };

        if (!/\/$/.test(this.ref)) {
            this.ref = this.ref + '/';
        }
        this.point = this.point || function (subpath) {
            if (/^\//.test(subpath)) {
                subpath = subpath.substring(1);
            }
            return ext.point(this.ref + subpath);
        };

        this.get = this.get || function () {
            var realm = this.realm('default');
            return realm.get.apply(realm, $.makeArray(arguments));
        };

        this.getAll = this.getAll || function () {
            var realm = this.realm('default');
            return realm.getAll.apply(realm, $.makeArray(arguments));
        };

        this.getList = this.getList || function () {
            var realm = this.realm('default');
            return realm.getList.apply(realm, $.makeArray(arguments));
        };

        this.create = this.create || function (options) {
            options = options || {};
            if (options.id) {
                // Assume this was loaded
                var realm = this.realm('default');
                return realm.create(options);
            }
            return new this.model(options);
        };

        this.createCollection = this.createCollection || function (initial) {
            return new this.collection(initial);
        };

        // catch the typical events of the api and propagate them onto cached backbone models

        this.internal.updateEvents = delegate.updateEvents || ['update'];
        this.internal.destroyEvents = delegate.destroyEvents || ['delete'];

        _(this.internal.updateEvents).each(function (eventName) {

            self.api.on(eventName, function () {
                var args = self.internal.eventToGetArguments.apply(self, $.makeArray(arguments)),
                    uid = self.internal.toUniqueIdFromGet.apply(self, args);

                self.api.get.apply(self.api, args).done(function (loaded) {
                    _(realms).each(function (realm) {
                        realm.refresh(uid, loaded);
                    });
                });
            });
        });

        _(this.internal.destroyEvents).each(function (eventName) {

            self.api.on(eventName, function () {
                var args = self.internal.eventToGetArguments.apply(self, $.makeArray(arguments)),
                    uid = self.internal.toUniqueIdFromGet.apply(self, args);

                _(realms).each(function (realm) {
                    realm.markDestroyed(uid);
                });

            });
        });

        // Register the extension that calls subextensions under the namespace + attribute name
        // For example to check the display_name attribute in the model registered in the extension namespace 'io.ox/contacts/model'
        // It would invoke 'validate' on 'io.ox/contacts/model/validation/display_name'
        this.point('validation').extend({
            id: 'generic',
            validate: function (attributes, errors) {
                _(attributes).each(function (value, key) {
                    // What's the plural of analysis again?
                    var analysisisis = self.point('validation/' + key).invoke('validate', errors, value, errors, attributes, key).value();
                    // If the extension returned a falsy value, we assume everything is correct
                    // If the value is truthy, it can be either an array or another object (typically a string)
                    // the array elements are passed as individual errors to the error collection for this attribute
                    // a different message is passed as is
                    _(analysisisis).each(function (analysis) {
                        if (analysis) {
                            if (_.isArray(analysis)) {
                                _(analysis).each(function (message) {
                                    errors.add(key, message);
                                });
                            } else {
                                errors.add(key, analysis);
                            }
                        }
                    });
                });
            }
        });

        this.wrap = function (thing) {
            if (arguments.length > 1) {
                return this.createCollection(_(arguments).map(function (arg) { return self.wrap(arg); }));
            }

            if (thing.attributes && thing.factory === this) {
                return thing;
            }

            return this.create(thing);

        };

        _($.makeArray(arguments).splice(1)).each(function (mixin) {
            _.extend(self, mixin);
        });

    }

    return ModelFactory;
});
