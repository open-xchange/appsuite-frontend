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
define('io.ox/backbone/views', ['io.ox/core/extensions', 'io.ox/core/event'], function (ext, Events) {
    "use strict";

    var views;


    function ViewExtensionPoint(name) {

        this.basicExtend = function (extension) {
            ext.point(name).extend(extension);
            return this;
        };

        this.extend = function (options, extOptions) {            
            var id = options.id;
            delete options.id;
            
            
            // A few overridable default implementations
            options.initialize = options.initialize || function () {
                var self = this;
                if (this.update) {
                    self.observeModel('change', function () {
                        self.update();
                    });
                }

                if (this.validationError) {
                    self.observeModel('invalid', function () {
                        self.validationError();
                    });
                }

                if (options.modelEvents) {
                    _(options.modelEvents).each(function (methodNames, evt) {
                        _(methodNames.split(" ")).each(function (methodName) {
                            self.observeModel(evt, function () {
                                self[methodName].apply(self, $.makeArray(arguments));
                            });
                        });
                    });
                }
                this.$el.attr({
                    'data-extension-id': extOptions.id || id,
                    'data-extension-point': name,
                    'data-composite-id': this.model.getCompositeId()
                });
                if (options.init) {
                    options.init.apply(this, $.makeArray(arguments));
                }

                if (options.customizeNode) {
                    this.customizeNode();
                }
            };

            options.close = options.close || function () {
                this.$el.remove();
                this.$el.trigger('dispose'); // Can't hurt
            };

            options.observeModel = options.observeModel || function (evt, handler) {
                var self = this;
                this.model.on(evt, handler);
                this.$el.on('dispose', function () {
                    self.model.off(evt, handler);
                });
            };

            var ViewClass = Backbone.View.extend(options);

            extOptions = extOptions || {};

            this.basicExtend(_.extend({}, {
                id: id,
                index: options.index,
                draw: function (options) {
                    var view = new ViewClass(options);
                    view.render();
                    this.append(view.$el);
                }
            }, extOptions));

            return this;
        };

        this.createSubpoint = function (subpath, options, extOptions) {
            var point = views.point(name + "/" + subpath),
                ViewClass = point.createView(options);
            var id = options.id || name + "/" + subpath;
            
            if (options.id) {
                delete options.id;
            }
            extOptions = extOptions || {};
            this.basicExtend(_.extend({}, {
                id: id,
                index: options.index,
                draw: function (options) {
                    var view = new ViewClass(options);
                    view.render();
                    this.append(view.$el);
                }
            }, extOptions));

            return point;

        };

        this.createView = function (options) {
            var id = options.id;
            delete options.id;
            
            options.render = options.render || function () {
                this.point.invoke.apply(this.point, ['draw', this.$el].concat(this.extensionOptions ? this.extensionOptions() : [{model: this.model, parentView: this}]));
                return this;
            };

            options.initialize = options.initialize || function () {
                Events.extend(this);
                if (this.init) {
                    this.init.apply(this, $.makeArray(arguments));
                }
                var self = this;
                function redraw() {
                    self.$el.empty();
                    self.render();
                }
                this.point.on("extended", redraw);
                self.$el.on('dispose', function () {
                    self.point.off('extended', redraw);
                });
            };

            options.point = options.point || ext.point(name);

            return Backbone.View.extend(options);
        };


    }


    function BasicView(options) {
        _.extend(this, options);

        this.update = this.update || function () {
            this.$el.empty();
            this.render();
        };
    }

    function AttributeView(options) {
        _.extend(this, {

            render: function () {
                var self = this;

                _([this.attribute]).chain().flatten().each(function (attribute) {
                    var value = self.model.get(attribute);
                    if (self.transform && self.transform[attribute]) {
                        value = self.transform[attribute](value);
                    } else if (self.transform) {
                        value = self.transform(value);
                    }

                    if (self.model.isSet(attribute)) {
                        self.$el.append($.txt(value));
                    } else if (self.initialValue) {
                        self.$el.append($.txt(self.initialValue));
                    }
                });

            },

            updateNode: function () {
                this.$el.empty();
                this.render();
            }

        });

        var self = this;
        this.modelEvents = {};

        _([options.attribute]).chain().flatten().each(function (attribute) {
            self.modelEvents['change:' + attribute] = 'updateNode';
        });

        _.extend(this, options);
    }

    views = {

        point: function (name) {
            return new ViewExtensionPoint(name);
        },

        BasicView: BasicView,
        AttributeView: AttributeView,

        ext: ext

    };

    return views;

});