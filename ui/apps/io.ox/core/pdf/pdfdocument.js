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
 * @author Kai Ahrens <kai.ahrens@open-xchange.com>
 */

define('io.ox/core/pdf/pdfdocument', [
    '3rd.party/pdf/pdfcore',
    'io.ox/core/pdf/pdfview'
], function (PDFJS, PDFView) {

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

        var self = this,

            loadDef = $.Deferred(),

            // the PDF.js document promise object {PDF.js promise object}
            pdfDocumentPromise = null,

            // the resulting PDF.js document after loading
            pdfjsDocumentPromise = null,

            // the total page count of the document {Number}
            pageCount = 0,

            // the size of the first page is treated as default page size {width, height}
            defaultPageSize = null,

            // the size of the first page is treated as default page size {[{width, height}, ...]}
            pageSizes = [];

        // disable range requests with Chrome on small devices
        if (_.browser.Chrome && _.device('smartphone')) {
            PDFJS.disableRange = true;
        }

        // ---------------------------------------------------------------------

        function initializePageSize(pageNumber) {
            var def = $.Deferred();

            if (_.isNumber(pageNumber) && (pageNumber > 0) && (pageNumber <= pageCount)) {
                self.getPDFJSPagePromise(pageNumber).then( function (pdfjsPage) {
                    var viewport = pdfjsPage.getViewport(PDFView.getAdjustedZoom(1.0));
                    return def.resolve(PDFView.getNormalizedSize({ width: viewport.width, height: viewport.height }));
                });
            }

            return def.promise();
        }

        // methods ------------------------------------------------------------

        this.destroy = function () {
            if (pdfDocumentPromise) {
                pdfDocumentPromise.destroy();
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
        this.getPDFJSDocumentPromise = function () {
            return pdfjsDocumentPromise;
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
        this.getPDFJSPagePromise = function (pageNumber) {
            return pdfjsDocumentPromise.getPage(pageNumber);
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

        // convert document to PDF
        (pdfDocumentPromise = PDFJS.getDocument(pdfConverterURL).promise).then( function (pdfjsDocument) {
            if (pdfjsDocument) {
                pdfjsDocumentPromise = pdfjsDocument;
                pageCount = pdfjsDocumentPromise.numPages;

                if (pageCount > 0) {
                    initializePageSize(1).then( function (pageSize) {
                        pageSizes[0] = defaultPageSize = pageSize;
                        return loadDef.resolve(pageCount);
                    }, function () {
                        return loadDef.reject();
                    });
                } else {
                    loadDef.reject();
                }
            } else {
                loadDef.reject();
            }
        }, function () {
            loadDef.reject();
        });

    } // class PDFDocument

    // exports ================================================================

    return PDFDocument;
});
