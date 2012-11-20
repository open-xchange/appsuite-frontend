/**
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
    ["io.ox/core/event", "io.ox/core/async"], function (Events, async) {

    // A naive extension registry.
    "use strict";

    // global registry
    var registry = {},

        // module
        that,

        // sort by index
        pointSorter = function (a, b) {
            return a.index - b.index;
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

        this.has = has;

        this.extend = function (extension) {

            if (extension.invoke) {
                console.error(extension);
                throw "Extensions must not have their own invoke method";
            }

            if (!extension.id) {
                extensions.id = 'default';
                extension.index = extension.index || 100;
            } else {
                extension.index = extension.index || 1000000000;
            }

            // Used for seamless scrolling
            extension.isLoadingMoreResults = false;
            extension.timer = 0;

            extension.finishLoadingMoreResults = function (busyIndicator) {
                extension.isLoadingMoreResults = false;
                if (busyIndicator) {
                    busyIndicator.removeClass('io-ox-busy');
                }
            };

            // skip duplicates (= same id)
            if (!has(extension.id)) {

                extension.invoke = createInvoke(this, extension);

                if (replacements[extension.id]) {
                    _.extend(extension, replacements[extension.id]);
                    delete replacements[extension.id];
                }

                extensions.push(extension);
                extensions.sort(pointSorter);

                if (!extension.metadata) {
                    extension.metadata = function (name, args) {
                        if (this[name]) {
                            if (_.isFunction(this[name])) {
                                return this[name].apply(this, args);
                            }
                            return this[name];
                        }
                        return undefined;
                    };
                }

                if (!extension.asyncMetadata) {
                    extension.asyncMetadata = function (name, args) {
                        return async.defer(extension.metadata(name, args));
                    };
                }

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

        this.get = function (id, callback) {
            var extension = _(extensions).chain()
                .filter(function (obj) { return obj.id === id; }).first().value();
            if (extension) {
                callback(extension);
                extensions.sort(pointSorter);
            }
            return this;
        };

        this.keys = function () {
            return _(extensions).pluck('id');
        };

        // public for testing purposes
        this.sort = function () {
            extensions.sort(pointSorter);
            return this;
        };

        this.list = function () {
            return list().value();
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
            return !disabled[id];
        };

        this.inspect = function () {
            console.debug('Extension point', this.id, JSON.stringify(this.all()));
        };

        this.count = function () {
            return list().value().length;
        };

        function randomSort() { return Math.round(Math.random()) - 0.5; }

        this.shuffle = function () {
            extensions.sort(randomSort);
            _(extensions).each(function (ext, index) {
                ext.index = 100 + 100 * index;
            });
            return this;
        };

        this.options = function (defaults) {
            var options = defaults || {};
            this.each(function (obj) {
                options = _.extend(options, obj);
            });
            return options;
        };
    };

    /*
     * Baton class
     * (returnFalse/returnTrue trick adopted from jQuery event object)
     */
    function returnFalse() { return false; }
    function returnTrue() { return true; }

    function Baton(obj) {
        // bypass?
        if (obj instanceof Baton) return obj;
        // called via new?
        if (this instanceof Baton) {
            // to be safe
            this.data = {};
            this.$ = {};
            // just copy given object
            _.extend(this, obj);
        } else {
            // for the lazy way: b = Baton() instead of b = new Baton()
            return new Baton(obj);
        }
    }

    Baton.ensure = function (obj) {
        if (obj instanceof Baton) return obj;
        if ('data' in obj) return new Baton(obj);
        return new Baton({ data: obj });
    };

    Baton.prototype = {

        isDefaultPrevented: returnFalse,

        preventDefault: function () {
            this.isDefaultPrevented = returnTrue;
        }
    };

    Baton.wrap = function (object) {
        return object instanceof Baton ? object : new Baton(object);
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
                    suffix: 'register',
                    nameOnly : false
                }, options),
                // all plugins
                plugins = ox.serverConfig.plugins || {};
            // transform to proper URLs
            return _(plugins[o.name] || []).map(function (i) {
                    return o.nameOnly ? i : o.prefix + i + '/' + o.suffix;
                });
        },

        // plugin loader
        loadPlugins: function (options) {
            // require plugins
            return require(this.getPlugins(options)).fail(function (e) {
                console.error(e);
            });
        },

        // add wrapper
        addWrapper: function (name, fn) {
            wrappers[name] = fn;
        },

        Baton: Baton
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
