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
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/preview/viewutils', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    // static class ViewUtils =================================================

    var ViewUtils = {};

    // methods ----------------------------------------------------------------

    /**
     * Recalculates the size of the passed page node, according to the original
     * page size and zoom factor.
     *
     * @param {HTMLElement|jQuery} pageNode
     *  The page node containing the SVG contents.
     *
     * @param {Object} pageSize
     *  The original page size, as pixels, in 'width' and 'height' properties.
     *
     * @param {Number} zoomFactor
     *  The new zoom factor.
     */
    ViewUtils.setZoomFactor = function (pageNode, pageSize, zoomFactor) {

        var // the child node in the page, containing the SVG
            childNode = $(pageNode).children().first(),
            // the resulting width/height
            width = Math.floor(pageSize.width * zoomFactor),
            height = Math.floor(pageSize.height * zoomFactor);

        if (childNode.is('img')) {
            // <img> element: resize with CSS width/height
            childNode.width(width).height(height);
        } else {
            // <svg> element (Chrome): scale with CSS zoom (supported in WebKit)
            childNode.css('zoom', zoomFactor);
        }

        // Chrome bug/problem: sometimes, the page node has width 0 (e.g., if browser zoom is
        // not 100%) regardless of existing SVG, must set its size explicitly to see anything...
        $(pageNode).width(width).height(height);
    };

    /**
     * Converts the image data of the passed <img> element to an inline bitmap
     * represented by a data URL.
     *
     * @param {HTMLImageElement|jQuery} imgNode
     *  The <img> element.
     *
     * @param {Object} imageSize
     *  The original image size, as pixels, in 'width' and 'height' properties.
     */
    ViewUtils.convertImageToBitmap = function (imgNode, imageSize) {

        var // the size of the canvas (maximum four times the current image size)
            bitmapWidth = Math.min($(imgNode).width() * 4, imageSize.width),
            bitmapHeight = Math.min($(imgNode).height() * 4, imageSize.height),
            // the <canvas> element for SVG/bitmap conversion
            canvas = $('<canvas>').attr({ width: bitmapWidth, height: bitmapHeight })[0];

        try {
            canvas.getContext('2d').drawImage(Utils.getDomNode(imgNode), 0, 0, imageSize.width, imageSize.height, 0, 0, bitmapWidth, bitmapHeight);
            // currently, canvas.toDataURL() works in Firefox only, even with images from same origin
            $(imgNode).attr('src', canvas.toDataURL());
        } catch (ex) {
            Utils.error('ViewUtils.convertImageToBitmap(): exception caucht: ' + ex);
        }
    };

    // exports ================================================================

    return ViewUtils;

});
