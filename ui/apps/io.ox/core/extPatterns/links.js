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
                actions.invoke(ref, this, context, e);
            };

        this.draw = this.draw || function (context) {
            this.append(
                $("<a>", { href: "#", tabindex: "1", "data-action": self.id })
                .addClass('io-ox-action-link')
                .attr({
                    'data-prio': options.prio || 'lo',
                    'data-ref': self.ref
                })
                .data({ ref: self.ref, context: context })
                .click(click)
                .text(String(self.label))
            );
        };
    };

    var XLink = function (id, options) {
        ext.point(id).extend(new Link(options));
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
            );
        };
    };

    var drawLinks = function (self, collection, node, context, args, bootstrapMode) {
        return actions.applyCollection(self.ref, collection, context, args)
        .always(function (links) {
            // count resolved links
            var count = 0;
            // draw links
            _(links).each(function (link) {
                if (_.isFunction(link.draw)) {
                    link.draw.call(bootstrapMode ? $("<li>").appendTo(node) : node, context);
                    if (_.isFunction(link.customize)) {
                        link.customize.call(node.find('a'), context);
                    }
                    count++;
                }
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
            drawLinks(self, new Collection(context), this, context, args);
        };

    };

    var ToolbarButtons = function (options) {
        var self = _.extend(this, options);
        this.draw = function (context) {
            // paint on current node
            var args = $.makeArray(arguments);
            drawLinks(self, new Collection(context), this, context, args);
            // add classes to get button style
            this.children('a').addClass('btn btn-primary');
            this.children('.dropdown').children('a').addClass('btn btn-primary');
        };
    };

    var inlineToggle = function (e) {
        var node = $(this), A = 'data-toggle',
            list = node.parent().children('[data-prio="lo"]'),
            expand = node.attr(A) === 'more';
        list[expand ? 'show' : 'hide']();
        node.text(expand ? 'Less' : 'More').attr(A, expand ? 'less' : 'more');
    };

    var InlineLinks = function (options) {
        var self = _.extend(this, options);
        this.draw = function (context) {
            // create & add node first, since the rest is async
            var args = $.makeArray(arguments),
                node = $("<div>").addClass("io-ox-inline-links").appendTo(this),
                multiple = _.isArray(context) && context.length > 1;
            if (options.attributes) {
                node.attr(options.attributes);
            }
            if (options.classes) {
                _(options.classes).each(function (cl) {
                    node.addClass(cl);
                });
            }
            drawLinks(self, new Collection(context), node, context, args)
            .done(function () {
                // add toggle unless multi-selection
                if (!multiple && node.children().length > 3) {
                    node.append(
                        $('<span>', { 'data-toggle': 'more' })
                        .addClass('label io-ox-action-link')
                        .css({ cursor: 'pointer', marginLeft: '1.5em' })
                        .click(inlineToggle)
                        .text('More')
                    );
                    node.children('[data-prio="lo"]').hide();
                }
                if (options.customizeNode) {
                    options.customizeNode(node);
                }
            });
        };
    };

    var z = 0;
    var drawDropDown = function (options, context) {
        var args = $.makeArray(arguments),
            $parent = $("<div>").addClass('dropdown')
                .css({ display: 'inline-block', zIndex: (z = z > 0 ? z - 1 : 10000) })
                .appendTo(this),
            $toggle = $("<a>", { href: '#' })
                .attr('data-toggle', 'dropdown')
                .data('context', context)
                .text(options.label + " ").append($("<b>").addClass("caret")).appendTo($parent);

        $toggle.addClass(options.classes);
        $parent.append($.txt('\u00A0\u00A0 ')); // a bit more space

        // create & add node first, since the rest is async
        var node = $('<ul>').addClass('dropdown-menu').appendTo($parent);
        drawLinks(options, new Collection(context), node, context, args, true);

        $toggle.dropdown();

        return $parent;
    };

    var DropdownLinks = function (options) {
        var o = _.extend(this, options);
        this.draw = function () {
            return drawDropDown.apply(this, [o].concat($.makeArray(arguments)));
        };
    };

    var Dropdown = function (id, options) {
        var o = options || {};
        o.ref = id + '/' + o.id;
        ext.point(id).extend(
            _.extend({
                ref: o.ref,
                draw: function (context) {
                    drawDropDown.call(this, o, context);
                }
            }, o)
        );
    };

    var drawButtonGroup = function (options, context) {
        var args = $.makeArray(arguments),
            $parent = $("<div>").addClass('btn-group')
                .css({ display: 'inline-block' })
                .addClass(options.classes)
                .attr('data-toggle', (options.radio ? 'buttons-radio' : ''))
                .appendTo(this);
        // create & add node first, since the rest is async
        var node = $parent;
        drawLinks(options, new Collection(context), node, context, args, false);
        return $parent;
    };

    var ButtonGroupButtons = function (options) {
        var o = _.extend(this, options);
        this.draw = function () {
            return drawButtonGroup.apply(this, [o].concat($.makeArray(arguments)));
        };
    };

    var ButtonGroup = function (id, options) {
        var o = options || {};
        o.ref = id + '/' + o.id;
        ext.point(id).extend(
            _.extend({
                ref: o.ref,
                draw: function (context) {
                    drawButtonGroup.call(this, o, context);
                }
            }, o)
        );
    };

    return {
        Action: Action,
        Link: Link,
        XLink: XLink, // TODO: consolidate Link/XLink
        Button: Button,
        ToolbarButtons: ToolbarButtons,
        ToolbarLinks: ToolbarLinks,
        InlineLinks: InlineLinks,
        DropdownLinks: DropdownLinks,
        Dropdown: Dropdown,
        ButtonGroup: ButtonGroup
    };
});
