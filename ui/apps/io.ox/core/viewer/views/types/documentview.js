/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/core/viewer/views/types/documentview', [
    'io.ox/core/extPatterns/actions',
    'io.ox/core/viewer/views/types/baseview',
    'io.ox/core/pdf/pdfdocument',
    'io.ox/core/pdf/pdfview',
    'io.ox/core/viewer/util',
    'io.ox/core/viewer/eventdispatcher',
    'less!io.ox/core/pdf/pdfstyle'
], function (ActionsPattern, BaseView, PDFDocument, PDFView, Util, EventDispatcher) {

    'use strict';

    /**
     * The image file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function render({model: model, modelIndex: modelIndex});
     *    function load();
     *    function unload();
     * }
     *
     */
    var DocumentView =  BaseView.extend({

        initialize: function () {
            //console.warn('DocumentView.initialize()', this.model.get('filename'));
            //The name of the document converter server module.
            this.CONVERTER_MODULE_NAME = 'oxodocumentconverter';
            // amount of page side margins in pixels
            this.PAGE_SIDE_MARGIN = 30;
            // the PDFView instance
            this.pdfView = null;
            // the PDFDocument instance
            this.pdfDocument = null;
            // call view destroyer on viewer global dispose event
            this.on('dispose', this.disposeView.bind(this));
            // bind zoom handlers
            EventDispatcher.on('viewer:document:zoomin', this.onZoomIn.bind(this));
            EventDispatcher.on('viewer:document:zoomout', this.onZoomOut.bind(this));
        },

        /**
         * Creates and renders an Image slide.
         *
         * @returns {DocumentView}
         *  the DocumentView instance.
         */
        render: function () {
            //console.warn('DocumentView.render()', this.model.get('filename'));
            var pageContainer = $('<div class="document-container io-ox-core-pdf">');

            // remove content of the slide duplicates
            if (this.$el.hasClass('swiper-slide-duplicate')) {
                this.$el.empty();
            }
            this.$el.append(pageContainer, this.createCaption());
            return this;
        },

        /**
         * "Prefetches" the document slide.
         * In order to save memory and network bandwidth documents are not prefetched.
         *
         * @returns {DocumentView}
         *  the DocumentView instance.
         */
        prefetch: function () {
            //console.warn('DocumentView.prefetch()', this.model.get('filename'));
            return this;
        },

        /**
         * "Shows" the document (Office, PDF) with the PDF.js library.
         *
         * @returns {DocumentView}
         *  the DocumentView instance.
         */
        show: function () {
            //console.warn('DocumentView.show()', this.model.get('filename'));
            // ignore already loaded documents
            if (this.$el.find('.document-page').length > 0) {
                return;
            }
            var self = this,
                // the file descriptor object
                originalFile = this.model.get('origData'),
                file = originalFile instanceof Backbone.Model ? originalFile.attributes : originalFile,
                fileContentType = this.model.get('contentType'),
                // generate document converter URL of the document
                documentUrl = Util.getServerModuleUrl(this.CONVERTER_MODULE_NAME, file, {
                    action: 'getdocument',
                    documentformat: 'pdf',
                    priority: 'instant',
                    mimetype: fileContentType ? encodeURIComponent(fileContentType) : '',
                    nocache: _.uniqueId() // needed to trick the browser cache (is not evaluated by the backend)
                }),
                // fire up PDF.JS with the document URL and get its loading promise
                pageContainer = this.$el.find('.document-container');

            /**
             * Calculates document page numbers to render depending on visilbility of the pages
             * in the viewport (window).
             *
             * @returns {Array} pagesToRender
             *  an array of page numbers which should be rendered.
             */
            function getPagesToRender() {
                //console.warn('DocumentView.getPagesToRender()', pageContainer);
                var pages = pageContainer.find('.document-page'),
                    pagesToRender = [];
                // Whether the page element is visible in the viewport, wholly or partially.
                function isPageVisible(pageElement) {
                    var pageRect = pageElement.getBoundingClientRect();
                    function isInWindow(verticalPosition) {
                        return verticalPosition >= 0 && verticalPosition <= window.innerHeight;
                    }
                    return isInWindow(pageRect.top) ||
                        isInWindow(pageRect.bottom) ||
                        (pageRect.top < 0 && pageRect.bottom > window.innerHeight);
                }
                // return the visible pages
                _.each(pages, function (element, index) {
                    if (!isPageVisible(element)) { return; }
                    pagesToRender.push(index + 1);
                });
                return pagesToRender;
            }

            /**
             * Returns the pageNode with the given pageNumber.
             *
             * @param pageNumber
             *  The 1-based number of the page nod to return
             *
             * @returns {jquery.Node} pageNode
             *  The jquery page node for the requested page number.
             */
            function getPageNode(pageNumber) {
                return (_.isNumber(pageNumber) && (pageNumber >= 1)) ? pageContainer.children().eq(pageNumber - 1) : null;
            }

            /**
             * Gets called just before pages get rendered.
             *
             * @param pageNumbers
             *  The array of 1-based page numbers to be rendered
             */
            function beginPageRendering(pageNumbers) {
                console.log('Begin PDF rendering: ' + pageNumbers);
            }

            /**
             * Gets called just after pages are rendered.
             *
             * @param pageNumbers
             *  The array of 1-based page numbers that have been rendered
             */
            function endPageRendering(pageNumbers) {
                console.log('End PDF rendering: ' + pageNumbers);
            }

            /**
             * Success handler for the PDF loading process.
             *
             * @param {Number} pageCount
             *  page count of the pdf document delivered by the PDF.js library.
             */
            function pdfDocumentLoadSuccess(pageCount) {

                // forward 'resolved' errors to error handler
                if (_.isObject(pageCount) && (pageCount.cause.length > 0)) {
                    pdfDocumentLoadError();
                    return;
                }

                var pdfDocument = this.pdfDocument;
                // create the PDF view after successful loading;
                // the initial zoom factor is already set to 1.0
                this.pdfView = new PDFView(pdfDocument, { textOverlay: true });
                // set default scale/zoom, according to device's viewport width
                this.pdfView.setPageZoom(this.getDefaultScale());
                // draw page nodes and apply css sizes
                _.times(pageCount, function (index) {
                    var jqPage = $('<div class="document-page">'),
                        pageSize = self.pdfView.getRealPageSize(index + 1);
                    pageContainer.append(jqPage.attr(pageSize).css(pageSize));
                });
                // set callbacks at this.pdfView to start rendering
                var renderCallbacks = {
                    getVisiblePageNumbers: getPagesToRender,
                    getPageNode: getPageNode,
                    beginRendering: beginPageRendering,
                    endRendering: endPageRendering
                };

                this.pdfView.setRenderCallbacks(renderCallbacks);
            }

            /**
             * Actions which always have to be done after pdf document loading process
             */
            function pdfDocumentLoadFinished() {
                pageContainer.idle();
            }

            /**
             * Error handler for the PDF loading process.
             */
            function pdfDocumentLoadError() {
                console.error('Core.Viewer.DocumentView.load(): failed loading PDF document.', self.model.get('filename'));
            }

            // create the PDF document model
            this.pdfDocument = new PDFDocument(documentUrl);

            // display loading animation
            pageContainer.busy();

            // wait for PDF document to finish loading
            $.when(this.pdfDocument.getLoadPromise())
                .then(pdfDocumentLoadSuccess.bind(this), pdfDocumentLoadError)
                .always(pdfDocumentLoadFinished.bind(this));

            return this;
        },

        /**
         * Calculates a default scale number for documents, taking
         * current viewport width and the document's default size
         * into account.
         *
         * @returns {Number} scale
         *  Document zoom scale in floating point number.
         */
        getDefaultScale: function () {
            var maxWidth = window.innerWidth - (this.PAGE_SIDE_MARGIN * 2),
                pageDefaultSize = this.pdfDocument.getDefaultPageSize(),
                pageDefaultWidth = pageDefaultSize && pageDefaultSize.width;

            if ((!pageDefaultWidth) || (maxWidth >= pageDefaultWidth)) {
                return 1;
            }
            return PDFView.round(maxWidth / pageDefaultWidth, 1 / 100);
        },

        /**
         * Zooms in of a document.
         */
        onZoomIn: function (baton) {
            var self = this;
            if (this.$el.hasClass('swiper-slide-active')) {
                console.warn('DocumentView.zoomIn()', baton);
                this.pdfDocument.getLoadPromise().done(function () {
                    var pages = self.$el.find('.document-container .document-page');
                    // test code, increase zoom 1.5 times for every zoom in
                    _.each(pages, function (page, pageIndex) {
                        var pageNumber = pageIndex + 1,
                            currentPageZoom = self.pdfView.getPageZoom(pageNumber);

                        self.pdfView.setPageZoom(currentPageZoom * 1.5, pageNumber);

                        var realPageSize = self.pdfView.getRealPageSize(pageNumber);
                        $(page).attr(realPageSize).css(realPageSize);
                    });
                });
            }
        },

        /**
         * Zooms out of the document.
         */
        onZoomOut: function (baton) {
            if (this.$el.hasClass('swiper-slide-active')) {
                console.warn('DocumentView.zoomOut()', baton);
            }
        },

        /**
         * Unloads the document slide by destroying the pdf view and model instances
         *
         * @param {Boolean} dispose
         *  If true also Swiper slide duplicates will be unloaded.
         */
        unload: function (dispose) {
            //console.warn('DocumentView.unload()', this.pdfView, this.pdfDocument);

            // never unload slide duplicates
            if (!this.$el.hasClass('swiper-slide-duplicate') || dispose) {
                if (this.pdfView) {
                    this.pdfView.destroy();
                    this.pdfView = null;
                }
                if (this.pdfDocument) {
                    this.pdfDocument.destroy();
                    this.pdfDocument = null;
                }
                // clear document container content
                this.$el.find('div.document-container').empty();
            }

            return this;
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            //console.warn('DocumentView.disposeView()');
            this.unload(true);
            EventDispatcher.off('viewer:document:zoomin viewer:document:zoomout');
        }

    });

    // returns an object which inherits BaseView
    return DocumentView;
});
