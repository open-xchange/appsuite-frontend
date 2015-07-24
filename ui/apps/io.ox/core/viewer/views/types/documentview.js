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
    'io.ox/core/viewer/views/document/thumbnailview',
    'io.ox/core/pdf/pdfdocument',
    'io.ox/core/pdf/pdfview',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core',
    'less!io.ox/core/pdf/pdfstyle'
], function (ActionsPattern, BaseView, ThumbnailView, PDFDocument, PDFView, Util, gt) {

    'use strict';

    var PDF_ERROR_NOTIFICATIONS = {
        general: gt('Sorry, there is no preview available for this file.'),
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
            // amount of page side margins in pixels
            this.PAGE_SIDE_MARGIN = _.device('desktop') ? 20 : 10;
            // magic module id to source map
            this.MODULE_SOURCE_MAP = {
                1: 'calendar',
                4: 'tasks',
                7: 'contacts'
            };
            // predefined zoom factors.
            // Limit zoom factor on iOS because of canvas size restrictions.
            // https://github.com/mozilla/pdf.js/issues/2439
            this.ZOOM_FACTORS = _.device('!desktop') ? [25, 35, 50, 75, 100] : [25, 35, 50, 75, 100, 125, 150, 200, 300, 400, 600, 800];
            // current zoom factor, defaults at 100%
            this.currentZoomFactor = 100;
            // defaults for fit zooms
            this.fitWidthZoomed = false;
            this.fitScreenZoomed = false;
            // the PDFView instance
            this.pdfView = null;
            // the PDFDocument instance
            this.pdfDocument = null;
            // a Deferred object indicating the load process of this document view.
            this.documentLoad = $.Deferred();
            // call view destroyer on viewer global dispose event
            this.on('dispose', this.disposeView.bind(this));
            // bind resize, zoom and close handler
            this.listenTo(this.viewerEvents, 'viewer:resize', this.onResize);
            this.listenTo(this.viewerEvents, 'viewer:zoom:in', _.bind(this.changeZoomLevel, this, 'increase'));
            this.listenTo(this.viewerEvents, 'viewer:zoom:out', _.bind(this.changeZoomLevel, this, 'decrease'));
            this.listenTo(this.viewerEvents, 'viewer:zoom:fitwidth', _.bind(this.changeZoomLevel, this, 'fitwidth'));
            this.listenTo(this.viewerEvents, 'viewer:zoom:fitheight', _.bind(this.changeZoomLevel, this, 'fitheight'));
            this.listenTo(this.viewerEvents, 'viewer:beforeclose', this.onBeforeClose);
            this.listenTo(this.viewerEvents, 'viewer:document:scrolltopage', this.onScrollToPage);
            this.listenTo(this.viewerEvents, 'viewer:document:next', this.onNextPage);
            this.listenTo(this.viewerEvents, 'viewer:document:previous', this.onPreviousPage);
            // create a debounced version of zoom function
            this.setZoomLevelDebounced = _.debounce(this.setZoomLevel.bind(this), 1000);
            // defaults
            this.currentDominantPageIndex = 1;
            this.numberOfPages = 1;
            this.disposed = null;
            // disable display flex styles, for pinch to zoom
            this.$el.addClass('swiper-slide-document');
            // wheter double tap zoom is already triggered
            this.doubleTapZoomed = false;
            // resume/suspend rendering if user switched to other apps
            this.listenTo(ox, 'app:resume app:init', function (app) {
                if (!this.pdfView) {
                    return;
                }
                if (app.getName() === 'io.ox/files/detail') {
                    this.pdfView.resumeRendering();
                } else {
                    this.pdfView.suspendRendering();
                }
            });
        },

        /**
         * Tap event handler.
         * - zooms documents a step in and out in case of a double tap.
         *
         * @param {jQuery.Event} event
         *  The jQuery event object.
         *
         * @param {Number} taps
         *  The count of taps, indicating a single or double tap.
         */
        onTap: function (event, tapCount) {
            if (tapCount === 2) {
                if (this.doubleTapZoomed) {
                    this.changeZoomLevel('fitheight');
                } else {
                    this.changeZoomLevel('original');
                }
                this.doubleTapZoomed = !this.doubleTapZoomed;
            }
        },

        /**
         * Handles pinch events.
         *
         * @param {String} phase
         * The current pinch phase ('start', 'move', 'end' or 'cancel')
         *
         * @param {jQuery.Event} event
         *  The jQuery tracking event.
         *
         * @param {Number} distance
         * The current distance in px between the two fingers
         *
         * @param {Point} midPoint
         * The current center position between the two fingers
         */
        onPinch: (function () {
            var startDistance,
                moveDelta,
                transformScale,
                zoomFactor,
                transformOriginX,
                transformOriginY;

            return function pinchHandler(phase, event, distance, midPoint) {
                switch (phase) {
                    case 'start':
                        startDistance = distance;
                        break;
                    case 'move':
                        moveDelta = distance - startDistance;
                        transformScale = distance / startDistance;
                        transformOriginX = midPoint.x + this.$el.scrollLeft();
                        transformOriginY = midPoint.y + this.$el.scrollTop();
                        this.documentContainer.css({
                            'transform-origin': transformOriginX + 'px ' + transformOriginY + 'px',
                            'transform': 'scale(' + transformScale + ')'
                        });
                        break;
                    case 'end':
                        zoomFactor = transformScale * this.currentZoomFactor;
                        zoomFactor = Util.minMax(zoomFactor, this.getMinZoomFactor(), this.getMaxZoomFactor());
                        this.setZoomLevel(zoomFactor);
                        this.documentContainer.removeAttr('style');
                        break;
                    case 'cancel':
                        this.documentContainer.removeAttr('style');
                        break;
                    default:
                        break;
                }
            };
        })(),

        /**
         * Scroll-to-page handler:
         * - scrolls to the desired page number.
         * @param {Number} pageNumber
         */
        onScrollToPage: function (pageNumber) {
            if (this.isVisible() && _.isNumber(pageNumber) && pageNumber > 0 && pageNumber <= this.pages.length) {
                var targetPageNode = this.documentContainer.find('.document-page[data-page=' + pageNumber + ']');
                if (targetPageNode.length !== 0) {
                    var targetScrollTop = targetPageNode[0].offsetTop - this.PAGE_SIDE_MARGIN;
                    this.$el.scrollTop(targetScrollTop);
                    this.viewerEvents.trigger('viewer:document:pagechange', pageNumber);
                }
            }
        },

        /**
         * Next page handler:
         * - scrolls to the next page
         *
         * @param {Number} pageNumber
         */
        onNextPage: function () {
            var nextPage = this.getDominantPage() + 1;
            this.onScrollToPage(nextPage);
        },

        /**
         * Previous page handler:
         * - scrolls to the previous page
         *
         * @param {Number} pageNumber
         */
        onPreviousPage: function () {
            var previousPage = this.getDominantPage() - 1;
            this.onScrollToPage(previousPage);
        },

        /**
         * Viewer before close handler:
         * - saves the scroll position of the document.
         */
        onBeforeClose: function () {
            if (this.isVisible()) {
                var fileId = this.model.get('id'),
                    fileScrollPosition = this.$el.scrollTop();
                this.setInitialScrollPosition(fileId, fileScrollPosition);
            }
        },

        /**
         *  Scroll event handler:
         *  -shows the current page in the caption on scroll.
         *  -blends in navigation controls.
         *  -selects the corresponding thumbnail in the thumbnail pane.
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
                this.viewerEvents.trigger('viewer:blendcaption', gt('Page %1$d of %2$d', this.currentDominantPageIndex, this.numberOfPages))
                    .trigger('viewer:document:selectthumbnail', this.currentDominantPageIndex)
                    .trigger('viewer:document:pagechange', this.currentDominantPageIndex);
            }
            this.viewerEvents.trigger('viewer:blendnavigation');
        },

        /**
         * Creates and renders an document slide.
         *
         * @returns {DocumentView}
         *  the DocumentView instance.
         */
        render: function () {
            this.documentContainer = $('<div class="document-container io-ox-core-pdf">');
            this.documentContainer.enableTouch({
                tapHandler: this.onTap.bind(this),
                pinchHandler: this.onPinch.bind(this)
            });
            this.$el.empty().append(this.documentContainer);
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
                    slideMiddle = self.$el.innerHeight() / 2;
                if ((pageBounds.top + tolerance <= slideMiddle) &&
                    (pageBounds.bottom - tolerance >= slideMiddle)) {
                    dominantPageIndex = index;
                }
            });
            return dominantPageIndex || visiblePages[0];
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
            var documentContainer = this.documentContainer,
                convertParams = Util.getConvertParams(this.model),
                documentUrl = Util.getConverterUrl(convertParams);

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
                return (_.isNumber(pageNumber) && (pageNumber >= 1)) ? documentContainer.children().eq(pageNumber - 1) : null;
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
                //console.warn('DocumentView.pdfDocumentLoadSuccess()', convertData);
                var pdfDocument = this.pdfDocument,
                    self = this;
                // create the PDF view after successful loading
                this.pdfView = new PDFView(pdfDocument, { textOverlay: true });
                // draw page nodes and apply css sizes
                _.times(pageCount, function (index) {
                    var documentPage = $('<div class="document-page">'),
                        pageSize = self.pdfView.getRealPageSize(index + 1);
                    documentPage.attr('data-page', index + 1);
                    documentContainer.append(documentPage.attr(pageSize).css(pageSize));
                });
                // save values to the view instance, for performance
                this.numberOfPages = pageCount;
                this.pages = this.$el.find('.document-page');
                // set callbacks at this.pdfView to start rendering
                var renderCallbacks = {
                    getVisiblePageNumbers: this.getPagesToRender.bind(this),
                    getPageNode: getPageNode,
                    beginRendering: beginPageRendering,
                    endRendering: endPageRendering.bind(this)
                };
                this.pdfView.setRenderCallbacks(renderCallbacks);
                // disable slide swiping per default on documents
                this.$el.addClass('swiper-no-swiping');
                this.$el.on('scroll', _.debounce(this.onScrollHandler.bind(this), 500));
                // set scale/zoom and scroll position, with stored or default values
                var zoomLevel = this.getInitialZoomLevel(this.model.get('id')) || this.getDefaultZoomFactor();
                this.setZoomLevel(zoomLevel);
                var lastScrollPosition = this.getInitialScrollPosition(this.model.get('id'));
                if (lastScrollPosition) {
                    this.$el.scrollTop(lastScrollPosition);
                }
                // select/highlight the corresponding thumbnail according to displayed document page
                this.viewerEvents.trigger('viewer:document:selectthumbnail', this.getDominantPage())
                    .trigger('viewer:document:loaded')
                    .trigger('viewer:document:pagechange', this.getDominantPage(), pageCount);
                this.$el.removeClass('io-ox-busy');
                // resolve the document load Deferred: thsi document view is fully loaded.
                this.documentLoad.resolve();
            }

            /**
             * Error handler for the PDF loading process.
             */
            function pdfDocumentLoadError(response) {
                console.warn('Core.Viewer.DocumentView.show(): failed loading PDF document. Cause: ', response.cause);
                var notificationText = PDF_ERROR_NOTIFICATIONS[response.cause] || PDF_ERROR_NOTIFICATIONS.general,
                    notificationIconClass;
                if (response.cause === 'passwordProtected') {
                    notificationIconClass = 'fa-lock';
                }
                this.displayNotification(notificationText, notificationIconClass);
                // resolve the document load Deferred: thsi document view is fully loaded.
                this.documentLoad.reject();
            }

            // create a pdf document object with the document PDF url
            this.pdfDocument = new PDFDocument(documentUrl);

            // display loading animation
            this.$el.addClass('io-ox-busy');

            // wait for PDF document to finish loading
            $.when(this.pdfDocument.getLoadPromise()).then(
                pdfDocumentLoadSuccess.bind(this),
                pdfDocumentLoadError.bind(this)
            );
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
         * Calculates the 'fit to width' or 'fit to height' zoom factor of this document.
         *
         * @params {String} mode
         *  the desired mode, supported: 'fitwidth' or 'fitheight'
         *
         * @returns {Number} zoom factor = 100
         */
        getModeZoomFactor: function (mode) {
            var offset = 40,
                slideWidth = this.$el.width(),
                slideHeight = this.$el.height(),
                originalPageSize = this.pdfDocument.getOriginalPageSize(),
                fitWidthZoomFactor = (slideWidth - offset) / originalPageSize.width * 100,
                fitHeightZoomFactor = (slideHeight - offset) / originalPageSize.height * 100,
                modeZoomFactor = 100;
            switch (mode) {
                case 'fitwidth':
                    modeZoomFactor = fitWidthZoomFactor;
                    break;
                case 'fitheight':
                    modeZoomFactor = Math.min(fitWidthZoomFactor, fitHeightZoomFactor);
                    break;
                default:
                    break;
            }
            return Math.round(modeZoomFactor);
        },

        /**
         *  Changes the zoom level of a document.
         *
         * @param {String} action
         *  Supported values: 'increase', 'decrease', 'fitheight','fitwidth' and 'original'.
         */
        changeZoomLevel: function (action) {
            if (this.isVisible()) {
                this.pdfDocument.getLoadPromise().done(function () {
                    var currentZoomFactor = this.currentZoomFactor,
                        nextZoomFactor;
                    // search for next bigger/smaller zoom factor in the avaliable zoom factors
                    switch (action) {
                        case 'increase':
                            nextZoomFactor = _.find(this.ZOOM_FACTORS, function (factor) {
                                    return factor > currentZoomFactor;
                                }) || this.getMaxZoomFactor();
                            this.resetFitZoom();
                            break;
                        case 'decrease':
                            var lastIndex = _.findLastIndex(this.ZOOM_FACTORS, function (factor) {
                                return factor < currentZoomFactor;
                            });
                            nextZoomFactor = this.ZOOM_FACTORS[lastIndex] || this.getMinZoomFactor();
                            this.resetFitZoom();
                            break;
                        case 'fitwidth':
                            this.fitScreenZoomed = false;
                            this.fitWidthZoomed = true;
                            nextZoomFactor = this.getModeZoomFactor('fitwidth');
                            break;
                        case 'fitheight':
                            this.fitWidthZoomed = false;
                            this.fitScreenZoomed = true;
                            nextZoomFactor = this.getModeZoomFactor('fitheight');
                            break;
                        case 'original':
                            nextZoomFactor = 100;
                            this.resetFitZoom();
                            break;
                        default:
                            return;
                    }
                    // apply zoom level
                    this.setZoomLevel(nextZoomFactor);
                }.bind(this));
            }
        },

        /**
         * Resets fit to height/screen size zoom state.
         */
        resetFitZoom: function () {
            this.fitScreenZoomed = false;
            this.fitWidthZoomed = false;
        },

        /**
         * Applies passed zoom level to the document.
         *
         * @param {Number} zoomLevel
         *  zoom level numbers between 25 and 800 (supported zoom factors)
         */
        setZoomLevel: function (zoomLevel) {
            if (!_.isNumber(zoomLevel) || !this.pdfView || !this.isVisible ||
                (zoomLevel < this.getMinZoomFactor()) || (zoomLevel > this.getMaxZoomFactor())) {
                return;
            }
            var pdfView = this.pdfView,
                documentTopPosition = this.$el.scrollTop(),
                documentLeftPosition = this.$el.scrollLeft(),
                pageMarginHeight = 20,
                pageMarginCount = this.getDominantPage() - 1,
                pageMarginTotal = pageMarginHeight * pageMarginCount,
                pagesHeightBeforeZoom = documentTopPosition - pageMarginTotal;
            // set page zoom to all pages and apply the new size to all page wrappers
            pdfView.setPageZoom(zoomLevel / 100);
            var currentPage = this.getDominantPage(),
                pageSizeAfterZoom = pdfView.getRealPageSize(currentPage);
            this.pages.css(pageSizeAfterZoom);
            // adjust document scroll position according to new zoom
            var pagesHeightAfterZoom = pagesHeightBeforeZoom * zoomLevel / this.currentZoomFactor,
                scrollTopAfterZoom = pagesHeightAfterZoom + pageMarginTotal,
                scrollLeftAfterZoom = documentLeftPosition * zoomLevel / this.currentZoomFactor;
            this.$el.scrollTop(scrollTopAfterZoom);
            this.$el.scrollLeft(scrollLeftAfterZoom);
            // save new zoom level to view
            this.currentZoomFactor = zoomLevel;
            this.setInitialZoomLevel(this.model.get('id'), zoomLevel);
            // blend zoom caption
            this.viewerEvents.trigger('viewer:blendcaption', Math.round(zoomLevel) + ' %');
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
                    var zoomFactor = this.getDefaultZoomFactor();
                    if (this.fitWidthZoomed) {
                        zoomFactor = this.getModeZoomFactor('fitwidth');
                    }
                    if (this.fitScreenZoomed) {
                        zoomFactor = this.getModeZoomFactor('fitheight');
                    }
                    this.setZoomLevelDebounced(zoomFactor);
                }
            }.bind(this));
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            this.unload(true);
            this.$el.off();
            if (this.thumbnailsView) {
                this.thumbnailsView.disposeView();
            }
        }

    });

    // returns an object which inherits BaseView
    return DocumentView;
});
