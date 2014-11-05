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
define('io.ox/backbone/basicModel',
    ['io.ox/core/extensions',
     'gettext!io.ox/core'
    ], function (ext, gt) {

    'use strict';

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

            this.on('change:id', function () {
                self.id = self.get('id');
            });

            if (this.init) {
                this.init();
            }

            // model might already have a prop or function 'url'
            this.url = this.url || 'invalidURL';
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
            this.point('validation').invoke('validate', errors, attributes, errors, this);
            if (options.isSave) {
                this.point('validation/save').invoke('validate', errors, attributes, errors, this);
            }
            if (errors.hasErrors()) {
                var validAttributes = {};
                _(attributes).chain().keys().each(function (key) {
                    validAttributes[key] = true;
                });
                errors.each(function (messages, attribute) {
                    validAttributes[attribute] = false;
                    self.trigger('invalid:' + attribute, messages, errors, self);
                });
                // Trigger a valid:attribute event for all attributes that have turned valid
                _(self.attributeValidity).each(function (wasValid, attribute) {
                    if (!wasValid && validAttributes[attribute]) {
                        self.trigger('valid:' + attribute, self);
                    }
                });

                self.attributeValidity = validAttributes;
                self.trigger('invalid', errors, self);
                self.errors = errors;
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
        parse: function () {
            return {};
        },
        sync: function (action, model, callbacks) {

            var self = this;

            // action is one of 'update', 'create', 'delete' or 'read'
            if (action === 'delete') {
                action = 'destroy';
            }
            if ((action === 'update' || action === 'create')) {
                // isValid actually calls the validate function, no need to do this manually
                if (!this.isValid({isSave: true})) {
                    return $.Deferred().reject({error: gt('Invalid data'), model: this});
                }
            }
            if (this.syncer) {
                this.trigger(action + ':start');
                this.trigger('sync:start');

                return this.syncer[action](model)
                    .done(function (response) {
                        callbacks.success(model, response);
                        self.trigger(action, response);
                        self.trigger('sync', response);
                    })
                    .fail(function (response, xhr) {
                        if (xhr && (xhr.status === 404 || xhr.status === 0)) {
                            response.error = gt('Server unreachable');
                        }
                        callbacks.error(model, response);
                        self.trigger('backendError', response, xhr);
                        self.trigger(action + ':fail', response);
                        self.trigger('sync:fail', response);
                    }).always(function () {
                        self.trigger(action + ':always');
                        self.trigger('sync:always');
                    });
            } else {
                throw 'No Syncer specified!';
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
        isValid: function (options) {
            this.validate(this.toJSON(), null, options);
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
