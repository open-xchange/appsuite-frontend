/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/presenter/util', [
], function () {

    'use strict';

    var Util = {};

    /**
     * Detect visible nodes from given nodes array.
     *
     * @returns {Array} visibleNodes
     *  an array of indices of visible nodes.
     */
    Util.getVisibleNodes = function (nodes) {
        var visibleNodes = [];

        // return the visible pages
        _.each(nodes, function (element, index) {
            if (!Util.isVisibleNode(element)) { return; }
            visibleNodes.push(index + 1);
        });
        return visibleNodes;
    };

    /**
     * Detect visible thumbnail image nodes
     * that have not yet been loaded from given nodes array.
     *
     * @param {Array} nodes
     *  an array of image nodes.
     *
     * @returns {Array}
     *  an array of indices of visible image nodes.
     */
    Util.getThumbnailsToLoad = function (nodes) {
        var visibleNodes = [];

        // return the visible pages
        _.each(nodes, function (image, index) {
            if (image.src) {
                return;
            }
            if (!Util.isVisibleNode(image)) {
                return;
            }
            visibleNodes.push(index + 1);
        });

        return visibleNodes;
    };

    /**
     * Returns whether the node is visible in the viewport, wholly or partially.
     *
     * @param {DOM} node
     *  The DOM node to check.
     *
     * @returns {Boolean}
     *  Whether the node the is visible.
     */
    Util.isVisibleNode = function (node) {

        function isVerticalInWindow(verticalPosition) {
            return verticalPosition >= 0 && verticalPosition <= window.innerHeight;
        }

        function overlapsVertical(nodeBoundingRect) {
            return nodeBoundingRect.top < 0 && nodeBoundingRect.bottom > window.innerHeight;
        }

        function isHorizontalInWindow(horizontalPosition) {
            return horizontalPosition >= 0 && horizontalPosition <= window.innerWidth;
        }

        function overlapsHorizontal(nodeBoundingRect) {
            return nodeBoundingRect.left < 0 && nodeBoundingRect.right > window.innerWidth;
        }

        var nodeBoundingRect = node.getBoundingClientRect();

        return (isHorizontalInWindow(nodeBoundingRect.left) || isHorizontalInWindow(nodeBoundingRect.right) || overlapsHorizontal(nodeBoundingRect)) &&
                (isVerticalInWindow(nodeBoundingRect.top) || isVerticalInWindow(nodeBoundingRect.bottom) || overlapsVertical(nodeBoundingRect));
    };

    Util.createAbortableDeferred = function (abortFunction) {
        return _.extend($.Deferred(), {
            abort: abortFunction
        });
    };

    /**
     * Restricts the passed value to the specified numeric range.
     *
     * @param {Number} value
     *  The value to be restricted to the given range.
     *
     * @param {Number} min
     *  The lower border of the range.
     *
     * @param {Number} max
     *  The upper border of the range.
     *
     * @returns {Number}
     *  The passed value, if inside the given range, otherwise either the lower
     *  or upper border.
     */
    Util.minMax = function (value, min, max) {
        return Math.min(Math.max(value, min), max);
    };

    return Util;

});
