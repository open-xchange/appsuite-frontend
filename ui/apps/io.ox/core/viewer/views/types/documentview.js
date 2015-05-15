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
    'gettext!io.ox/core',
    'less!io.ox/core/pdf/pdfstyle'
], function (ActionsPattern, BaseView, PDFDocument, PDFView, Util, gt) {

    'use strict';

    var PDF_ERROR_NOTIFICATIONS = {
        default: gt('Sorry, there is no preview available for this file.'),
        passwordProtected: gt('This document is password protected and cannot be displayed. Please open it with your local PDF viewer.')
    };

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

        initialize: function (options) {
            _.extend(this, options);
            //The name of the document converter server module.
            this.CONVERTER_MODULE_NAME = 'oxodocumentconverter';
            // amount of page side margins in pixels
            this.PAGE_SIDE_MARGIN = _.device('desktop') ? 30 : 15;
            // magic module id to source map
            this.MODULE_SOURCE_MAP = {
                1: 'calendar',
                4: 'tasks',
                7: 'contacts'
            };
            // predefined zoom factors.
            // Limit zoom factor on iOS because of canvas size restrictions.
            // https://github.com/mozilla/pdf.js/issues/2439
            this.ZOOM_FACTORS = _.device('iOS') ? [25, 35, 50, 75, 100] : [25, 35, 50, 75, 100, 125, 150, 200, 300, 400, 600, 800];
            // current zoom factor, defaults at 100%
            this.currentZoomFactor = 100;
            // the PDFView instance
            this.pdfView = null;
            // the PDFDocument instance
            this.pdfDocument = null;
            // a Deferred object indicating the load process of this document view.
            this.documentLoad = $.Deferred();
            // call view destroyer on viewer global dispose event
            this.on('dispose', this.disposeView.bind(this));
            // bind zoom handlers
            this.listenTo(this.displayerEvents, 'viewer:resize', this.onResize);
            // bind zoom handlers
            this.listenTo(this.displayerEvents, 'viewer:zoomin', this.onZoomIn);
            this.listenTo(this.displayerEvents, 'viewer:zoomout', this.onZoomOut);
            // bind scroll event for showing current page number
            this.$el.on('scroll', _.throttle(this.onScrollHandler.bind(this), 500));
            // create a debounced version of zoom function
            this.setZoomLevelDebounced = _.debounce(this.setZoomLevel.bind(this), 1000);
            // defaults
            this.currentDominantPageIndex = 1;
            this.numberOfPages = 1;
            this.disposed = null;
        },

        /**
         *  Scroll event handler:
         *  -shows the current page in the caption on scroll.
         *  -blends in navigation controls.
         */
        onScrollHandler: function () {
            var currentDominantPageIndex = this.currentDominantPageIndex,
                newDominantPageIndex = this.getDominantPage();
            if (!newDominantPageIndex) {
                return;
            }
            if (currentDominantPageIndex !== newDominantPageIndex) {
                this.currentDominantPageIndex = newDominantPageIndex;
                //#. text of a viewer document page caption
                //#. Example result: "Page 5 of 10"
                //#. %1$d is the current page index
                //#. %2$d is the total number of pages
                this.displayerEvents.trigger('viewer:blendcaption', gt('Page %1$d of %2$d', this.currentDominantPageIndex, this.numberOfPages));
                this.displayerEvents.trigger('viewer:blendnavigation');
            }
        },

        /**
         * Creates and renders an Image slide.
         *
         * @returns {DocumentView}
         *  the DocumentView instance.
         */
        render: function () {
            this.pageContainer = $('<div class="document-container io-ox-core-pdf">');
            this.$el.empty().append(this.pageContainer);
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
            return this;
        },

        /**
         * Approximation of the 'dominant' page: the best page to be shown
         * in the slide caption. The page which cuts the center of the viewport
         * with a tolerance offset will be chosen.
         *
         * @returns {Number | null} dominantPageIndex
         *  the page index of null if no page is found
         */
        getDominantPage: function () {
            var visiblePages = this.getPagesToRender(),
                tolerance = this.currentZoomFactor / 2,
                dominantPageIndex = null,
                self = this;
            visiblePages.forEach(function (index) {
                var pageBounds = self.pages[index - 1].getBoundingClientRect(),
                    screenMiddle = self.pageContainer.innerHeight() / 2;
                if ((pageBounds.top + tolerance <= screenMiddle) &&
                    (pageBounds.bottom - tolerance >= screenMiddle)) {
                    dominantPageIndex = index;
                }
            });
            return dominantPageIndex;
        },

        /**
         * Calculates document page numbers to render depending on visilbility of the pages
         * in the viewport (window).
         *
         * @returns {Array} pagesToRender
         *  an array of page numbers which should be rendered.
         */
        getPagesToRender: function () {
            var pagesToRender = [];
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
            _.each(this.pages, function (element, index) {
                if (!isPageVisible(element)) { return; }
                pagesToRender.push(index + 1);
            });
            return pagesToRender;
        },

        /**
         * "Shows" the document (Office, PDF) with the PDF.js library.
         *
         * @returns {DocumentView}
         *  the DocumentView instance.
         */
        show: function () {
            // ignore already loaded documents
            if (this.$el.find('.document-page').length > 0) {
                return;
            }
            var pageContainer = this.$el.find('.document-container'),
                convertParams = this.getConvertParams(this.model.get('source')),
                documentUrl = Util.getServerModuleUrl(this.CONVERTER_MODULE_NAME, convertParams);

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
            function beginPageRendering(/*pageNumbers*/) {
                //console.log('Begin PDF rendering: ' + pageNumbers);
            }

            /**
             * Gets called just after pages are rendered.
             *
             * @param pageNumbers
             *  The array of 1-based page numbers that have been rendered
             */
            function endPageRendering(/*pageNumbers*/) {
                //console.log('End PDF rendering: ' + pageNumbers);
            }

            /**
             * Success handler for the PDF loading process.
             *
             * @param {Number} pageCount
             *  page count of the pdf document delivered by the PDF.js library.
             */
            function pdfDocumentLoadSuccess(pageCount) {
                // do nothing and quit if a document is already disposed.
                if (this.disposed || !this.pdfDocument) {
                    return;
                }
                // forward 'resolved' errors to error handler
                if (_.isObject(pageCount) && (pageCount.cause.length > 0)) {
                    pdfDocumentLoadError.call(this, pageCount);
                    return;
                }
                var pdfDocument = this.pdfDocument,
                    defaultScale = this.getDefaultScale(),
                    self = this;
                // create the PDF view after successful loading;
                // the initial zoom factor is already set to 1.0
                this.pdfView = new PDFView(pdfDocument, { textOverlay: true });
                // set default scale/zoom, according to device's viewport width
                this.pdfView.setPageZoom(defaultScale);
                //// draw page nodes and apply css sizes
                _.times(pageCount, function (index) {
                    var jqPage = $('<div class="document-page">'),
                        pageSize = self.pdfView.getRealPageSize(index + 1);
                    pageContainer.append(jqPage.attr(pageSize).css(pageSize));
                });
                // save values to the view instance, for performance
                this.numberOfPages = pageCount;
                this.pages = this.$el.find('.document-page');
                // set callbacks at this.pdfView to start rendering
                var renderCallbacks = {
                    getVisiblePageNumbers: this.getPagesToRender.bind(this),
                    getPageNode: getPageNode,
                    beginRendering: beginPageRendering,
                    endRendering: endPageRendering
                };

                this.pdfView.setRenderCallbacks(renderCallbacks);
                // disable slide swiping per default on documents
                this.$el.addClass('swiper-no-swiping');
                // resolve the document load Deferred: thsi document view is fully loaded.
                this.documentLoad.resolve();
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
            function pdfDocumentLoadError(pageCount) {
                console.warn('Core.Viewer.DocumentView.show(): failed loading PDF document. Cause: ', pageCount.cause);
                var notificationText = PDF_ERROR_NOTIFICATIONS[pageCount.cause || 'default'],
                    notificationIconClass;
                if (pageCount.cause === 'passwordProtected') {
                    notificationIconClass = 'fa-lock';
                }
                this.displayNotification(notificationText, notificationIconClass);
                // resolve the document load Deferred: thsi document view is fully loaded.
                this.documentLoad.reject();
            }

            this.pdfDocument = new PDFDocument(documentUrl);
            // display loading animation
            pageContainer.busy();

            // wait for PDF document to finish loading
            $.when(this.pdfDocument.getLoadPromise())
                .then(pdfDocumentLoadSuccess.bind(this), pdfDocumentLoadError.bind(this))
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
            var maxWidth = this.$el.innerWidth() - (this.PAGE_SIDE_MARGIN * 2),
                pageDefaultSize = this.pdfDocument && this.pdfDocument.getDefaultPageSize(),
                pageDefaultWidth = pageDefaultSize && pageDefaultSize.width;

            if ((!pageDefaultWidth) || (maxWidth >= pageDefaultWidth)) {
                return 1;
            }
            return PDFView.round(maxWidth / pageDefaultWidth, 1 / 100);
        },

        /**
         * Returns default zoom factor of this document, after it's initially displayed
         * in the viewport.
         * @returns {Number} zoom factor
         */
        getDefaultZoomFactor: function () {
            return this.getDefaultScale() * 100;
        },

        /**
         * Zooms in of a document.
         */
        onZoomIn: function () {
            if (this.isVisible()) {
                this.pdfDocument.getLoadPromise().done(this.changeZoomLevel.bind(this, 'increase'));
                this.displayerEvents.trigger('viewer:blendcaption', this.currentZoomFactor + ' %');
            }
        },

        /**
         * Zooms out of the document.
         */
        onZoomOut: function () {
            if (this.isVisible()) {
                this.pdfDocument.getLoadPromise().done(this.changeZoomLevel.bind(this, 'decrease'));
                this.displayerEvents.trigger('viewer:blendcaption', this.currentZoomFactor + ' %');
            }
        },

        /**
         *  Changes the zoom level of a document.
         *
         * @param {String} action
         *  Supported values: 'increase' or 'decrease'.
         */
        changeZoomLevel: function (action) {
            var currentZoomFactor = this.currentZoomFactor,
                nextZoomFactor;
            // search for next bigger/smaller zoom factor in the avaliable zoom factors
            switch (action) {
                case 'increase':
                    nextZoomFactor = _.find(this.ZOOM_FACTORS, function (factor) {
                        return factor > currentZoomFactor;
                    }) || this.getMaxZoomFactor();
                    break;
                case 'decrease':
                    var lastIndex = _.findLastIndex(this.ZOOM_FACTORS, function (factor) {
                        return factor < currentZoomFactor;
                    });
                    nextZoomFactor = this.ZOOM_FACTORS[lastIndex] || this.getMinZoomFactor();
                    break;
                default:
                    return;
            }
            // apply zoom level
            this.setZoomLevel(nextZoomFactor);
        },

        /**
         * Applies passed zoom level to the document.
         *
         * @param {Number} zoomLevel
         *  zoom level numbers between 25 and 800 (supported zoom factors)
         */
        setZoomLevel: function (zoomLevel) {
            if (!_.isNumber(zoomLevel) || !this.pdfView || !this.isVisible ||
                (zoomLevel === this.currentZoomFactor) ||
                (zoomLevel < this.getMinZoomFactor()) || (zoomLevel > this.getMaxZoomFactor())) {
                return;
            }
            var pdfView = this.pdfView,
                documentTopPosition = this.$el.scrollTop();
            _.each(this.pages, function (page, pageIndex) {
                pdfView.setPageZoom(zoomLevel / 100, pageIndex + 1);
                var realPageSize = pdfView.getRealPageSize(pageIndex + 1);
                $(page).css(realPageSize);
            });
            // adjust document scroll position according to new zoom
            this.$el.scrollTop(documentTopPosition * zoomLevel / this.currentZoomFactor);
            // save new zoom level to view
            this.currentZoomFactor = zoomLevel;
        },

        /**
         *  Gets the maximum zoom factor of a document.
         */
        getMaxZoomFactor: function () {
            return _.last(this.ZOOM_FACTORS);
        },

        /**
         *  Gets the minimum zoom factor of a document.
         */
        getMinZoomFactor: function () {
            return _.first(this.ZOOM_FACTORS);
        },

        /**
         *  Build necessary params for the document conversion to PDF.
         *  Also adds proprietary properties of Mail and PIM attachment objects.
         *
         *  @param {String} source
         *   the source of the file model.
         */
        getConvertParams: function (source) {
            var originalModel = this.model.get('origData'),
                defaultParams = {
                    action: 'getdocument',
                    filename: encodeURIComponent(this.model.get('filename')),
                    id: encodeURIComponent(this.model.get('id')),
                    folder_id: encodeURIComponent(this.model.get('folder_id')),
                    documentformat: 'pdf',
                    priority: 'instant',
                    mimetype: encodeURIComponent(this.model.get('file_mimetype')),
                    nocache: _.uniqueId() // needed to trick the browser
                },
                paramExtension;
            switch (source) {
                case 'mail':
                    paramExtension = {
                        id: originalModel.mail.id,
                        source: 'mail',
                        attached: this.model.get('id')
                    };
                    break;
                case 'pim':
                    var moduleId = this.model.get('module');
                    paramExtension = {
                        source: this.MODULE_SOURCE_MAP[moduleId],
                        attached: originalModel.attached,
                        module: moduleId
                    };
                    break;
                default:
                    return defaultParams;
            }
            return _.extend(defaultParams, paramExtension);
        },

        /**
         * Unloads the document slide by destroying the pdf view and model instances
         *
         * @param {Boolean} dispose
         *  If true also Swiper slide duplicates will be unloaded.
         */
        unload: function (dispose) {

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
                // save disposed status
                this.disposed = dispose;
            }

            return this;
        },

        /**
         * Resize handler of the document view.
         * - calculates and sets a new initial zoom factor
         */
        onResize: function () {
            this.documentLoad.done(function () {
                if (this.isVisible) {
                    var defaultZoomFactor = this.getDefaultZoomFactor();
                    this.setZoomLevelDebounced(defaultZoomFactor);
                }
            }.bind(this));
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            this.unload(true);
            this.$el.off();
        }

    });

    // returns an object which inherits BaseView
    return DocumentView;
});
