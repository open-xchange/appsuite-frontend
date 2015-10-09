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
        // Whether the page element is visible in the viewport, wholly or partially.
        function isNodeVisible(node) {
            var nodeBoundingRect = node.getBoundingClientRect();
            function isInWindow(verticalPosition) {
                return verticalPosition >= 0 && verticalPosition <= window.innerHeight;
            }
            return isInWindow(nodeBoundingRect.top) ||
                isInWindow(nodeBoundingRect.bottom) ||
                (nodeBoundingRect.top < 0 && nodeBoundingRect.bottom > window.innerHeight);
        }
        // return the visible pages
        _.each(nodes, function (element, index) {
            if (!isNodeVisible(element)) { return; }
            visibleNodes.push(index + 1);
        });
        return visibleNodes;
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
