/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/core/tk/doc-utils/pageloader', [
    'io.ox/core/pdf/pdfview',
    'io.ox/core/tk/doc-utils/baseobject',
    'io.ox/core/tk/doc-utils/timermixin'
], function (PDFView, BaseObject, TimerMixin) {

    'use strict';

    var // the maximum number of simultaneous pending page render requests
        MAX_REQUESTS = _.device('touch') ? 2 : 5,

        // the number of page render requests currently running
        RUNNING_REQUESTS = 0,

        ACTIVE_STYLE = { visibility: 'visible' };

    // private global functions ===============================================

    /**
     * Returns an integer attribute value of the passed element.
     *
     * @param {HTMLElement|jQuery} node
     *  The DOM element whose attribute will be returned. If this object is a
     *  jQuery collection, uses the first node it contains.
     *
     * @param {String} name
     *  The name of the element attribute.
     *
     * @param {Number} def
     *  A default value in case the element does not contain the specified
     *  attribute.
     *
     * @returns {Number}
     *  The attribute value parsed as integer, or the default value.
     */
    function getElementAttributeAsInteger(node, name, def) {
        var attr = $(node).attr(name);
        return _.isString(attr) ? parseInt(attr, 10) : def;
    }

    // class PageLoader =======================================================

    /**
     * The queued page loader sending server requests for pages to be rendered.
     *
     * @constructor
     *
     * @extends BaseObject
     * @extends TimerMixin
     */
    //function PageLoader(app) {
    function PageLoader(pdfDocument, pdfView) {

        var // self reference
            self = this,
            // list of pages waiting to load their page contents, keyed by priority
            queue = { high: [], medium: [], low: [] },

            // waiting and running requests, keyed by page number
            map = {},

            // the background loop processing the pending pages
            timer = null;//,

        // base constructors --------------------------------------------------

        BaseObject.call(this);
        TimerMixin.call(this);

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
        function loadPageIntoNode(pageNode, pageNumber, options) {

            var // the Deferred object waiting for the image
                def = null,
                // the jquery node
                jqPageNode = $(pageNode),
                // the target image format
                format = options && options.format || 'png';

            // default options contain a page zoom of 1.0
            options = $.extend({ pageNumber: pageNumber, pageZoom: 1.0 }, options || {});

            // -----------------------------------------------------------------

            if (format === 'pdf') {
                jqPageNode.data('data-rendertype', 'pdf');
                jqPageNode.data('data-pagezoom', options.pageZoom);

                var pageSize = pdfView.createPDFPageNode(jqPageNode, options);
                def = (pageSize ? $.Deferred().resolve(pageSize) : $.Deferred().reject());
            }

            return def.promise();
        }

        /**
         * Registers a page node for deferred loading.
         */
        function registerPageNode(pageNode, pageNumber, options) {

            var // the pending data to be inserted into the array
                pageData = null,
                // the jquery node
                jqPageNode = $(pageNode),
                // the request priority
                priority = options && options.priority || 'medium';

            // check if the page has been registered already
            if (pageNumber in map) {
                return map[pageNumber].def.promise();
            }

            // insert a busy node into the page node
            var busyNode = $('<div>').addClass('abs').busy();

            // insert the page information into the pending array
            jqPageNode.empty().append(busyNode);
            pageData = { node: jqPageNode, page: pageNumber, options: options, def: $.Deferred() };
            queue[priority].push(pageData);
            map[pageNumber] = pageData;

            return pageData.def.promise().always(function () {
                busyNode.remove();
            });
        }

        /**
         * Loads all queued pages in a background loop.
         */
        function loadQueuedPages() {

            // check if the background loop is already running
            if (timer) {
                return;
            }

            // create a new background loop that processes all waiting pages
            timer = self.repeatDelayed(function () {

                var // data of next page to be loaded
                    pageData = null;

                // restrict number of requests running simultaneously (but do not break the loop);
                // load high-priority page even if limit has been reached but not exceeded
                if ((RUNNING_REQUESTS > MAX_REQUESTS) || ((RUNNING_REQUESTS === MAX_REQUESTS) && (queue.high.length === 0))) {
                    return;
                }

                // abort the background loop, if no more pages have to be loaded
                if (!(pageData = queue.high.shift() || queue.medium.shift() || queue.low.shift())) {
                    return TimerMixin.BREAK;
                }

                // load the page contents
                ++RUNNING_REQUESTS;
                loadPageIntoNode(pageData.node, pageData.page, pageData.options)
                .done(function (pageSize) {
                    pageData.node.removeClass('page-error');
                    pageData.def.resolve(pageSize);
                })
                .fail(function (result) {
                    pageData.node.addClass('page-error').html('<div class="error-icon">' + '<i class="fa-times" aria-hidden="true"></i>' + '</div>').css(ACTIVE_STYLE);
                    pageData.def.reject(result);
                })
                .always(function () {
                    --RUNNING_REQUESTS;
                    // bug 37352: do not access destroyed class member
                    if (map) { delete map[pageData.page]; }
                });
            }, 20);

            // forget reference to the timer, when all page requests are running
            timer.always(function () {
                timer = null;
            });
        }

        /**
         * Renders the PDF page with given page number and zoom
         * into the given node, that already has the
         * appropriate size and style size attributes set
         * @param {jQuery} canvasNode
         *  The target canvas node, as jQuery object.
         *
         * @param {Number} page
         *  The one-based index of the page to be rendered.
         *
         * @param {Number} pageZoom
         *  The zoom of the page for rendering.
         *
         * @returns {jquery promise}
         *  The jQuery promise that will be resolved when the
         *  page and the page text have been rendered successfully
         *  or rejected on error.
         */

        // methods ------------------------------------------------------------

        /**
         * Aborts all queued but not yet running page render requests. The
         * associated Deferred objects of the page requests (returned by the
         * method PageLoader.loadPage()) will neither be resolved nor rejected.
         * Page requests already running will be finished though.
         *
         * @returns {PageLoader}
         *  A reference to this instance.
         */
        this.abortQueuedRequests = function () {
            _.each(queue, function (array, priority) {
                _.each(array, function (pageData) {
                    pageData.node.empty();
                    delete map[pageData.page];
                });
                queue[priority] = [];
            });
            return this;
        };

        /**
         * Loads the page contents into the passed page node in a background
         * task. The number of page render requests running simultaneously is
         * globally restricted.
         *
         * @param {jQuery} pageNode
         *  The target page node, as jQuery object.
         *
         * @param {Number} pageNumber
         *  The one-based index of the page to be loaded.
         *
         * @param {Object} [options]
         *  Optional parameters:
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
         *  @param {Boolean} [options.printing=false]
         *      Specifies if the page is to be rendered for printing or just viewing
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object that will be resolved when the
         *  page has been loaded successfully; or rejected on error.
         */
        this.loadPage = this.createDebouncedMethod(registerPageNode, loadQueuedPages);

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
         *  The page node containing the contents.
         *
         * @param {Number} pageZoom
         *  The new zoom factor, as floating point number (the value 1
         *  represents the original page size).
         *
         * @returns {PageLoader}
         *  A reference to this instance.
         */
        this.setPageZoom = function (pageNode, pageZoom) {
            var // the page number
                pageNumber = getElementAttributeAsInteger(pageNode, 'data-page', 1),
                // the jquery node
                jqPageNode = $(pageNode),
                // the original size of the page
                pageSize = pdfDocument.getOriginalPageSize(pageNumber),
                // the type of the node to be rendered ('pdf')
                renderType = jqPageNode.data('data-rendertype'),
                // the resulting width/height
                width = Math.ceil(pageSize.width * pageZoom),
                height = Math.ceil(pageSize.height * pageZoom),
                newPageSize = { width: width, height: height };

            jqPageNode.data('page-zoom', pageZoom).attr(newPageSize).css(newPageSize);

            if (renderType === 'pdf') {
                // <canvas> element: render page into canvas and create text overlay
                pdfView.renderPDFPage(jqPageNode, pageNumber, pageZoom).then(function () {
                    jqPageNode.data('page-zoom', pageZoom).attr(newPageSize).css(ACTIVE_STYLE);
                });
            }

            return this;
        };

        // initialization -----------------------------------------------------

        // destroy all class members on destruction
        this.registerDestructor(function () {
            self = queue = map = timer = null;
        });

    } // class PageLoader

    // exports ================================================================

    // derive this class from class BaseObject
    return BaseObject.extend({ constructor: PageLoader });

});
