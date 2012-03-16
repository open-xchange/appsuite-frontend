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

define("io.ox/core/extPatterns/links",
    ["io.ox/core/extensions", "io.ox/core/collection"], function (ext, Collection) {

    "use strict";

    // common extension classes

    var requires = function (str) {
        return function (e) {
            return e.collection.has.apply(e.collection, str.split(/ /));
        };
    };

    var requiresOne = function (e) {
        return e.collection.has('one');
    };

    var Action = function (id, options) {
        // get options - use 'requires one' as default
        var o = _.extend({ requires: requiresOne }, options);
        // string?
        if (_.isString(o.requires)) {
            o.requires = requires(o.requires);
        }
        // extend point
        ext.point(id).extend(o);
    };

    var Link = function (options) {

        _.extend(this, options);

        var self = this,
            click = function (e) {
                e.preventDefault();
                var node = $(this),
                    context = node.data("context"),
                    p = ext.point(node.data("ref"));
                // general handler
                p.invoke('action', self, context);
                // handler for multi selection - always provides an array
                p.invoke('multiple', self, _.isArray(context) ? context : [context]);
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
    
    var Button = function (options) {

        _.extend(this, options);

        var self = this,
            click = function (e) {
                var node = $(this);
                e.preventDefault();
                // TODO: don't know if using self for context makes sense
                ext.point(node.data("ref")).invoke("action", self, node.data("context"));
            };

        this.draw = function (context) {
            this.append(
                $("<button>", { "data-action": self.id })
                .addClass(self.cssClasses || 'btn')
                .data({ ref: self.ref, context: context })
                .click(click)
                .text(String(self.label))
            ).append("&nbsp;");
        };
    };
    

    var applyCollection = function (self, collection, node, context, args, bootstrapMode) {
        // resolve collection's properties
        collection.getProperties()
            .done(function () {
                // get links (check for requirements)
                var links = ext.point(self.ref).map(function (link) {
                    // defer decision
                    var def = $.Deferred();
                    // process actions
                    if (link.isEnabled && !link.isEnabled.apply(link, args)) {
                        return def.reject();
                    }
                    // combine actions
                    $.when.apply($,
                        ext.point(link.ref).map(function (action) {
                            // get return value
                            var ret = _.isFunction(action.requires) ?
                                    action.requires({ collection: collection, context: context }) : true;
                            // is not deferred?
                            if (!ret.promise) {
                                ret = $.Deferred().resolve(ret);
                            }
                            return ret;
                        })
                        .value()
                    )
                    .done(function () {
                        var reduced = _(arguments).reduce(function (memo, action) {
                            return memo && action === true;
                        }, true);
                        if (reduced) {
                            def.resolve(link);
                        } else {
                            def.reject(link);
                        }
                    });
                    return def;
                });
                // wait for all links
                $.when.apply($, links.value()).always(function () {
                    // count resolved links
                    var count = 0;
                    // draw links
                    _(links.value()).each(function (def) {
                        def.done(function (link) {
                            if (_.isFunction(link.draw)) {
                                link.draw.call(bootstrapMode ? $("<li>").appendTo(node) : node, context);
                                if (_.isFunction(link.customize)) {
                                    link.customize.call(node.find('a'), context);
                                }
                                count++;
                            }
                        });
                    });
                    // empty?
                    if (count === 0) {
                        node.addClass("empty");
                    }
                });
            });
    };

    var ToolbarLinks = function (options) {
        var self = _.extend(this, options);
        this.draw = function (context) {
            // paint on current node
            var args = $.makeArray(arguments);
            applyCollection(self, new Collection(context), this, context, args);
        };
    };

    var InlineLinks = function (options) {
        var self = _.extend(this, options);
        this.draw = function (context) {
            // create & add node first, since the rest is async
            var args = $.makeArray(arguments),
                node = $("<div>").addClass("io-ox-inline-links").appendTo(this);
            applyCollection(self, new Collection(context), node, context, args);
        };
    };

    var DropdownLinks = function (options) {
        var self = _.extend(this, options);
        this.draw = function () {
            var args = $.makeArray(arguments),
                context = args[0],
                $parent = $("<div>").addClass("dropdown").appendTo(this),
                $toggle = $("<a>", {href: '#'}).text(options.label + " ").append($("<b>").addClass("caret")).appendTo($parent);

            // create & add node first, since the rest is async
            var node = $("<ul>").addClass("dropdown-menu").appendTo($parent);
            applyCollection(self, new Collection(context), node, context, args, true);

            $toggle.dropdown();
            $toggle.on("click", function () {
                $toggle.dropdown('toggle');
            });
        };
    };

    return {
        Action: Action,
        Link: Link,
        Button: Button,
        ToolbarLinks: ToolbarLinks,
        InlineLinks: InlineLinks,
        DropdownLinks: DropdownLinks
    };
});
