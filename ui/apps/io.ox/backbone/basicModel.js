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
define("io.ox/backbone/basicModel", [ "io.ox/core/extensions", 'gettext!io.ox/core'], function (ext, gt) {
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
    
    var BasicModel = Backbone.Model.extend({
        initialize: function (obj) {
            var self = this;
            this._valid = true;
            this.attributeValidity = {};
            this.id = obj.id;

            this.on("change:id", function () {
                self.id = self.get("id");
            });

            if (this.init) {
                this.init();
            }

        },
        point: function (subpath) {
            if (/^\//.test(subpath)) {
                subpath = subpath.substring(1);
            }
            return ext.point(this.ref + subpath);
        },
        validate: function (attributes, evt, options) {
            options = options || {};
            var self = this,
                errors = new ValidationErrors();

            attributes = attributes || this.toJSON();

            this.point("validation").invoke("validate", errors, attributes, errors, this);

            if (options.isSave) {
                this.point("validation/save").invoke("validate", errors, attributes, errors, this);
            }
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
                this.validate(this.toJSON(), null, {
                    isSave: true
                });
                if (!this.isValid()) {
                    return $.Deferred().reject({error: gt('Invalid data')});
                }
            }
            if (this.syncer) {
                this.trigger(action + ':start');
                this.trigger('sync:start');
                
                return this.syncer[action].call(this.syncer, model)
                    .done(function (response) {
                        callbacks.success(model, response);
                        self.trigger(action, response);
                        self.trigger('sync', response);
                    })
                    .fail(function (response) {
                        callbacks.error(model, response);
                        self.trigger('backendError', response);
                        self.trigger(action + ':fail', response);
                        self.trigger('sync:fail', response);
                    });
            } else {
                throw "No Syncer specified!";
            }
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
    
    return BasicModel;
    
});