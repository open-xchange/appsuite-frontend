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
define('io.ox/backbone/view', ['io.ox/core/extensions'], function (ext) {
    "use strict";
    
    
    var extend = function (options, view) {
        var viewClass = view || Backbone.View.extend.apply(Backbone.View, options);
        
        ext.point(options.extensionPoint).extend({
            id: options.id,
            draw: function (drawOptions) {
                this.append(new viewClass(drawOptions).render().$el);
            }
        });
    };
    
    var extensibleView = function() {
            var args = $.makeArray(arguments),
                properties = args.shift();
            
            var defaultImplementation = {
                render: function () {
                    ext.point(properties.extensionPoint).invoke(this.$el, 'draw', this.model, this);
                    return this;
                }
            };
            
            _.extend(defaultImplementation, properties);
            
            args.unshift(defaultImplementation);
            
            var viewClass = Backbone.View.extend.apply(Backbone.View, args);
            
            // Make this usable as an extension
            
            viewClass.id = properties.id;
            viewClass.draw = function (model) {
                var view = new viewClass({model: model});
                this.append(view.render().$el);
            };
            
            return viewClass;
        }
    };
    
    
    
    return {
        extend: extend,
        extensibleView: extensibleView
    };

});