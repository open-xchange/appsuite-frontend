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
    'gettext!io.ox/core'
], function (ActionsPattern, BaseView, PDFDocument, PDFView, Util, gt) {

    'use strict';

    // define actions for zoom buttons in the toolbar
    var TOOLBAR_ACTION_ID = 'io.ox/core/viewer/actions/toolbar',
        Action = ActionsPattern.Action;

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
            // define meta objects for zoom links creation in the toolbar
            this.linksMeta = {
                'zoomin': {
                    prio: 'hi',
                    mobile: 'hi',
                    icon: 'fa fa-search-plus',
                    ref: TOOLBAR_ACTION_ID + '/zoomin',
                    customize: function () {
                        this.addClass('viewer-toolbar-zoomin').attr({
                            tabindex: '1',
                            title: gt('Zoom in'),
                            'aria-label': gt('Zoom in')
                        });
                    }
                },
                'zoomout': {
                    prio: 'hi',
                    mobile: 'hi',
                    icon: 'fa fa-search-minus',
                    ref: TOOLBAR_ACTION_ID + '/zoomout',
                    customize: function () {
                        this.addClass('viewer-toolbar-zoomout').attr({
                            tabindex: '1',
                            title: gt('Zoom out'),
                            'aria-label': gt('Zoom out')
                        });
                    }
                }
            };
            // define actions for the zoom function
            this.zoomInAction = new Action(TOOLBAR_ACTION_ID + '/zoomin', {
                id: 'zoomin',
                action: this.zoomIn
            });
            this.zoomOutAction = new Action(TOOLBAR_ACTION_ID + '/zoomout', {
                id: 'zoomout',
                action: this.zoomOut
            });
        },

        /**
         * Creates and renders an Image slide.
         *
         * @returns {DocumentView}
         *  the DocumentView instance.
         */
        render: function () {
            //console.warn('DocumentView.render()', this.model.get('filename'));
            var pageContainer = $('<div class="document-container">');

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
                var pdfDocument = this.pdfDocument;
                // create the PDF view after successful loading;
                // the initial zoom factor is already set to 1.0
                this.pdfView = new PDFView(pdfDocument);
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
                pageContainer.idle();
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
                .always(pdfDocumentLoadFinished);

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
                pageDefaultSizeWidth = this.pdfDocument.getDefaultPageSize().width;
            if (maxWidth >= pageDefaultSizeWidth) {
                return 1;
            }
            return PDFView.round(maxWidth / pageDefaultSizeWidth, 1 / 100);
        },

        /**
         * Zooms in of a document.
         */
        zoomIn: function () {
            //console.warn('DocumentView.zoomIn()');
        },

        /**
         * Zooms in of the document.
         */
        zoomOut: function () {
            //console.warn('DocumentView.zoomIn()');
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
            this.zoomInAction = null;
            this.zoomOutAction = null;
        }

    });

    // returns an object which inherits BaseView
    return DocumentView;
});
