/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/dev/utils/live-coding-extension', ['io.ox/backbone/views'], function (views) {

    'use strict';

    function LiveCodingExtension(options) {
        var self = this;

        this.tick = function () {
            if (self.pending) {
                return;
            }
            self.pending = true;
            $.ajax(options.url, {
                dataType: 'text',
                ifModified: true // E-Tag and LastModified Magic
            }).done(function (code) {
                if (code) {
                    try {
                        self.delegate = new Function(code)();
                        if (self.transformDelegate) {
                            self.delegate = self.transformDelegate(self.delegate);
                        }
                        self.redrawDelegate();
                    } catch (e) {
                        self.pending = false;
                        throw e;
                    }
                }
            }).always(function () {
                self.pending = false;
            });
        };

        this.draw = function () {
            self.node = $('<div>');
            self.args = $.makeArray(arguments);

            this.append(self.node);
            self.redrawDelegate();
        };

        this.redrawDelegate = function () {
            if (self.node && self.args && self.delegate) {
                self.node.fadeOut(function () {
                    self.node.empty();
                    self.delegate.draw.apply(self.node, self.args);
                    self.node.fadeIn(function () {
                        if (self.delegate.afterUpdate) {
                            self.delegate.afterUpdate.apply(self.node, self.args);
                        }
                    });
                });
            }
        };

        _.extend(this, options);

        setInterval(this.tick, options.inteval || 1000);
    }

    function LiveCodingView(options) {
        if (!options.transformDelegate) {
            options.transformDelegate = function (delegate) {
                var ViewClass = views.createViewClass(delegate);
                return views.buildExtension(ViewClass, delegate);
            };
        }
        _.extend(this, new LiveCodingExtension(options));
    }

    return {
        Extension: LiveCodingExtension,
        View: LiveCodingView
    };

});
