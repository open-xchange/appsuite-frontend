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

define('io.ox/office/preview/view/pageloader', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    var // default page size used before a page has been loaded
        DEFAULT_PAGE_SIZE = {
            width: Utils.convertLength(210, 'mm', 'px', 1),
            height: Utils.convertLength(297, 'mm', 'px', 1)
        },

        // the maximum number of simultaneous pending AJAX page requests
        MAX_REQUESTS = Modernizr.touch ? 2 : 5,

        // the number of AJAX requests currently running
        runningRequests = 0,

        // the temporary node used to calculate the original size of a page image
        tempNode = $('<div>').css('position', 'absolute');

    // private global functions ===============================================

    /**
     * Calculates the original size of the passed page image node.
     *
     * @param {jQuery} imageNode
     *  The node whose size will be calculated.
     *
     * @returns {Object|Null}
     *  The size of the image node (in pixels), in the properties 'width' and
     *  'height'; or null if the size is not valid (zero).
     */
    function calculateImageSize(imageNode) {

        var // the original parent node
            parentNode = imageNode.parent(),
            // the resulting size of the passed image node
            width = 0, height = 0;

        // insert the image node into a temporary unrestricted node and get its size
        tempNode.append(imageNode).appendTo('body');
        width = imageNode.width();
        height = imageNode.height();
        // move image node back to its parent
        parentNode.append(imageNode);
        tempNode.remove();

        return ((width > 0) && (height > 0)) ? { width: width, height: height } : null;
    }

    // class PageLoader =======================================================

    function PageLoader(app) {

        var // list of pages waiting to load their page contents, keyed by priority
            queue = { high: [], medium: [], low: [] },

            // waiting and running requests, keyed by page number
            map = {},

            // the background loop processing the pending pages
            timer = null;

        // private methods ----------------------------------------------------

        /**
         * Loads the specified page into the passed DOM node, after clearing
         * all its old contents. Loads either SVG mark-up as text and inserts
         * it into the passed DOM node, or an <img> element linking to an SVG
         * file on the server, depending on the current browser.
         *
         * @param {jQuery} pageNode
         *  The target node that will contain the loaded page.
         *
         * @param {Number} page
         *  The one-based page index.
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object waiting for the image data. Will
         *  be resolved with the original size of the page (as object with the
         *  properties 'width' and 'height', in pixels).
         */
        function loadPageIntoNode(pageNode, page, priority) {

            var // the Deferred object waiting for the image
                def = null;

            function resolveSize() {
                var pageSize = calculateImageSize(pageNode.children().first());
                if (pageSize) { pageNode.data('page-size', pageSize); }
                return pageSize || $.Deferred().reject();
            }

            if (_.browser.Chrome) {
                // as SVG mark-up (Chrome does not show embedded images in <img> elements linked to an SVG file)
                def = app.getModel().loadPageAsSvg(page, priority).then(function (svgMarkup) {
                    // do NOT use the jQuery.html() method for SVG mark-up!
                    pageNode[0].innerHTML = svgMarkup;
                    // resolve with original image size
                    return resolveSize();
                });
            } else {
                // preferred: as an image element linking to the SVG file (Safari cannot parse SVG mark-up)
                def = app.getModel().loadPageAsImage(page, priority).then(function (imgNode) {
                    pageNode.empty().append(imgNode);
                    // resolve with original image size (naturalWidth/naturalHeight with SVG does not work in IE10)
                    return resolveSize();
                });
            }

            return def.promise();
        }

        /**
         * Registers a page node for deferred loading.
         */
        function registerPageNode(pageNode, page, priority) {

            var // the pending data to be inserted into the array
                pageData = null;

            // check if the page has been registered already
            if (page in map) { return map[page].def.promise(); }

            // insert a busy node into the page node
            pageNode.empty().append($('<div>').addClass('abs').busy());

            // insert the page information into the pending array
            pageData = { node: pageNode, page: page, priority: priority, def: $.Deferred() };
            queue[priority].push(pageData);
            map[page] = pageData;

            return pageData.def.promise();
        }

        /**
         * Loads all queued pages in a background loop.
         */
        function loadQueuedPages() {

            // check if the background loop is already running
            if (timer) { return; }

            // create a new background loop that processes all waiting pages
            timer = app.repeatDelayed(function () {

                var // data of next page to be loaded
                    pageData = null;

                // restrict number of requests running simultaneously (but do not break the loop)
                if (runningRequests > MAX_REQUESTS) { return; }

                // load high-priority page even if limit has been reached but not exceeded
                if ((runningRequests === MAX_REQUESTS) && (queue.high.length === 0)) { return; }

                // abort the background loop, if no more pages have to be loaded
                pageData = queue.high.shift() || queue.medium.shift() || queue.low.shift();
                if (!pageData) { return Utils.BREAK; }

                // load the page contents
                runningRequests += 1;
                loadPageIntoNode(pageData.node, pageData.page, pageData.priority)
                .always(function () {
                    runningRequests -= 1;
                    delete map[pageData.page];
                })
                .done(function (pageSize) {
                    pageData.def.resolve(pageSize);
                })
                .fail(function (result) {
                    pageData.node.empty().append(
                        Utils.createIcon('icon-remove').css({
                            color: '#f88',
                            fontSize: Math.min(pageData.node.height(), 60) + 'px',
                            lineHeight: pageData.node.height() + 'px'
                        })
                    );
                    pageData.def.reject(result);
                });

            }, { delay: 20 });

            // forget reference to the timer, when all page requests are running
            timer.done(function () { timer = null; });
        }

        // methods ------------------------------------------------------------

        /**
         * Aborts all queued but not yet running AJAX page requests. The
         * associated Deferred objects of the page requests (returned by the
         * method PageLoader.loadPage()) will neither be resolved nor rejected.
         * Page requests already running will be finished though.
         *
         * @returns {PageLoader}
         *  A reference to this instance.
         */
        this.abortQueuedRequests = function () {
            _(queue).each(function (array, priority) {
                _(array).each(function (pageData) {
                    pageData.node.empty();
                    delete map[pageData.page];
                });
                queue[priority] = [];
            });
            return this;
        };

        /**
         * Loads the page contents into the passed page node in a background
         * task. The number of AJAX page requests running simultaneously is
         * globally restricted.
         *
         * @param {jQuery} pageNode
         *  The target page node, as jQuery object.
         *
         * @param {Number} page
         *  The one-based index of the page to be loaded.
         *
         * @param {String} priority
         *  The priority the page will be loaded with. Supported values are
         *  'high', 'medium', and 'low'.
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object that will be resolved when the
         *  page has been loaded successfully; or rejected on error.
         */
        this.loadPage = app.createDebouncedMethod(registerPageNode, loadQueuedPages);

        /**
         * Returns the original size of the image in the passed page node. The
         * size will be stored in the page node after the page has been loaded.
         * If the passed page has not been loaded yet, returns a default page
         * size.
         *
         * @returns {Object}
         *  The original page size (in pixels), in the properties 'width' and
         *  'height'.
         */
        this.getPageSize = function (pageNode) {
            return $(pageNode).data('page-size') || DEFAULT_PAGE_SIZE;
        };

        /**
         * Returns the current zoom factor of the passed page node. The zoom
         * factor will be stored in the page node after the page has been
         * loaded and rendered. If the passed page has not been loaded yet,
         * returns the default zoom factor of 1.
         *
         * @returns {Number}
         *  The current zoom factor.
         */
        this.getPageZoom = function (pageNode) {
            return $(pageNode).data('page-zoom') || 1;
        };

        /**
         * Recalculates the size of the passed page node, according to the
         * original page size and zoom factor.
         *
         * @param {HTMLElement|jQuery} pageNode
         *  The page node containing the SVG contents.
         *
         * @param {Number} zoomFactor
         *  The new zoom factor.
         *
         * @returns {PageLoader}
         *  A reference to this instance.
         */
        this.setZoomFactor = function (pageNode, zoomFactor) {

            var // the original size of the page
                pageSize = this.getPageSize(pageNode),
                // the child node in the page, containing the SVG
                childNode = $(pageNode).children().first(),
                // the resulting width/height
                width = Math.floor(pageSize.width * zoomFactor),
                height = Math.ceil(pageSize.height * zoomFactor);

            if (childNode.is('img')) {
                // <img> element: resize with CSS width/height
                childNode.width(width).height(height);
            } else {
                // <svg> element (Chrome): scale with CSS zoom (supported in WebKit)
                childNode.css('zoom', zoomFactor);
            }

            // Chrome bug/problem: sometimes, the page node has width 0 (e.g., if browser zoom is
            // not 100%) regardless of existing SVG, must set its size explicitly to see anything...
            $(pageNode).width(width).height(height).data('page-zoom', zoomFactor);

            return this;
        };

        /**
         * Converts the image data of the passed <img> element to an inline
         * bitmap represented by a data URL.
         *
         * @param {HTMLImageElement|jQuery} imgNode
         *  The <img> element.
         *
         * @param {Object} imageSize
         *  The original image size, as pixels, in 'width' and 'height'
         *  properties.
         *
         * @returns {PageLoader}
         *  A reference to this instance.
         */
        this.convertImageToBitmap = function (imgNode, imageSize) {

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
                Utils.error('PageLoader.convertImageToBitmap(): exception caucht: ' + ex);
            }

            return this;
        };

    } // class PageLoader

    // exports ================================================================

    return PageLoader;

});
