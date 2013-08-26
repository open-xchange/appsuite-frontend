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
     *  The node whose size will be calculated. May be an <img> element linking
     *  to an image, or an <svg> element containing parsed SVG mark-up.
     *
     * @param {Number} [zoom]
     *  If specified, the zoom factor passed in the server request. Needed to
     *  calculate the original page size from the physical size of the image.
     *
     * @returns {Object|Null}
     *  The size of the image node (in pixels), in the properties 'width' and
     *  'height'; or null if the size is not valid (zero).
     */
    function calculateImageSize(imageNode, zoom) {

        var // the original parent node
            parentNode = imageNode.parent(),
            // the resulting size of the passed image node
            width = 0, height = 0;

        // try to use the naturalWidth/naturalHeight attributes of <img> elements
        if (imageNode.is('img')) {
            // remove the 'max-width' attribute added by Bootstrap CSS
            imageNode.css('max-width', 'none');
            width = imageNode[0].naturalWidth || 0;
            height = imageNode[0].naturalHeight || 0;
        }

        // naturalWidth/naturalHeight may not work for <img> elements linking to SVG
        if ((width === 0) || (height === 0)) {

            // insert the image node into a temporary unrestricted node and get its size
            tempNode.append(imageNode).appendTo('body');
            width = imageNode.width();
            height = imageNode.height();

            // move image node back to its parent
            parentNode.append(imageNode);
            tempNode.remove();
        }

        // zoom correction
        if (_.isNumber(zoom) && (zoom > 0)) {
            width /= zoom;
            height /= zoom;
        }

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
         * all its old contents.
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object waiting for the image data. Will
         *  be resolved with the original size of the page (as object with the
         *  properties 'width' and 'height', in pixels).
         */
        function loadPageIntoNode(pageNode, page, options) {

            var // the Deferred object waiting for the image
                def = null,
                // the target image format
                format = Utils.getStringOption(options, 'format', 'png');

            function resolveSize() {
                var pageSize = calculateImageSize(pageNode.children().first(), Utils.getNumberOption(options, 'zoom'));
                if (pageSize) { pageNode.data('page-size', pageSize); }
                return pageSize || $.Deferred().reject();
            }

            if (_.browser.Chrome && (format === 'svg')) {

                // as SVG mark-up (Chrome does not show embedded images in <img> elements linked to an SVG file)
                def = app.getModel().loadPageAsSvgMarkup(page, Utils.getStringOption(options, 'priority', 'medium')).then(function (svgMarkup) {
                    // do NOT use the jQuery.html() method for SVG mark-up!
                    pageNode[0].innerHTML = svgMarkup;
                    // resolve with original image size
                    return resolveSize();
                });
            } else {

                // Bug 25765: Safari cannot parse SVG mark-up, and cannot show images embedded in <img> elements linking to SVG
                if ((_.browser.Safari || (_.browser.iOS && _.browser.WebKit)) && (format === 'svg')) {
                    options = Utils.extendOptions(options, { format: 'jpg', zoom: Utils.RETINA ? 2 : 1 });
                }

                // preferred: as an image element linking to the image file
                def = app.getModel().loadPageAsImage(page, options).then(function (imgNode) {
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
        function registerPageNode(pageNode, page, options) {

            var // the pending data to be inserted into the array
                pageData = null,
                // the request priority
                priority = Utils.getStringOption(options, 'priority', 'medium');

            // check if the page has been registered already
            if (page in map) { return map[page].def.promise(); }

            // insert a busy node into the page node
            pageNode.empty().append($('<div>').addClass('abs').busy());

            // insert the page information into the pending array
            pageData = { node: pageNode, page: page, options: options, def: $.Deferred() };
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
                loadPageIntoNode(pageData.node, pageData.page, pageData.options)
                .always(function () {
                    runningRequests -= 1;
                    delete map[pageData.page];
                })
                .done(function (pageSize) {
                    pageData.node.removeClass('page-error');
                    pageData.def.resolve(pageSize);
                })
                .fail(function (result) {
                    pageData.node.addClass('page-error').empty().append($('<div>').addClass('error-icon').append(Utils.createIcon('icon-remove')));
                    pageData.def.reject(result);
                });

            }, { delay: 20 });

            // forget reference to the timer, when all page requests are running
            timer.always(function () { timer = null; });
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
         * @param {Object} [options]
         *  A map with options controlling the behavior of this method. The
         *  following options are supported:
         *  @param {String} [options.format='png']
         *      The image format. Supported values are 'jpg', 'png', and 'svg'.
         *  @param {Number} [options.width]
         *      If specified, the requested width of the image, in pixels. If
         *      the option 'options.height' is specified too, the resulting
         *      width may be less than this value.
         *  @param {Number} [options.height]
         *      If specified, the requested height of the image, in pixels. If
         *      the option 'options.width' is specified too, the resulting
         *      height may be less than this value.
         *  @param {String} [options.priority='medium']
         *      Specifies with which priority the server will handle the image
         *      request. Must be one of the strings 'low', 'medium' (default),
         *      or 'high'.
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
         * @param {Number} pageZoom
         *  The new zoom factor, as floating point number (the value 1
         *  represents the original page size).
         *
         * @returns {PageLoader}
         *  A reference to this instance.
         */
        this.setPageZoom = function (pageNode, pageZoom) {

            var // the original size of the page
                pageSize = this.getPageSize(pageNode),
                // the child node in the page, containing the SVG
                childNode = $(pageNode).children().first(),
                // the resulting width/height
                width = Math.floor(pageSize.width * pageZoom),
                height = Math.ceil(pageSize.height * pageZoom);

            if (childNode.is('img')) {
                // <img> element: resize with CSS width/height
                childNode.width(width).height(height);
            } else {
                // <svg> element (Chrome): scale with CSS zoom (supported in WebKit)
                childNode.css('zoom', pageZoom);
            }

            // Chrome bug/problem: sometimes, the page node has width 0 (e.g., if browser zoom is
            // not 100%) regardless of existing SVG, must set its size explicitly to see anything...
            $(pageNode).width(width).height(height).data('page-zoom', pageZoom);

            return this;
        };

    } // class PageLoader

    // exports ================================================================

    return PageLoader;

});
