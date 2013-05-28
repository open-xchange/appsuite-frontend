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
     * Loads the specified page into the passed DOM node, after clearing all
     * its old contents. Loads either SVG mark-up as text and inserts it into
     * the passed DOM node, or an <img> element linking to an SVG file on the
     * server, depending on the current browser.
     *
     * @param {HTMLElement|jQuery} node
     *  The target node that will contain the loaded page.
     *
     * @param {PreviewModel} model
     *  The model that actually loads the page from the server.
     *
     * @param {Number} page
     *  The one-based page index.
     *
     * @param {Object} [options]
     *  A map with options to control the behavior of this method. The
     *  following options are supported:
     *  @param {Boolean} [options.fetchSiblings=false]
     *      If set to true, additional sibling pages will be loaded and
     *      stored in the internal page cache.
     *
     * @returns {jQuery.Promise}
     *  The Promise of a Deferred object waiting for the image data. Will be
     *  resolved with the original size of the page (as object with the
     *  properties 'width' and 'height', in pixels).
     */
    ViewUtils.loadPageIntoNode = function (node, model, page, options) {

        var // the Deferred object waiting for the image
            def = null;

        function resolveSize(childNode) {
            var size = { width: childNode.width(), height: childNode.height() };
            return ((size.width > 0) && (size.height > 0)) ? size : $.Deferred().reject();
        }

        node = $(node);
        if (_.browser.Chrome) {
            // as SVG mark-up (Chrome does not show embedded images in <img> elements linked to an SVG file)
            def = model.loadPageAsSvg(page, options).then(function (svgMarkup) {
                node[0].innerHTML = svgMarkup;
                // resolve with original image size
                return resolveSize(node.children().first());
            });
        } else {
            // preferred: as an image element linking to the SVG file (Safari cannot parse SVG mark-up)
            def = model.loadPageAsImage(page, options).then(function (imgNode) {
                node.empty().append(imgNode.css({ maxWidth: '', width: '', height: '' }));
                // resolve with original image size (naturalWidth/naturalHeight with SVG does not work in IE10)
                return resolveSize(imgNode);
            });
        }

        // clear node on error
        return def.fail(function () { node.empty(); }).promise();
    };

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
