/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/core/extensions",
    ["io.ox/core/event", "io.ox/core/collection"], function (Events, Collection) {

    // A naive extension registry.
    "use strict";

    // global registry
    var registry = {},

        // module
        that,

        // sort by index
        pointSorter = function (a, b) {
            return (a.index || 1000000000) - (b.index || 1000000000);
        },

        // for debugging purposes
        randomSorter = function () {
            return Math.random() > 0.5 ? -1 : +1;
        },

        // function wrappers
        wrappers = {};

    // never leak
    $(window).on("unload", function () {
        _(registry).each(function (ext) {
            ext.clear();
        });
        registry = null;
    });

    var Point = function (options) {

        this.id = String(options.id);
        this.description = options.description || "";

        var extensions = [],
            replacements = {},
            disabled = {},
            // get enabled extensions
            list = function () {
                return _.chain(extensions)
                    .select(function (obj) {
                        return !disabled[obj.id];
                    });
            },
            // look for existing extension
            has = function (id) {
                return _(extensions)
                    .select(function (o) {
                        return o.id === id;
                    })
                    .length > 0;
            },
            self = this;

        Events.extend(this);

        function createInvoke(point, ext) {
            return function (name, context) {
                // get variable set of arguments
                var args = $.makeArray(arguments).slice(2),
                    fn = ext[name];
                if (fn) {
                    // wrap
                    if (wrappers[name]) {
                        return wrappers[name].call(context, {
                            args: args,
                            extension: ext,
                            original: function () {
                                return fn.apply(context, args);
                            },
                            id: point.id + "/" + ext.id,
                            module: that,
                            point: point
                        });
                    } else {
                        return fn.apply(context, args);
                    }
                }
            };
        }

        this.extend = function (extension) {

            if (extension.invoke) {
                throw "Extensions must not have their own invoke method";
            }
            if (!extension.id) {
                throw "Extensions must have an id!";
            }

            // skip duplicates (= same id)
            if (!has(extension.id)) {

                extension.invoke = createInvoke(this, extension);

                if (replacements[extension.id]) {
                    _.extend(extension, replacements[extension.id]);
                    delete replacements[extension.id];
                }

                extensions.push(extension);
                extensions.sort(pointSorter);

                this.trigger("extended", extension);
            }

            return this;
        };

        this.replace = function (extension) {

            if (!extension.id) {
                throw "Replacements must have an id!";
            }

            var replaced = false;

            _(extensions).map(function (e) {
                if (e.id === extension.id) {
                    _.extend(e, extension);
                    replaced = true;
                }
            });

            if (replaced) {
                extensions.sort(pointSorter);
            } else {
                replacements[extension.id] = extension;
            }

            return this;
        };

        this.clear = function () {
            extensions = [];
        };

        this.all = function () {
            return extensions;
        };

        this.keys = function () {
            return _(extensions).map(function (obj) {
                    return obj.id;
                });
        };

        // public for testing purposes
        this.sort = function () {
            extensions.sort(pointSorter);
            return this;
        };

        this.chain = function () {
            return list();
        };

        this.each = function (cb) {
            list().each(cb);
            return this;
        };

        this.map = function (cb) {
            return list().map(cb);
        };

        this.select = function (cb) {
            return list().select(cb).value();
        };

        this.inject = function (cb, memo) {
            return list().inject(cb, memo).value();
        };

        this.invoke = function (name, context) {
            var o = list(),
                args = ["invoke"].concat($.makeArray(arguments));
            return o.invoke.apply(o, args);
        };

        this.disable = function (id) {
            disabled[id] = true;
            return this;
        };

        this.enable = function (id) {
            delete disabled[id];
            return this;
        };

        this.isEnabled = function (id) {
            return !!disabled[id];
        };
    };

    // common extension classes
    // TODO: find a better place as it contains UI stuff

    var Link = function (options) {

        _.extend(this, options);

        var self = this,
            click = function (e) {
                var node = $(this);
                e.preventDefault();
                // TODO: don't know if using self for context makes sense
                that.point(node.data("ref")).invoke("action", self, node.data("context"));
            };

        this.draw = function (context) {
            this.append(
                $("<a>", { href: "#", tabindex: "1", "data-action": self.id })
                .addClass('io-ox-action-link' + (options.attention === true ? ' attention': ''))
                .data({ ref: self.ref, context: context })
                .click(click)
                .text(String(self.label))
            );
        };
    };

    var applyCollection = function (self, collection, node, context) {
        // resolve collection's properties
        collection.getProperties()
            .done(function () {
                // get links (check for requirements)
                var links = that.point(self.ref).select(function (link) {
                    // process actions
                    return that.point(link.ref).inject(function (flag, action) {
                        if (_.isFunction(action.requires)) {
                            // check requirements
                            return flag && action.requires({ collection: collection, context: context });
                        } else {
                            return flag;
                        }
                    }, true);
                });
                // empty?
                if (links.length === 0) {
                    node.addClass("empty");
                } else {
                    // draw links
                    _(links).each(function (link) {
                        if (_.isFunction(link.draw)) {
                            link.draw.call(node, context);
                            if (_.isFunction(link.customize)) {
                                link.customize.call(node.find('a'), context);
                            }
                        }
                    });
                }
            });
    };

    var ToolbarLinks = function (options) {
        var self = _.extend(this, options);
        this.draw = function (context) {
            // paint on current node
            applyCollection(self, new Collection(context), this, context);
        };
    };

    var InlineLinks = function (options) {
        var self = _.extend(this, options);
        this.draw = function (context) {
            // create & add node first, since the rest is async
            var node = $("<div>").addClass("io-ox-inline-links").appendTo(this);
            applyCollection(self, new Collection(context), node, context);
        };
    };

    that = {

        // get point
        point: function (id) {
            id = id || "";
            if (registry[id] !== undefined) {
                return registry[id];
            } else {
                return (registry[id] = new Point({ id: id }));
            }
        },

        // get all ids
        keys: function () {
            return _.keys(registry);
        },

        getPlugins: function (options) {
            // get options
            var o = _.extend({
                    name: ox.signin ? 'signin' : 'core',
                    prefix: 'plugins/',
                    suffix: 'register'
                }, options),
                // all plugins
                plugins = ox.serverConfig.plugins || {};
            // transform to proper URLs
            return _(plugins[o.name] || []).map(function (i) {
                    return o.prefix + i + '/' + o.suffix;
                });
        },

        // plugin loader
        loadPlugins: function (options) {
            // require plugins
            return require(this.getPlugins(options));
        },

        // add wrapper
        addWrapper: function (name, fn) {
            wrappers[name] = fn;
        },

        Link: Link,
        InlineLinks: InlineLinks,
        ToolbarLinks: ToolbarLinks
    };

    return that;
});

/*

Examples
--------

// Disable participants
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail").disable("participants");

// Disable date
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail").disable("date");

// Extend "draw" function (to introduce "customize")
var ext = require("io.ox/core/extensions");
ext.addWrapper("draw", function (e) {
    e.original();
    ext.point(e.id).invoke("customize", this, e.args);
});

// use new "customize" function
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail/date/time").extend({
    customize: function () {
        this.css("background", "#fc0");
    }
});

// Replace existing extension
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail").replace({
    id: "title",
    draw: function () {
        this.append(
            $("<div>").addClass("title").text("Hello World!")
        );
    }
});

// Shuffle extension order
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail").each(function (e) {
    e.index = Math.random() * 1000 >> 0;
}).sort();

*/
