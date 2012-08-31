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
define('io.ox/backbone/views', ['io.ox/core/extensions'], function (ext) {
    "use strict";
    
    
    
    function ViewExtensionPoint(name) {
        
        this.extend = function (options, extOptions) {
            
            // A few overridable default implementations
            options.initialize = options.initialize || function () {
                var self = this;
                
                
                function registerDisposableHandler(evt, handler) {
                    self.model.on(evt, handler);
                    self.$el.on('dispose', function () {
                        self.model.off(evt, handler);
                    });
                }
                
                if (this.update) {
                    registerDisposableHandler('change', function () {
                        self.update();
                    });
                }
                
                if (this.validationError) {
                    registerDisposableHandler('invalid', function () {
                        self.validationError();
                    });
                }
                
                if (options.modelEvents) {
                    _(options.modelEvents).each(function (methodNames, evt) {
                        _(methodNames.split(" ")).each(function (methodName) {
                            registerDisposableHandler(evt, function () {
                                self[methodName].apply(self, $.makeArray(arguments));
                            });
                        });
                    });
                }
                
                if (options.init) {
                    options.init.apply(this, $.makeArray(arguments));
                }
            };
            
            options.close = options.close || function () {
                this.$el.remove();
                this.$el.trigger('dispose'); // Can't hurt
            };
            
            var ViewClass = Backbone.View.extend(options);
            
            extOptions = extOptions || {};
            
            ext.point(name).extend(_.extend({}, {
                id: options.id,
                index: options.index,
                draw: function (options) {
                    var view = new ViewClass(options);
                    view.render();
                    this.append(view.$el);
                }
            }, extOptions));
            
            return this;
        };
        
        this.createView = function (options) {
            options.render = options.render || function () {
                this.point.invoke.apply(this.point, ['draw', this.$el].concat(this.extensionOptions ? this.extensionOptions() : [{model: this.model}]));
                return this;
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
        
    
    return {
        
        point: function (name) {
            return new ViewExtensionPoint(name);
        },
        
        BasicView: BasicView
        
    };

});