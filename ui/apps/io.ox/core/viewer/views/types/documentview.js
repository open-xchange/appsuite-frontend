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
    'io.ox/core/viewer/views/types/baseview',
    'io.ox/core/pdf/pdfdocument',
    'io.ox/core/pdf/pdfview',
    'io.ox/core/viewer/util'
], function (BaseView, PDFDocument, PDFView, Util) {

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
            //console.warn('ImageView.initialize()');
            //The name of the document converter server module.
            this.CONVERTER_MODULE_NAME = 'oxodocumentconverter';
            // the PDFView instance
            this.pdfView = null;
            // the PDFDocument instance
            this.pdfDocument = null;
            // call view destroyer on viewer global dispose event
            this.on('dispose', this.disposeView.bind(this));
        },

        /**
         * Creates and renders an Image slide.
         *
         * @returns {DocumentView}
         *  the DocumentView instance.
         */
        render: function () {
            //console.warn('DocumentType.render()');
            var pageContainer = $('<div class="document-container">');
            this.$el.append(pageContainer, this.createCaption());
            return this;
        },

        /**
         * Loads a document (Office, PDF) with the PDF.js library.
         *
         */
        load: function () {
            // ignore slide duplicates and already loaded documents
            if (this.$el.find('.document-page').length > 0) {
                return;
            }
            var self = this,
                // the file descriptor object
                file = this.model.get('origData'),
                // generate document converter URL of the document
                documentUrl = Util.getServerModuleUrl(this.CONVERTER_MODULE_NAME, file, {
                    action: 'getdocument',
                    documentformat: 'pdf',
                    priority: 'instant',
                    mimetype: file.file_mimetype ? encodeURIComponent(file.file_mimetype) : '',
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
                //console.warn('DocumentType.getPagesToRender()', pageContainer);
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
             * Success handler for the PDF loading process.
             *
             * @param {Number} pageCount
             *  page count of the pdf document delivered by the PDF.js library.
             */
            function pdfDocumentLoadSuccess(pageCount) {
                var pdfDocument = this.pdfDocument,
                    defaultScale = (function () {
                        var sideMargin = 30,
                            maxWidth = window.innerWidth - (sideMargin * 2),
                            pageDefaultSizeWidth = pdfDocument.getDefaultPageSize().width;
                        if (maxWidth >= pageDefaultSizeWidth) {
                            return 1;
                        }
                        return PDFView.round(maxWidth / pageDefaultSizeWidth, 1 / 100);
                    })();
                // create the PDF view after successful loading;
                // the initial zoom factor is already set to 1.0
                this.pdfView = new PDFView(pdfDocument);
                // set default scale/zoom, according to device's viewport width
                this.pdfView.setPageZoom(defaultScale);
                // draw page nodes and apply css sizes
                _.times(pageCount, function (index) {
                    var jqPage = $('<div class="document-page">'),
                        pageSize = self.pdfView.getRealPageSize(index + 1);
                    pageContainer.append(jqPage.css(pageSize));
                });
                // set callbacks at this.pdfView to start rendering
                this.pdfView.setRenderCallbacks(getPagesToRender, getPageNode);
            }

            /**
             * Error handler for the PDF loading process.
             */
            function pdfDocumentLoadError() {
                console.error('Core.Viewer.DocumentView.load(): failed loading PDF document.', self.model.get('filename'));
            }

            // create the PDF document model
            this.pdfDocument = new PDFDocument(documentUrl);

            // wait for PDF document to finish loading
            $.when(this.pdfDocument.getLoadPromise()).then(pdfDocumentLoadSuccess.bind(this), pdfDocumentLoadError);

        },

        /**
         * Unloads an document slide by destroying the pdf view and model instances
         *
         */
        unload: function () {
            //console.warn('DocumentType.unload()', this.pdfView, this.pdfDocument);
            if (this.pdfView) {
                this.pdfView.destroy();
                this.pdfView = null;
            }
            if (this.pdfDocument) {
                this.pdfDocument.destroy();
                this.pdfDocument = null;
            }
        },

        /**
         * Destructor function of this view.
         *
         */
        disposeView: function () {
            //console.warn('DocumentView.disposeView()');
            this.unload();
        }

    });

    // returns an object which inherits BaseView
    return DocumentView;
});
