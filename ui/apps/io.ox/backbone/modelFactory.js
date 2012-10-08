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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define("io.ox/backbone/modelFactory", ["io.ox/core/extensions", 'gettext!io.ox/backbone/model'], function (ext, gt) {
    "use strict";


    function ValidationErrors() {
        this.errors = {};

        this.add = function (attribute, error) {
            (this.errors[attribute] || (this.errors[attribute] = [])).push(error);
            return this;
        };

        this.hasErrors = function () {
            return !_.isEmpty(this.errors);
        };

        this.errorsFor = function (attribute) {
            return this.errors[attribute];
        };

        this.each = function () {
            var wrapped = _(this.errors);
            return wrapped.each.apply(wrapped, $.makeArray(arguments));
        };
    }

    var OXModel = Backbone.Model.extend({
        idAttribute: '_uid',
        initialize: function (obj) {
            this.realm = this.get('_realm') || this.factory.realm("default");
            this._valid = true;
            this.attributeValidity = {};

            delete this.attributes._realm;

        },
        validate: function (attributes) {
            var self = this,
                errors = new ValidationErrors();

            attributes = attributes || this.toJSON();
            this.factory.point("validation").invoke("validate", errors, attributes, errors, this);

            if (errors.hasErrors()) {
                var validAttributes = {};
                _(attributes).chain().keys().each(function (key) {
                    validAttributes[key] = true;
                });
                errors.each(function (messages, attribute) {
                    validAttributes[attribute] = false;
                    self.trigger("invalid:" + attribute, messages, errors, self);
                });
                // Trigger a valid:attribute event for all attributes that have turned valid
                _(self.attributeValidity).each(function (wasValid, attribute) {
                    if (!wasValid && validAttributes[attribute]) {
                        self.trigger('valid:' + attribute, self);
                    }
                });

                self.attributeValidity = validAttributes;
                self.trigger('invalid', errors, self);
                self._valid = false;
            } else {
                if (!self._valid) {
                    _(self.attributeValidity).each(function (wasValid, attribute) {
                        if (!wasValid) {
                            self.trigger('valid:' + attribute, self);
                        }
                    });

                    _(attributes).chain().keys().each(function (key) {
                        self.attributeValidity[key] = true;
                    });
                    self._valid = true;
                    this.trigger('valid');
                }
            }
        },
        sync: function (action, model, callbacks) {
            var self = this;

            // action is one of 'update', 'create', 'delete' or 'read'
            if (action === 'delete') {
                action = 'destroy';
            }
            if ((action === 'update' || action === 'create')) {
                this.validate(this.toJSON());
                if (!this.isValid()) {
                    return $.Deferred().reject({error: gt('Invalid data')});
                }
            }
            return this.factory.internal[action].call(this.factory.internal, model)
                .done(function (response) {
                    callbacks.success(model, response);
                })
                .fail(function (response) {
                    callbacks.error(model, response);
                    self.trigger('backendError', response);
                });
        },

        changedSinceLoading: function () {
            var self = this;

            var oldAttributes = this.realm.internal.cachedServerAttributes(this.id) || {};
            var currentAttributes = this.attributes;
            var keys = {};

            // Collect keys set
            _(oldAttributes).chain().keys().each(function (key) {
                keys[key] = 1;
            });

            _(currentAttributes).chain().keys().each(function (key) {
                keys[key] = 1;
            });

            var retval = {};

            _(keys).chain().keys().each(function (key) {

                var o = oldAttributes[key];
                var c = currentAttributes[key];

                if (o !== c) {
                    if (_.isArray(o) && _.isArray(c)) {
                        if (_(o).difference(c).length !== 0 || _(c).difference(o).length !== 0) {
                            retval[key] = c;
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

        isSet: function () {
            var self = this;
            return _(arguments).all(function (attribute) {
                return self.has(attribute) && self.get(attribute) !== '';
            });
        },

        isAnySet: function () {
            var self = this;
            return _(arguments).any(function (attribute) {
                return self.has(attribute) && self.get(attribute) !== '';
            });
        },
        getCompositeId: function () {
            return "id.folder : " + (this.get('id') || 'new-object') + '.' + (this.get('folder') || this.get('folder_id'));
        },
        isValid: function () {
            return this._valid;
        },
        hasValidAttributes: function () {
            var self = this;
            return _(arguments).all(function (attr) {
                return self.attributeValidity[attr];
            });
        },
        invalidAttributes: function () {
            var self = this;
            return _(this.attributeValidity).chain().keys().filter(function (attr) {
                return !self.attributeValidity[attr];
            }).values()._wrapped;
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


        this.get = function () {
            var args = $.makeArray(arguments);
            var uid = factory.internal.toUniqueIdFromGet.apply(factory, args);
            if (models[uid]) {
                return $.Deferred().resolve(models[uid]);
            }

            var def = $.Deferred();

            factory.internal.load.apply(factory.internal, args).done(function (data) {
                data._realm = self;

                var loaded = factory.create(data);
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
            var def = $.Deferred();
            var uidIdList = factory.internal.componentizeList.apply(factory.internal, $.makeArray(arguments));
            var idsToLoad = [];

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
                        model.unset(name, {silent: true});
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
                console.log("MARK DESTROYED");
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
            if (refCount === 0) {
                this.destroy();
            }
        };

        factory.point('realm').invoke('extend', this);

    }

    function ModelFactory(delegate) {
        this.internal = {};

        var self = this;

        var realms = {};

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
                return self.point("collection/sync").invoke("sync", this, $.makeArray(arguments));
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

            return self.api.get.apply(self.api, args).pipe(processLoaded);
        };

        this.internal.loadAll = delegate.loadAll || function () {
            return self.api.getAll.apply(self.api, $.makeArray(arguments));
        };

        this.internal.loadBulk = delegate.loadBulk || function (idsToLoad) {
            return self.api.getList(idsToLoad).pipe(function (result) {
                _(result).each(processLoaded);
                return result;
            });
        };

        this.internal.create = delegate.create || function (model) {
            return self.api.create(model.toJSON());
        };

        this.internal.read = delegate.read || function (model) {
            return self.api.get({id: model.get('id'), folder: model.get('folder') || model.get('folder_id')}).done(function (data) {
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
                if (!attributesToSave.folder) {
                    attributesToSave.folder = model.get('folder') || model.get('folder_id');
                }
            }

            return self.api.update(attributesToSave);
        };

        this.internal.destroy = delegate.destroy || function (model) {
            return self.api.remove({id: model.id, folder: model.get('folder_id') || model.get('folder')});
        };

        this.internal.toUniqueId = delegate.toUniqueId || function (options) {
            return options.id;
        };

        this.internal.toUniqueIdFromGet = delegate.toUniqueIdFromGet || this.internal.toUniqueId;
        this.internal.toUniqueIdFromObject = delegate.toUniqueIdFromObject || this.internal.toUniqueId;

        this.internal.eventToGetArguments = delegate.eventToGetArguments || function (evt, obj) {
            return [{id: obj.id, folder: obj.folder || obj.folder_id}];
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
            this.ref = this.ref + "/";
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
                console.log("Caught event", eventName);
                var args = self.internal.eventToGetArguments.apply(self, $.makeArray(arguments)),
                    uid = self.internal.toUniqueIdFromGet.apply(self, args);

                self.api.get.apply(self.api, args).done(function (loaded) {
                    _(realms).each(function (realm) {
                        console.log(realm, uid, loaded);
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
        this.point("validation").extend({
            id: 'generic',
            validate: function (attributes, errors) {
                _(attributes).each(function (value, key) {
                    var analysisisis = self.point('validation/' + key).invoke('validate', errors, value, errors, attributes, key).value(); // What's the plural of analysis again?
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
