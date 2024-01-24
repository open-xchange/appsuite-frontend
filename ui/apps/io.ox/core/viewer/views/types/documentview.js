/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/viewer/views/types/documentview', [
    'io.ox/core/viewer/views/types/baseview',
    'io.ox/core/viewer/views/document/thumbnailview',
    'io.ox/core/pdf/pdfdocument',
    'io.ox/core/pdf/pdfview',
    'io.ox/core/tk/doc-converter-utils',
    'io.ox/core/tk/doc-utils/pageloader',
    'io.ox/core/pdf/pdfviewerlinkservice',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core',
    'less!io.ox/core/pdf/pdfstyle'
], function (BaseView, ThumbnailView, PDFDocument, PDFView, DocConverterUtils, PageLoader, PDFViewerLinkService, Util, gt) {

    'use strict';

    // defines how many pages are loaded before and after the visible pages
    var NON_VISIBLE_PAGES_TO_LOAD_BESIDE = 1;

    /**
     * The document file type. Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function render();
     *    function prefetch();
     *    function show();
     *    function unload();
     * }
     *
     */
    var DocumentView =  BaseView.extend({

        initialize: function (options) {

            Util.logPerformanceTimer('DocumentView:initialize');

            _.extend(this, options);
            // amount of page side margins in pixels
            this.PAGE_SIDE_MARGIN = _.device('desktop') ? 20 : 10;
            // predefined zoom factors.
            // iOS Limits are handled by pdfview.js
            this.ZOOM_FACTORS = [25, 35, 50, 75, 100, 125, 150, 200, 300, 400, 600, 800];
            // current zoom factor, defaults at 100%
            this.currentZoomFactor = 100;
            // defaults for fit zooms
            this.fitWidthZoomed = false;
            this.fitScreenZoomed = false;
            // the PDFView instance
            this.pdfView = null;
            // the PDFDocument instance
            this.pdfDocument = null;
            // the PDF page rendering queue
            this.pageLoader = null;
            // a Deferred object indicating the load process of this document view.
            this.documentLoad = $.Deferred();
            // all page nodes with contents, keyed by one-based page number
            this.loadedPageNodes = [];
            // the timer that loads more pages above and below the visible ones
            this.loadMorePagesTimerId = null;
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
            this.listenTo(this.viewerEvents, 'viewer:document:first', this.onFirstPage);
            this.listenTo(this.viewerEvents, 'viewer:document:last', this.onLastPage);
            this.listenTo(this.viewerEvents, 'viewer:document:print', this.onPrint);
            // create a debounced version of zoom function
            this.setZoomLevelDebounced = _.debounce(this.setZoomLevel.bind(this), 1000);
            // create a debounced version of refresh function
            this.refreshDebounced = _.debounce(this.refresh.bind(this), 500);
            // defaults
            this.currentDominantPageIndex = 1;
            this.numberOfPages = 1;
            this.disposed = null;
            // disable display flex styles, for pinch to zoom
            this.$el.addClass('swiper-slide-document');
            // whether double tap zoom is already triggered
            this.doubleTapZoomed = false;
            // indicates if the document was prefetched
            this.isPrefetched = false;
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
         *
         * @param {Number} pageNumber
         *  The 1-based page number.
         */
        onScrollToPage: function (pageNumber) {
            if (this.isVisible()) {
                var targetPageNode = this.getPageNode(pageNumber);

                if (targetPageNode.length > 0) {
                    var targetScrollTop = targetPageNode[0].offsetTop - this.PAGE_SIDE_MARGIN;
                    this.$el.scrollTop(targetScrollTop);
                    this.viewerEvents.trigger('viewer:document:pagechange', pageNumber);
                }
            }
        },

        /**
         * Next page handler:
         * - scrolls to the next page
         */
        onNextPage: function () {
            var nextPage = this.getDominantPage() + 1;
            this.onScrollToPage(nextPage);
        },

        /**
         * Previous page handler:
         * - scrolls to the previous page
         */
        onPreviousPage: function () {
            var previousPage = this.getDominantPage() - 1;
            this.onScrollToPage(previousPage);
        },

        /**
         * First page handler:
         * - scrolls to the first page
         */
        onFirstPage: function () {
            this.onScrollToPage(1);
        },

        /**
         * Last page handler:
         * - scrolls to the last page
         */
        onLastPage: function () {
            if (this.numberOfPages > 0) {
                this.onScrollToPage(this.numberOfPages);
            }
        },

        /**
         * Print handler:
         * - opens the document in a new browser tab
         */
        onPrint: function () {
            // can't use print action because it needs the ToolbarVIew as context to function
            var documentUrl = DocConverterUtils.getEncodedConverterUrl(this.model);
            window.open(documentUrl, '_blank');
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
         * Scroll event handler:
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

            this.loadVisiblePages();
            this.viewerEvents.trigger('viewer:blendnavigation');
        },

        /**
         * Loads all pages that are currently visible in the DocumentView plus
         * one page before the visible pages and one page after the visible pages;
         * the non visible pages are loaded with lower priority, if necessary.
         */
        loadVisiblePages: function () {
            this.documentLoad.done(function () {

                Util.logPerformanceTimer('DocumentView:loadVisiblePages');

                var pagesToRender = this.getPagesToRender();
                var beginPageNumber = _.first(pagesToRender);
                var endPageNumber = _.last(pagesToRender);

                // fail safety: do nothing if called while view is hidden (e.g. scroll handlers)
                if (this.isVisible()) {
                    // abort old requests not yet running
                    this.pageLoader.abortQueuedRequests();
                    this.cancelMorePagesTimer();

                    // load visible pages with high priority
                    _.each(pagesToRender, function (pageNumber) {
                        this.loadPage(pageNumber, 'high');
                    }, this);

                    // load the invisible pages above and below the visible area with medium priority after a short delay
                    this.loadMorePagesTimerId = window.setTimeout(function () {
                        for (var i = 1; i <= NON_VISIBLE_PAGES_TO_LOAD_BESIDE; i++) {
                            // pages before the visible pages
                            if ((beginPageNumber - i) > 0) {
                                this.loadPage(beginPageNumber - i, 'medium');
                            }
                            // pages after the visible pages
                            if ((endPageNumber + i) <= this.numberOfPages) {
                                this.loadPage(endPageNumber + i, 'medium');
                            }
                        }
                    }.bind(this), 50);

                    // clear all other pages
                    _.each(this.loadedPageNodes, function (pageNode, pageNumber) {
                        if ((pageNumber < (beginPageNumber - NON_VISIBLE_PAGES_TO_LOAD_BESIDE)) || (pageNumber > (endPageNumber + NON_VISIBLE_PAGES_TO_LOAD_BESIDE))) {
                            this.emptyPageNode(pageNode);
                            delete this.loadedPageNodes[pageNumber];
                        }
                    }, this);
                }

            }.bind(this));

        },

        /**
         * Loads the specified page, and stores the original page size at the
         * page node.
         *
         * @param {Number} pageNumber
         *  The 1-based page number.
         *
         * @param {String} priority
         *  The priority to load the page with.
         *  Supported are 'high', 'medium' and 'low'.
         */
        loadPage: function (pageNumber, priority) {
            var // the page node of the specified page
                pageNode = this.getPageNode(pageNumber),
                // the page load options
                options = {
                    format: 'pdf',
                    priority: priority,
                    pageZoom: this.currentZoomFactor / 100
                };

            // do not load correctly initialized page again
            if (pageNode.children().length === 0) {
                // format 'pdf' is rendered via the PDF.js library onto HTML5 canvas elements
                this.pageLoader.loadPage(pageNode, pageNumber, options).done(function () {
                    this.loadedPageNodes[pageNumber] = pageNode;
                    this.refresh(pageNumber);

                }.bind(this)).fail(function () {
                    pageNode.append($('<div>').addClass('error-message').text(gt('Sorry, this page is not available at the moment.')));
                });
            }
        },

        /**
         * Refreshes the specified pages or all.
         *
         * @param {Number} [pageNumberToRefresh]
         *  The 1-based page number to refresh.
         *  If not set all pages were refreshed.
         *
         * @param {Number} [pageNumberToSelect]
         *  The 1-based page number to select after refreshing.
         */
        refresh: function (pageNumberToRefresh, pageNumberToSelect) {
            if (this.numberOfPages > 0) {

                var self = this;

                if (_.isNumber(pageNumberToRefresh)) {
                    // Process the page node
                    var pageNode = this.getPageNode(pageNumberToRefresh);
                    Util.logPerformanceTimer('DocumentView:refresh_before_set_pagezoom_' + pageNumberToRefresh);
                    this.pageLoader.setPageZoom(pageNode, this.currentZoomFactor / 100).done(function () {
                        Util.logPerformanceTimer('DocumentView:refresh_then_from_set_pagezoom_' + pageNumberToRefresh);
                    });

                } else {
                    // empty all pages in case of a complete refresh request
                    this.pages.detach().each(function () {
                        self.emptyPageNode($(this));
                        Util.logPerformanceTimer('DocumentView:refresh_before_set_pagezoom_' + pageNumberToRefresh);
                        self.pageLoader.setPageZoom($(this), self.currentZoomFactor / 100).done(function () {
                            Util.logPerformanceTimer('DocumentView:refresh_then_from_set_pagezoom_' + pageNumberToRefresh);
                        });
                    }).appendTo(self.documentContainer);
                }

                if (_.isNumber(pageNumberToSelect)) {
                    this.onScrollToPage(pageNumberToSelect);
                }

                if (!pageNumberToRefresh) {
                    this.loadVisiblePages();
                }
            }
        },

        /**
         * Cancels all running background tasks regarding updating the page
         * nodes in the visible area.
         */
        cancelMorePagesTimer: function () {
            // cancel the timer that loads more pages above and below the visible
            // area, e.g. to prevent (or defer) out-of-memory situations on iPad
            if (this.loadMorePagesTimerId) {
                window.clearTimeout(this.loadMorePagesTimerId);
                this.loadMorePagesTimerId = null;
            }
        },

        /**
         * Clears a page node
         *
         * @param {jquery.Node} pageNode
         *  The jQuery page node to clear.
         */
        emptyPageNode: function (pageNode) {
            if (pageNode) {
                pageNode.data('data-rendertype', '').css({ visibility: 'visible' }).empty();
            }
        },

        /**
         * Creates and renders an document slide.
         *
         * @returns {DocumentView}
         *  the DocumentView instance.
         */
        render: function () {
            this.documentContainer = $('<div class="document-container io-ox-core-pdf">');
            this.$el.empty();
            return this;
        },

        /**
         * "Prefetches" the document slide.
         * In order to save memory and network bandwidth only documents with highest prefetch priority are prefetched.
         *
         * @param {Object} [options]
         *  Optional parameters:
         *  - {Number} [options.priority]
         *      The prefetch priority.
         *
         * @returns {DocumentView}
         *  A reference to this instance.
         */
        prefetch: function (options) {
            // check for highest priority
            if (options && options.priority === 1) {

                $.ajax({
                    url: DocConverterUtils.getEncodedConverterUrl(this.model, { async: true }),
                    dataType: 'text'
                });

                this.isPrefetched = true;
            }

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
         * Calculates document page numbers to render depending on visibility of the pages
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
         * Returns the pageNode for the given pageNumber.
         *
         * @param {Number} pageNumber
         *  The 1-based number of the page node to return.
         *
         * @returns {jquery.Node} pageNode
         *  The jQuery page node for the requested page number.
         */
        getPageNode: function (pageNumber) {
            return (pageNumber > 0) ? this.documentContainer.children().eq(pageNumber - 1) : $();
        },

        /**
         * Returns the 1-based number of the page node.
         *
         * @param {jquery.Node} pageNode
         *  The jQuery page node to get the page number for.
         *
         * @returns {Number}
         *  The 1-based number of the page node.
         */
        getPageNumber: function (pageNode) {
            var pageNumber = pageNode && pageNode.attr('data-page');
            return parseInt(pageNumber, 10);
        },

        /**
         * Clears the timer that is used to show a message in case it takes very long to show the pdf.
         */
        clearPdfDocumentWaitMessage: function () {
            clearTimeout(this.PdfDocumentWaitTimer);
        },

        /**
         * Creates a timer to show a message in case it takes very long to show the pdf.
         */
        startPdfDocumentWaitMessage: function () {
            this.PdfDocumentWaitTimer = window.setTimeout(function () {
                this.displayDownloadNotification(gt('Your preview is being generated.'), 'io-ox-busy immediate', gt('\n Alternatively you can download the file.'));
            }.bind(this), 5000);
        },

        /**
         * "Shows" the document (Office, PDF) with the PDF.js library.
         *
         * @returns {DocumentView}
         *  the DocumentView instance.
         */
        show: function () {

            Util.logPerformanceTimer('DocumentView:show');

            // do nothing and quit if a document is already disposed.
            if (this.disposed) {
                return;
            }

            // ignore already loaded documents
            if (this.$el.find('.document-page').length > 0) {
                // document pages are drawn, but there is no visible page rendered yet
                // may happen if pdfDocumentLoadSuccess returns when the slide is already skipped (isVisible() === false => initial loadVisiblePages() did not run)
                if (_.isEmpty(this.loadedPageNodes)) {
                    this.loadVisiblePages();
                }
                return;
            }

            /**
             * Returns true if a previous loading action resulted in a password protected error.
             */
            function isPasswordProtected(model) {
                var meta = model.get('meta');
                return meta && meta.document_conversion_error === 'passwordProtected';
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
                if (!_.isNumber(pageCount)) {
                    pdfDocumentLoadError.call(this, pageCount);
                    return;
                }

                this.documentContainer.enableTouch({
                    tapHandler: this.onTap.bind(this),
                    pinchHandler: this.onPinch.bind(this)
                });
                // attach the document container to the slide
                this.$el.empty().append(this.documentContainer);

                // the stored scroll position
                var lastScrollPosition = this.getInitialScrollPosition(this.model.get('id')) || 0;
                // the PDF link service. connects the Viewer with named actions and annotation links of the PDF
                var pdfLinkService = new PDFViewerLinkService({
                    externalLinkTarget: 2, // Open external links in a new window
                    pdfDocument: this.pdfDocument.getPDFJSDocument(),
                    eventHub: this.viewerEvents
                });

                // store number of pages
                this.numberOfPages = pageCount;
                // create the PDF view after successful loading
                this.pdfView = new PDFView(this.pdfDocument, {
                    textOverlay: true,
                    annotationsOverlay: true,
                    linkService: pdfLinkService
                });
                // the PDF page rendering queue
                this.pageLoader = new PageLoader(this.pdfDocument, this.pdfView);
                // set zoom factor to stored value or default zoom
                this.currentZoomFactor = this.getInitialZoomLevel(this.model.get('id')) || this.getDefaultZoomFactor();

                // draw page nodes and apply css sizes
                _.times(pageCount, function (index) {
                    var documentPage = $('<div class="document-page">').attr('data-page', index + 1),
                        pageSize = this.pdfView.getRealPageSize(index + 1, this.currentZoomFactor / 100);

                    this.documentContainer.append(documentPage.attr(pageSize).css(pageSize));
                }, this);

                // save values to the view instance, for performance
                this.pages = this.$el.find('.document-page');

                // render visible PDF pages
                this.loadVisiblePages();

                // disable slide swiping per default on documents
                this.$el.addClass('swiper-no-swiping');
                // register scroll handler
                this.$el.on('scroll', _.debounce(this.onScrollHandler.bind(this), 50));
                // set scroll position
                this.$el.scrollTop(lastScrollPosition);
                // update stored index of the dominant page
                this.currentDominantPageIndex = this.getDominantPage() || 1;

                // select/highlight the corresponding thumbnail according to displayed document page
                this.viewerEvents.trigger('viewer:document:selectthumbnail', this.currentDominantPageIndex)
                    .trigger('viewer:document:loaded')
                    .trigger('viewer:document:pagechange', this.currentDominantPageIndex, pageCount);
                this.$el.idle();
                // resolve the document load Deferred: thsi document view is fully loaded.
                this.documentLoad.resolve();
            }

            /**
             * Error handler for the PDF loading process.
             */
            function pdfDocumentLoadError(response) {
                console.warn('Core.Viewer.DocumentView.show(): failed loading PDF document. Cause: ', response.cause);
                //var notificationText = PDF_ERROR_NOTIFICATIONS[response.cause] || PDF_ERROR_NOTIFICATIONS.general;
                var notificationText = DocConverterUtils.getErrorTextFromResponse(response) || DocConverterUtils.getErrorText('importError');
                var notificationIconClass = (response.cause === 'passwordProtected') ? 'fa-lock' : null;

                // display error message
                this.displayDownloadNotification(notificationText, notificationIconClass);

                // store error info in meta data of the file model
                if (this.model.isFile()) {
                    var meta = _.extend({}, this.model.get('meta'), { document_conversion_error:  response.cause });
                    this.model.set('meta', meta);
                }

                // reject the document load Deferred.
                this.documentLoad.reject();
            }

            if (isPasswordProtected(this.model)) {
                this.displayDownloadNotification(DocConverterUtils.getErrorText('passwordProtected'), 'fa-lock');
                this.documentLoad.reject();
                return this;
            }

            var documentUrl = DocConverterUtils.getEncodedConverterUrl(this.model);

            // clear the slide content
            this.$el.empty();

            // create a pdf document object with the document PDF url
            this.pdfDocument = new PDFDocument(documentUrl);

            // always clear first to be sure just one timer exists (case switch slide fast forward/backward)
            this.clearPdfDocumentWaitMessage();
            // shows a message when it takes a while to show the document in the viewer
            this.startPdfDocumentWaitMessage();

            // display loading animation
            this.$el.busy({ immediate: true });

            // wait for PDF document to finish loading
            var pdfLoadPromise = $.when(this.pdfDocument.getLoadPromise());

            // adding log timer in synchronous done handler
            pdfLoadPromise.done(function () {
                // the document is NOT completely loaded yet! Often further chunks are downloaded during page rendering.
                Util.logPerformanceTimer('DocumentView:show_getLoadPromise_done_handler');
            });

            pdfLoadPromise.always(
                // using anon function her as a wrapper to get better traces for debugging
                function () {
                    this.clearPdfDocumentWaitMessage();
                }.bind(this)
            );

            pdfLoadPromise.then(
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
            if (!_.isNumber(zoomLevel) || !this.pdfView || !this.isVisible()) {
                return;
            }

            zoomLevel = Util.minMax(zoomLevel, this.getMinZoomFactor(), this.getMaxZoomFactor());
            if (zoomLevel === this.currentZoomFactor) {
                return;
            }

            var // the vertical scroll position before zooming
                documentTopPosition = this.$el.scrollTop(),
                // the horizontal scroll position before zooming
                documentLeftPosition = this.$el.scrollLeft(),
                pageMarginHeight = 20,
                pageMarginCount = this.getDominantPage() - 1,
                pageMarginTotal = pageMarginHeight * pageMarginCount,
                zoomLevelBeforeZoom = this.currentZoomFactor,
                pagesHeightBeforeZoom = documentTopPosition - pageMarginTotal;

            var pagesHeightAfterZoom = pagesHeightBeforeZoom * zoomLevel / zoomLevelBeforeZoom,
                // the vertical scroll position after zooming
                scrollTopAfterZoom = pagesHeightAfterZoom + pageMarginTotal,
                // the horizontal scroll position after zooming
                scrollLeftAfterZoom = documentLeftPosition * zoomLevel / zoomLevelBeforeZoom;

            // set page zoom to all pages and apply the new size to all page wrappers
            this.currentZoomFactor = zoomLevel;
            this.refreshDebounced();

            // adjust document scroll position according to new zoom
            this.$el.scrollTop(scrollTopAfterZoom);
            this.$el.scrollLeft(scrollLeftAfterZoom);

            // save new zoom level to view
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
         */
        unload: function () {

            if (this.pageLoader) {
                this.pageLoader.abortQueuedRequests();
                this.cancelMorePagesTimer();
                this.pageLoader.destroy();
                this.pageLoader = null;
            }
            if (this.pdfView) {
                this.pdfView.destroy();
                this.pdfView = null;
            }
            if (this.pdfDocument) {
                this.pdfDocument.destroy();
                this.pdfDocument = null;
            }
            // clear document container content
            this.$el.empty();
            this.isPrefetched = false;

            if (this.PdfDocumentWaitTimer) {
                this.clearPdfDocumentWaitMessage();
            }

            return this;
        },

        /**
         * Resize handler of the document view.
         * - calculates and sets a new initial zoom factor
         */
        onResize: function () {
            this.documentLoad.done(function () {
                if (this.isVisible()) {
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
        onDispose: function () {
            this.unload();
            // save disposed status
            this.disposed = true;
            this.$el.off();
            this.$el.removeClass('swiper-slide-document');
            if (this.thumbnailsView) {
                this.thumbnailsView.onDispose();
            }
        }

    });

    // returns an object which inherits BaseView
    return DocumentView;
});
