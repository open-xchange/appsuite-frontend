/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/backbone/views', ['io.ox/core/extensions', 'io.ox/core/event'], function (ext, Events) {

    'use strict';

    var views;

    function createViewClass(options, extOptions) {
        extOptions = extOptions || {};
        var id = options.id;
        delete options.id;

        // A few overridable default implementations
        options.initialize = options.initialize || function (o) {
            this.options = o;
            if (this.update) {
                this.listenTo(this.model, 'change', this.update);
            }

            this.$el.attr({
                'data-extension-id': extOptions.id || id,
                'data-extension-point': options.ref || '',
                'data-composite-id': (this.model && this.model.getCompositeId) ? this.model.getCompositeId() : null
            });

            this.baton = ext.Baton(this.options);

            if (options.init) {
                options.init.apply(this, $.makeArray(arguments));
            }

            if (options.customizeNode) {
                this.customizeNode();
            }
        };

        options.close = options.close || function () {
            this.$el.remove();
            // Can't hurt
            this.$el.trigger('dispose');
        };

        var ViewClass = Backbone.View.extend(options);

        ViewClass.extId = id;

        return ViewClass;
    }

    function buildExtension(ViewClass, options, extOptions) {
        extOptions = extOptions || {};

        return _.extend({}, {
            id: ViewClass.extId,
            index: options.index,
            draw: function (baton) {
                var view = new ViewClass(baton);
                if (options.registerAs) {
                    baton[options.registerAs] = view;
                }
                view.render();
                this.append(view.$el);
            }
        }, extOptions);
    }

    function ViewExtensionPoint(name) {

        this.basicExtend = function (extension) {
            ext.point(name).extend(extension);
            return this;
        };

        this.extend = function (options, extOptions) {
            var ViewClass = createViewClass(_.extend({}, options, { ref: name }), extOptions);
            return this.basicExtend(buildExtension(ViewClass, options, extOptions));
        };

        this.createView = function (options) {
            options = options || {};

            delete options.id;

            options.render = options.render || function () {
                this.point.invoke.apply(this.point, ['draw', this.$el].concat(this.extensionOptions ? this.extensionOptions() : [this.baton]));
                return this;
            };

            options.initialize = options.initialize || function (o) {
                Events.extend(this);
                this.options = o;
                this.baton = ext.Baton(_.extend({}, this.options, { parentView: this }));
                if (this.init) {
                    this.init.apply(this, $.makeArray(arguments));
                }
                var self = this;
                function redraw() {
                    self.$el.empty();
                    self.render();
                }
                this.point.on('extended', redraw);
                self.$el.on('dispose', function () {
                    self.point.off('extended', redraw);
                });
            };

            options.point = options.point || ext.point(name);

            return Backbone.View.extend(options);
        };
    }

    views = {
        point: function (name) {
            return new ViewExtensionPoint(name);
        }
    };

    return views;

});
