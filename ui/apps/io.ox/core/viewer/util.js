/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/util', [
], function () {

    'use strict';

    var Util = {};

    // constants --------------------------------------------------------------
    /**
     * Maps the file categories of the OX Viewer model to Font Awesome icon classes.
     */
    Util.CATEGORY_ICON_MAP = {
        'file': 'fa-file-o',
        'txt': 'fa-file-text-o',
        'doc': 'fa-file-word-o',
        'ppt': 'fa-file-powerpoint-o',
        'xls': 'fa-file-excel-o',
        'image': 'fa-file-image-o',
        'video': 'fa-file-video-o',
        'audio': 'fa-file-audio-o',
        'pdf': 'fa-file-pdf-o'
    };

    // static methods ---------------------------------------------------------

    /**
     * Shortens a String and returns a result object containing the original
     * and two Strings clipped to normal and short max length.
     *
     * @param {String} str
     *  The input String.
     *
     * @param {Object} options
     *  Additional parameters
     *
     * @param {Number} [options.maxNormal = 40]
     *  The max length for the String clipped to normal length.
     *
     * @param {Number} [options.maxShort = 26]
     *  The max length for the String clipped to short length.
     *
     * @param {String} [options.charpos = 'middle']
     *  The position of the ellipsis char, 'end' or 'middle'.
     *
     * @param {String} [options.char = '\u2026']
     *  The ellipsis char.
     *
     * @returns {Object}
     *  {String} title: the original or an empty String
     *  {String} data-label-normal: the String clipped to normal length
     *  {String} data-label-short: the String clipped to short length
     */
    Util.getClippedLabels = function (str, options) {

        var opt = _.extend({
                maxNormal: 40,
                maxShort: 26,
                charpos: 'middle'
            }, options || {}),

            text = String(str || '').trim(),

            normal = _.noI18n(_.ellipsis(text, _.extend(opt, { max: opt.maxNormal }))),
            short = _.noI18n(_.ellipsis(text, _.extend(opt, { max: opt.maxShort })));

        return {
            title: text,
            'aria-label': text,
            'data-label-normal': normal,
            'data-label-short': short
        };
    };

    /**
     * Set a clipped label and the title to the given node according to the device type.
     *
     * Shortens a String and returns a result object containing the original
     * and two clipped Strings.
     *
     * @param {jQuery|DOM} node
     *  The node to be labeled.
     *
     * @param {String} str
     *  The label String.
     *
     * @param {String} [charpos = 'middle']
     *  The position of the ellipsis char, 'middle' or 'end'.
     */
    Util.setClippedLabel = function (node, str, charpos) {

        var attr = Util.getClippedLabels (str, charpos);

        node = (node instanceof $) ? node : $(node);
        node.attr(attr).addClass('viewer-responsive-label');
    };

    /**
     * Sets a CSS to indicate if current device is a 'smartphone' or 'tablet'
     * to the given DOM node.
     *
     * @param {jQuery|DOM} node
     *  The node to be labeled.
     */
    Util.setDeviceClass = function (node) {
        node = (node instanceof $) ? node : $(node);
        node.addClass( _.device('smartphone') ? 'smartphone' : (_.device('tablet') ? 'tablet' : '') );
    };

    /**
     * Returns the Font Awesome icon class for the file category of the
     * given OX Viewer model.
     *
     * @param {FilesAPI.Model} model
     *  the Drive file model.
     *
     * @returns {String}
     *  The Font Awesome icon class String.
     */
    Util.getIconClass = function (model) {
        if (!model) {
            return Util.CATEGORY_ICON_MAP.file;
        }
        var fileType = model.getFileType(),
            iconClass = Util.CATEGORY_ICON_MAP[fileType] || Util.CATEGORY_ICON_MAP.file;

        return iconClass;
    };

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
