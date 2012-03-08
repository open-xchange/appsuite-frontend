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

    var Link = function (options) {

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
                $("<a>", { href: "#", tabindex: "1", "data-action": self.id })
                .addClass('io-ox-action-link' + (options.attention === true ? ' attention': ''))
                .data({ ref: self.ref, context: context })
                .click(click)
                .text(String(self.label))
            );
        };
    };

    var applyCollection = function (self, collection, node, context, bootstrapMode) {
        // resolve collection's properties
        collection.getProperties()
            .done(function () {
                // get links (check for requirements)
                var links = ext.point(self.ref).select(function (link) {
                    // process actions
                    return ext.point(link.ref).inject(function (flag, action) {
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
                            link.draw.call(bootstrapMode ? $("<li>").appendTo(node) : node, context);
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

    var DropdownLinks = function (options) {
        var self = _.extend(this, options);
        this.draw = function (context) {
            var $parent = $("<div>").addClass("dropdown").appendTo(this),
                $toggle = $("<a>", {href: '#'}).text(options.label).appendTo($parent);

            // create & add node first, since the rest is async
            var node = $("<ul>").addClass("dropdown-menu").appendTo($parent);
            applyCollection(self, new Collection(context), node, context, true);

            $toggle.dropdown();
            $toggle.on("click", function () {
                $toggle.dropdown('toggle');
            });
        };
    };

    return {
        Link: Link,
        ToolbarLinks: ToolbarLinks,
        InlineLinks: InlineLinks,
        DropdownLinks: DropdownLinks
    };
});