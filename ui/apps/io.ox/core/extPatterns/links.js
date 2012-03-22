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
    ["io.ox/core/extensions", "io.ox/core/collection", "io.ox/core/extPatterns/actions"], function (ext, Collection, actions) {

    "use strict";

    // common extension classes

    var Action = actions.Action;
        
    var Link = function (options) {

        _.extend(this, options);

        var self = this,
            click = function (e) {
                e.preventDefault();
                var node = $(this),
                    context = node.data("context"),
                    ref = node.data("ref");
                actions.invoke(ref, self, context);
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
                e.preventDefault();
                var node = $(this),
                    context = node.data("context"),
                    ref = node.data("ref");
                actions.invoke(ref, self, context);
            };

        this.draw = function (context) {
            
            this.append(
                $("<button>", { "data-action": self.id, tabIndex: self.tabIndex || '' })
                .addClass(self.cssClasses || 'btn')
                .data({ ref: self.ref, context: context })
                .click(click)
                .text(String(self.label))
            ).append("&nbsp;");
        };
    };


    var applyCollection = function (self, collection, node, context, args, bootstrapMode) {
        actions.extPatterns.applyCollection(self, collection, context, args).always(function (links) {
            // count resolved links
            var count = 0;
            // draw links
            _(links).each(function (def) {
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
