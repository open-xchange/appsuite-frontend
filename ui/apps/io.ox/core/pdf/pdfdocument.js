/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Kai Ahrens <kai.ahrens@open-xchange.com>
 */

/* global Promise */

define('io.ox/core/pdf/pdfdocument', [
    'io.ox/core/pdf/pdfview',
    'io.ox/core/viewer/util',
    'pdfjs-dist/build/pdf',
    'settings!io.ox/core'
], function (PDFView, Util, PDFJSLib, Settings) {

    'use strict';

    // class PDFDocument =======================================================

    /**
     * The model of the Preview application. Stores and provides the HTML
     * representation of the document pages.
     *
     * @constructor
     *
     * @extends BaseModel
     */
    /**
     * @param {String} pdfDocumentURL
     */
    function PDFDocument(pdfConverterURL) {

        var self = this;

        var loadDef = $.Deferred();

        // the resulting PDF.js document after loading
        var pdfjsDocument = null;

        // the total page count of the document {Number}
        var pageCount = 0;

        // the size of the first page is treated as default page size {width, height}
        var defaultPageSize = null;

        // the size of the first page is treated as default page size {[{width, height}, ...]}
        var pageSizes = [];

        // whether to enable range requests support, if not present the default is true
        var enableRangeRequests = Settings.get('pdf/enableRangeRequests', true);

        // Document initialization / loading parameters object
        var params = {
            // The URL of the PDF.
            url: pdfConverterURL,

            // Range request support. If the server supports range requests the PDF will be fetched in chunks.
            disableRange: !enableRangeRequests,

            // Streaming of PDF file data.
            disableStream: !enableRangeRequests,

            // Pre-fetching of PDF file data. PDF.js will automatically keep fetching more data even if it isn't needed to display the current page.
            // NOTE: It is also necessary to disable streaming, see above, in order for disabling of pre-fetching to work correctly.
            disableAutoFetch: !enableRangeRequests,

            // set verbosity level for PDF.js to errors only
            verbosity: PDFJSLib.VerbosityLevel.ERRORS,

            // The url to the predefined Adobe CMaps.
            cMapUrl: ox.abs + ox.root + '/apps/pdfjs-dist/cmaps/',

            // Specifies if CMaps are binary packed.
            cMapPacked: true
        };

        // detecting the worker automatically nor longer works, specify the workerSrc property manually
        PDFJSLib.GlobalWorkerOptions.workerSrc = ox.abs + ox.root + '/apps/pdfjs-dist/build/pdf.worker.js';

        // ---------------------------------------------------------------------

        function initializePageSize(pageNumber) {
            var def = $.Deferred();

            if (_.isNumber(pageNumber) && (pageNumber > 0) && (pageNumber <= pageCount)) {
                self.getPDFJSPage(pageNumber).then(function (pdfjsPage) {
                    var viewport = pdfjsPage.getViewport({ scale: PDFView.getAdjustedZoom(1.0) });
                    return def.resolve(PDFView.getNormalizedSize({ width: viewport.width, height: viewport.height }));
                });
            }

            return def.promise();
        }

        // methods ------------------------------------------------------------

        this.destroy = function () {
            if (pdfjsDocument) {
                pdfjsDocument.destroy();
            }
        };

        /**
         * @returns {jQuery.Promise}
         *  The promise of a Deferred object that will be resolved when the
         *  PDF document has been loaded completely.
         */
        this.getLoadPromise = function () {
            return loadDef.promise();
        };

        // ---------------------------------------------------------------------

        /**
         * @returns {PDF.js document}
         *  The promise of a Deferred object that will be resolved when the
         *  PDF document has been loaded completely.
         */
        this.getPDFJSDocument = function () {
            return pdfjsDocument;
        };

        // ---------------------------------------------------------------------

        /**
         * Gets the PDF.js page promise for the specified page
         *
         * @param {Number} pageNumber
         *  The number of the page.
         * @returns {PDF.js promise}
         *  The PDF.js page promise.
         */
        this.getPDFJSPage = function (pageNumber) {
            return pdfjsDocument.getPage(pageNumber);
        };

        // ---------------------------------------------------------------------

        /**
         * Returns the number of pages contained in the document.
         *
         * @returns {Number}
         *  The total number of pages in the document.
         */
        this.getPageCount = function () {
            return pageCount;
        };

        // ---------------------------------------------------------------------

        /**
         * Returns the number of pages contained in the document.
         *
         * @returns {Number}
         *  The total number of pages in the document.
         */
        this.getDefaultPageSize = function () {
            return defaultPageSize;
        };

        // ---------------------------------------------------------------------

        /**
         * Gets the page size in pixels for the specified page or
         * null if pageNumber is outside of page range
         *
         * @param {Number} pageNumber
         *  The number of the page.
         * @returns {width,height}
         *  The size in pixels of the page.
         */
        this.getOriginalPageSize = function (pageNumber) {
            var pageSize = null;

            if ((pageCount > 0) && _.isNumber(pageNumber) && (pageNumber > 0) && (pageNumber <= pageCount)) {
                pageSize = pageSizes[pageNumber - 1];

                /* TODO (KA): reenable to get correct page sizes for all pages =>
                 * ideal solution would be to retrieve and set original page size in first
                 * real rendering of the page; retrieving all page sizes at the
                 * begin will be too slow, so that this feature is currently disabled =>
                 * all pages will have the default/first page size ATM
                if (!pageSize) {
                    initializePageSize(pageNumber).then( function(pageSize) {
                        pageSizes[pageNumber - 1] = pageSize;
                    });
                }
                */
            }

            return (pageSize || defaultPageSize);
        };

        // ---------------------------------------------------------------------

        /**
         * Convert document to PDF
         *
         * @param {Object} params
         *  @param {String} params.url
         *   The URL of the PDF.
         *
         *  @param {Boolean} params.disableRange
         *   Disable range request support. When enabled, and if the server supports
         *   partial content requests, then the PDF will be fetched in chunks.
         *
         *  @param {Boolean} params.disableStream
         *   Disable streaming of PDF file data.
         *
         *  @param {Boolean} params.disableAutoFetch
         *   Disable pre-fetching of PDF file data. When range requests are enabled
         *   PDF.js will automatically keep fetching more data even if it isn't
         *   needed to display the current page.
         *   NOTE: It is also necessary to disable streaming, see above,
         *   in order for disabling of pre-fetching to work correctly.
         *
         *  @param {Number} params.verbosity
         *   Controls the logging level; the constants from {VerbosityLevel} should be used.
         *
         *  @param {String} params.cMapUrl
         *   The URL to the predefined Adobe CMaps. Include trailing slash.
         *
         *  @param {Boolean} params.cMapPacked
         *   Specifies if the Adobe CMaps are binary packed.
         */
        PDFJSLib.getDocument(params).promise.then(function (document) {
            var error = true;
            // the original getPage() function
            var origGetPageFunction = document && document.transport && document.transport.getPage;

            Util.logPerformanceTimer('PDFDocument:PDFJs_getDocument_then_handler'); // after first long running process

            // wrap around original getPage() function
            // to fix an exception which occurs when rapidly switching documents
            // and causes PDFjs to stop working and to render white pages only
            if (origGetPageFunction) {
                document.transport.getPage = function WorkerTransport_getPage(pageNumber, capability) {
                    // return rejected promise if no message handler is present
                    if (!document.transport.messageHandler) {
                        return Promise.reject();
                    }
                    // call original getPage() function
                    return origGetPageFunction.call(this, pageNumber, capability);
                };
            }

            if (document) {
                pdfjsDocument = document;
                pageCount = pdfjsDocument.numPages;

                if (pageCount > 0) {
                    error = false;

                    initializePageSize(1).then(function (pageSize) {
                        pageSizes[0] = defaultPageSize = pageSize;
                        return loadDef.resolve(pageCount);
                    });
                }
            }

            if (error) {
                loadDef.resolve({ cause: 'importError' });
            }
        }, function () {
            // In case of an error, extend the given URL with the
            // enctest=pdf flag, so that we get a correct error code
            // even in case of PDF source files, which are not treated
            // by the documentconverter otherwise;
            // The documentconverter will perform an encryption test on
            // a given PDF file and set the password error response accordingly
            var encTestPDFConverterURL = pdfConverterURL + '&enctest=pdf';

            $.ajax({
                url: encTestPDFConverterURL,
                dataType: 'json'

            }).always(function (data) {
                loadDef.resolve(
                    (_.isObject(data) && _.isString(data.cause)) ?
                        data :
                        { cause: 'filterError' });
            });
        });

    } // class PDFDocument

    // exports ================================================================

    return PDFDocument;
});
