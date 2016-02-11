/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
*/

/* This file should replace basicModel and modelfactory
primary used for models in edit dialogs
provides validation, dirty checks and save/update methods
*/
define('io.ox/backbone/extendedModel', [
    'io.ox/core/extensions',
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

    var ExtendedModel = Backbone.Model.extend({

        initialize: function () {

            this._valid = true;
            this.attributeValidity = {};

            // call subconstructor with arguments
            if (this.init) {
                this.init.apply(this, $.makeArray(arguments));
            }

            this.savedAttributes = this.toJSON();
        },
        changedSinceLoading: function () {
            // backbone models only track the changes since last set event
            // what we need are the changes since the last save
            var oldAttributes = this.savedAttributes || {},
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

                var oldValue = oldAttributes[key],
                    currentValue = currentAttributes[key],
                    different = false;

                if (oldValue !== currentValue) {
                    if (_.isArray(oldValue) && _.isArray(currentValue)) {
                        // test if arrays contain the same values
                        if (_(oldValue).difference(currentValue).length !== 0 || _(currentValue).difference(oldValue).length !== 0) {
                            if (oldValue.length !== currentValue.length) {
                                different = true;
                            } else {
                                // array must contain objects, otherwise the same value check would have detected a difference
                                // so check the values
                                _.each(currentValue, function (val, key) {

                                    _.each(currentValue[key], function (val2, key2) {

                                        if (oldValue[key] === undefined) {
                                            different = true;
                                        } else if (val2 !== oldValue[key][key2]) {
                                            different = true;
                                        }
                                    });

                                });
                            }

                            if (different === true) {
                                // arrays not equal
                                retval[key] = currentValue;
                            }
                        }
                    } else {
                        // not equal and not arrays
                        retval[key] = currentValue;
                    }
                }
            });

            return retval;
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
            } else if (!self._valid) {
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
        },
        sync: function (action, model) {

            var self = this;

            // action is one of 'update', 'create', 'delete' or 'read'
            if (action === 'delete') {
                action = 'destroy';
            }
            if ((action === 'update' || action === 'create')) {
                //isValid actually calls the validate function, no need to do this manually
                if (!this.isValid({ isSave: true })) {
                    var errorMessage = gt('The dialog contains invalid data'),
                        errors = this.errors.errors;

                    // if it's only one error and it has an error message we show that instead of the generic message
                    // there may be more errors for one attribute (stored in an array), we just pick the first one
                    if (_(errors).size() === 1 && _.isString(errors[_(errors).keys()[0]][0])) {
                        errorMessage = errors[_(errors).keys()[0]];
                    }
                    return $.Deferred().reject({ error: errorMessage, model: this });
                }
            }

            if ((this.syncer && this.syncer[action]) || this.api) {
                this.trigger(action + ':start');
                this.trigger('sync:start');
                var syncFunction = this.syncer && this.syncer[action] ? this.syncer[action] : defaultSyncer[action];

                return syncFunction.call(this, model)
                    .done(function (response) {
                        self.trigger(action, response);
                        self.trigger('sync', response);
                        self.savedAttributes = self.toJSON();
                    })
                    .fail(function (response, xhr) {
                        if (xhr && (xhr.status === 404 || xhr.status === 0)) {
                            response.error = gt('Server unreachable');
                        }
                        self.trigger('backendError', response, xhr);
                        self.trigger(action + ':fail', response);
                        self.trigger('sync:fail', response);
                    }).always(function () {
                        self.trigger(action + ':always');
                        self.trigger('sync:always');
                    });
            }
            throw new Error('No Syncer specified!');
        },
        isSet: function () {
            var self = this;
            return _(arguments).all(function (attribute) {
                return self.has(attribute) && self.get(attribute) !== '';
            });
        },
        isValid: function (options) {
            this.validate(this.toJSON(), null, options);
            return this._valid;
        }
    });

    var defaultSyncer = {
        create: function (model) {
            return model.api.create(model.toJSON());
        },

        update: function (model) {
            var attributesToSave = null;
            if (model.getUpdatedAttributes) {
                attributesToSave = model.getUpdatedAttributes(model);
            } else {
                attributesToSave = model.changedSinceLoading();
                attributesToSave.id = model.id;
                attributesToSave.last_modified = model.get('last_modified');
                if (!attributesToSave.folder) {
                    attributesToSave.folder = model.get('folder') || model.get('folder_id');
                }
            }
            return model.api.update(attributesToSave);
        }
    };

    return ExtendedModel;

});
