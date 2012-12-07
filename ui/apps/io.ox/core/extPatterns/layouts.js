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

define("io.ox/core/extPatterns/layouts", ["io.ox/core/extensions"], function (ext) {

    "use strict";

    var that = {};

    function invokeEventHandler($node, extension, type, args) {
        if (extension.on && extension.on[type]) {
            if (extension.isEnabled && !extension.isEnabled.apply(extension, args)) {
                if ($node) {
                    $node.empty();
                    return 'remove';
                }
                return 'done';
            }
            if ($node) {
                extension.on[type].apply($node, _([args, extension]).flatten());
                return 'done';
            } else {
                return 'draw';
            }
        }
        return 'done';
    }

    var Grid = function (options) {
        var self = this,
            point = ext.point(options.ref),
            nodes = {};

        self.draw = function () {
            var args = $.makeArray(arguments),
                $node = this,
                $currentRow,
                slotsLeft = 0,
                stack,
                keep,
                extension,
                dimensions;

            function br() {
                $currentRow = $("<div>").addClass("row-fluid").appendTo($node);
                slotsLeft = 12;
            }

            function copyKeep() {
                while (keep.length !== 0) {
                    stack.push(keep.pop());
                }
            }

            function fits(extension, dim) {
                return slotsLeft >= dim.span;
            }

            function drawTiles(extension, dim) {
                var tileSize = slotsLeft - dim.span;
                if (dim.orientation === 'right' && tileSize > 0) {
                    $("<div>").addClass("tile span" + tileSize).append("&nbsp;").appendTo($currentRow);
                    slotsLeft = slotsLeft - tileSize;
                }
            }

            function drawExtension(extension, dim) {
                var $tile = $("<div>").addClass("span" + dim.span).appendTo($currentRow);
                nodes[extension.id] = $tile;
                extension.draw.apply($tile, args);
                slotsLeft = slotsLeft - dim.span;
            }

            stack = [];
            point.each(function (ext) {
                stack.push(ext);
            });

            while (stack.length !== 0) {
                if (slotsLeft === 0) {
                    br();
                }
                keep = [];
                extension = stack.shift();
                if (extension.isEnabled && !extension.isEnabled.apply(extension, args)) {
                    continue;
                }
                dimensions = extension.metadata("dim", args) || {span: 12};
                if (!dimensions.span) {
                    dimensions.span = 12;
                }
                if (dimensions.span > 12 || dimensions.span < 1) {
                    dimensions.span = 12;
                }

                while (stack.length !== 0 && !fits(extension, dimensions)) {
                    keep.push(extension);
                    extension = stack.shift();
                    dimensions = extension.metadata("dim", args) || {span: 12};
                }
                if (!fits(extension, dimensions)) {
                    br();
                }
                drawTiles(extension, dimensions);
                drawExtension(extension, dimensions);
                if (dimensions.forceBreak) {
                    br();
                }
                copyKeep();
            }
        };

        self.trigger = function () {
            var args = $.makeArray(arguments),
                $node = args.shift(),
                type = args.shift();

            var reflow = false;
            point.each(function (extension) {
                if (reflow) {
                    return;
                }
                var result = invokeEventHandler(nodes[extension.id], extension, type, args);
                reflow = reflow || result === 'draw' || result === 'remove';
            });
            if (reflow) {
                $node.empty();
                self.draw.apply($node, args);
            }
        };

        self.each = function (fn) {
            point.each(function (extension) {
                fn(extension, nodes[extension.id]);
            });
        };

        self.destroy = function () {
            nodes = null;
        };
    };

    that.Grid = Grid;

    return that;
});
