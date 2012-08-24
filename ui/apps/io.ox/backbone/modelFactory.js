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
define("io.ox/backbone/modelFactory", ["io.ox/core/extensions"], function (ext) {
    "use strict";
    
    
    function ValidationErrors() {
        var errors = {};
        
        this.add = function (attribute, error) {
            (errors[attribute] || (errors[attribute] = [])).push(error);
            return this;
        };
        
        this.hasErrors = function () {
            return _.isEmpty(errors);
        };
        
        this.each = function () {
            var wrapped = _(errors);
            return wrapped.each.apply(wrapped, $.makeArray(arguments));
        };
    }
    
    var OXModel = Backbone.Model.extend({
        idAttribute: '_uid',
        initialize: function (obj) {
            this.factory = this.get('_factory');
            this.realm = this.get('_realm');
        },
        validate: function (attributes) {
            var self = this,
                errors = new ValidationErrors();
            
            this.factory.point("validation").invoke("validate", errors, attributes, errors);
            
            if (!_.isEmpty(errors)) {
                errors.each(function (messages, attribute) {
                    self.trigger("invalid:" + attribute, messages, errors, self);
                });
                return errors;
            }
        },
        sync: function () {
            return this.factory.point("sync").invoke("sync", this, $.makeArray(arguments));
        }
    });

    function ModelRealm(name, factory) {
        var models = {};
        
        this.get = function () {
            var args = $.makeArray(arguments);
            var uid = factory.toUniqueIdFromGet.apply(factory, args);
            if (models[uid]) {
                return $.Deferred().done(models[uid]);
            }
            
            var def = $.Deferred();
            
            factory.load.apply(factory, args).done(function (data) {
                data._realm = name;

                var loaded = factory.create(data);
                models[loaded.id] = loaded;
                def.resolve(loaded);
            });
            
            return def;
        };
        
        this.refresh = function (uid, data) {
            if (models[uid]) {
                models.set(data);
            }
        };
        
        this.markDestroyed = function (uid) {
            if (models[uid]) {
                var model = models[uid];
                delete models[uid];
                model.trigger('destroy', model);
            }
        };
        
        this.destroyRealm = function () {
            models = {};
        };
        
    }
    
    function ModelFactory(delegate) {
        _.extend(this, delegate);
        var self = this;
        
        var realms = {};
        
        this.realm = function (name) {
            if (!name) {
                return this.realm('default');
            }
            return realms[name] || (realms[name] = new ModelRealm(name, this));
        };
        
        this.model = OXModel.extend(delegate.model);
        this.collection = Backbone.Collection.extend({
            model: this.model,
            sync: function () {
                return self.point("collection/sync").invoke("sync", this, $.makeArray(arguments));
            }
        });
        
        this.load = this.load || function () {
            var args = $.makeArray(arguments);
            
            return this.api.get.apply(this.api, args).pipe(function (loaded) {
                loaded._uid = this.toUniqueIdFromGet.apply(this, args);
                loaded._factory = self;
                return loaded;
            });
        };
        
        this.toUniqueId = this.toUniqueId || function (options) {
            return options.id;
        };
        
        this.toUniqueIdFromGet = this.toUniqueIdFromGet || this.toUniqueId;
        this.toUniqueIdFromObject = this.toUniqueIdFromObject || this.toUniqueId;
        
        this.eventToGetArguments = this.eventToGetArguments || function (evt) {
            return [{id: evt.id, folder: evt.folder_id}];
        };
        if (!/\/$/.test(this.extensionNamespace)) {
            this.extensionNamespace = this.extensionNamespace + "/";
        }
        this.point = this.point || function (subpath) {
            if (/^\//.test(subpath)) {
                subpath = subpath.substring(1);
            }
            return ext.point(this.extensionNamespace + subpath);
        };
        
        this.get = this.get || function () {
            var realm = this.realm('default');
            return realm.get.apply(realm, $.makeArray(arguments));
        };
        
        this.create = this.create || function (options) {
            return new this.model(options);
        };
        
        this.createCollection = this.createCollection || function () {
            return new this.collection();
        };
        
        // catch the typical events of the api and propagate them onto cached backbone models
        
        this.updateEvents = this.updateEvents || ['update'];
        this.destroyEvents = this.destroyEvents || ['delete'];
        
        _(this.updateEvents).each(function (eventName) {
            
            this.api.on(eventName, function () {
                var args = self.eventToGetArguments.apply(self, $.makeArray(arguments)),
                    uid = self.toUniqueIdFromGet.apply(self, args);
                
                self.api.get.apply(self.api, args).done(function (loaded) {
                    _(realms).each(function (realm) {
                        realm.refresh(uid);
                    });
                });
            });
        });
        
        
        _(this.destroyEvents).each(function (eventName) {
            
            this.api.on(eventName, function () {
                var args = self.eventToGetArguments.apply(self, $.makeArray(arguments)),
                    uid = self.toUniqueIdFromGet.apply(self, args);
                
                _(realms).each(function (realm) {
                    realm.markDestroyed(uid);
                });
                
            });
        });
        
        // Register the extension that calls subextensions under the namespace + attribute name
        // For example to check the display_name attribute in the model registered in the extension namespace 'io.ox/contacts/model'
        // It would invoke 'validate' on 'io.ox/contacts/model/validation/display_name'
        ext.point("validation").extend({
            id: 'generic',
            validate: function (attributes, errors) {
                _(attributes).each(function (value, key) {
                    var analysis = ext.point(self.extensionNamespace + key).invoke('validate', errors, value, errors, attributes, key);
                    // If the extension returned a falsy value, we assume everything is correct
                    // If the value is truthy, it can be either an array or another object (typically a string)
                    // the array elements are passed as individual errors to the error collection for this attribute
                    // a different message is passed as is

                    if (analysis) {
                        if (_.isArray(analysis) && !_.isEmpty(analysis)) {
                            _(analysis).each(function (message) {
                                errors.add(key, message);
                            });
                        } else {
                            errors.add(key, analysis);
                        }
                    }
                });
            }
        });
    }
    
    return ModelFactory;
});
