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

define('io.ox/office/preview/view/view',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/button',
     'io.ox/office/tk/control/spinfield',
     'io.ox/office/framework/view/baseview',
     'io.ox/office/framework/view/basecontrols',
     'io.ox/office/framework/view/pane',
     'io.ox/office/framework/view/sidepane',
     'io.ox/office/framework/view/component',
     'io.ox/office/framework/view/toolbox',
     'io.ox/office/preview/view/controls',
     'io.ox/office/preview/view/pagegroup',
     'io.ox/office/preview/view/pageloader',
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/view/style.less'
    ], function (Utils, Button, SpinField, BaseView, BaseControls, Pane, SidePane, Component, ToolBox, PreviewControls, PageGroup, PageLoader, gt) {

    'use strict';

    var // predefined zoom factors
        ZOOM_FACTORS = [25, 35, 50, 75, 100, 150, 200, 300, 400, 600, 800, 1200, 1600],

        // the speed of scroll animations
        ANIMATION_DELAY = 25;

    // class PreviewView ======================================================

    /**
     * The view of the OX Preview application. Shows pages of the previewed
     * document with a specific zoom factor.
     *
     * @constructor
     *
     * @extends BaseView
     *
     * @param {PreviewApplication} app
     *  The OX Preview application that has created this view instance.
     */
    function PreviewView(app) {

        var // self reference
            self = this,

            // the preview model
            model = null,

            // the DOM node of the scrollable application pane
            appPaneNode = null,

            // the main side pane containing the thumbnails
            sidePane = null,

            // tool pane floating over the top of the application pane
            topOverlayPane = null,

            // tool pane floating over the bottom of the application pane
            bottomOverlayPane = null,

            // the tool box containing page and zoom control groups
            bottomToolBox = null,

            // the status label for the page number and zoom factor
            statusLabel = new BaseControls.StatusLabel(app),

            // the page preview control
            pageGroup = null,

            // the root node containing all page nodes
            pageContainerNode = $('<div>').addClass('page-container'),

            // all page nodes as permanent jQuery collection, for performance
            pageNodes = $(),

            // the queue for AJAX page requests
            pageLoader = new PageLoader(app),

            // all page nodes with contents, keyed by one-based page number
            loadedPageNodes = {},

            // the timer used to defer loading more pages above and below the visible area
            loadMorePagesTimer = null,

            // one-based index of the selected page
            selectedPage = 0,

            // current zoom type (percentage or keyword)
            zoomType = 100,

            // the current effective zoom factor, in percent
            zoomFactor = 100,

            // the size available in the application pane
            availableSize = { width: 0, height: 0 },

            // current scroll animation
            scrollAnimation = null;

        // base constructor ---------------------------------------------------

        BaseView.call(this, app, {
            initHandler: initHandler,
            deferredInitHandler: deferredInitHandler,
            grabFocusHandler: grabFocusHandler,
            scrollable: true,
            contentMargin: 30,
            overlayMargin: { left: 8, right: Utils.SCROLLBAR_WIDTH + 8, bottom: Utils.SCROLLBAR_HEIGHT }
        });

        // private methods ----------------------------------------------------

        /**
         * Updates the status label with the current page number.
         */
        function updatePageStatus() {
            statusLabel.setValue(
                //#. A label showing the current page index in the OX Documents preview application
                //#. %1$d is the current page index
                //#. %2$d is the total number of pages
                //#, c-format
                gt('Page %1$d of %2$d', selectedPage, model.getPageCount()),
                { type: 'info' });
        }

        /**
         * Shows the current zoom factor in the status label for a short time,
         * then switches back to the display of the current page number.
         *
         * @param {Number} [scale=1]
         *  If specified, a scaling factor relative to the current zoom factor.
         */
        var updateZoomStatus = app.createDebouncedMethod(function (scale) {
            scale = _.isNumber(scale) ? scale : 1;
            statusLabel.setValue(
                //#. %1$d is the current zoom factor, in percent
                //#, c-format
                gt('Zoom: %1$d%', Math.round(zoomFactor * scale)),
                { type: 'info' });
        }, updatePageStatus, { delay: 1000 });

        /**
         * Selects the specified page. Updates the status label, the thumbnail
         * preview, and optionally scrolls the view to the specified page.
         *
         * @param {Number} page
         *  The one-based index of the selected page.
         */
        function selectPage(page) {
            if ((1 <= page) && (page <= model.getPageCount()) && (page !== selectedPage)) {
                selectedPage = page;
                pageGroup.selectAndShowPage(page);
                updatePageStatus();
                app.getController().update();
            }
        }

        /**
         * Scrolls the application pane node by the passed distance.
         */
        function scrollAppPaneNode(diffX, diffY) {
            var scrollLeft = appPaneNode.scrollLeft() + Math.round(diffX),
                scrollTop = appPaneNode.scrollTop() + Math.round(diffY);
            appPaneNode.scrollLeft(scrollLeft).scrollTop(scrollTop);
        }

        /**
         * Aborts the current scroll animation.
         */
        function abortScrollAnimation() {
            if (scrollAnimation) {
                scrollAnimation.abort();
                scrollAnimation = null;
            }
        }

        /**
         * Starts a new scroll animation.
         *
         * @param {Function} callback
         *  A callback function that has to return the scroll distance for each
         *  animation frame, as object in the properties 'x' and 'y'. The
         *  function receives the zero-based index of the current animation
         *  frame.
         *
         * @param {Numner} frames
         *  The number of animation frames.
         */
        function startScrollAnimation(callback, frames) {
            abortScrollAnimation();
            scrollAnimation = app.repeatDelayed(function (index) {
                var move = callback.call(self, index);
                scrollAppPaneNode(move.x, move.y);
            }, { delay: ANIMATION_DELAY, cycles: frames })
            .done(function () { scrollAnimation = null; });
        }

        /**
         * Scrolls the view to the specified page.
         *
         * @param {Number} page
         *  The one-based index of the page to be scrolled to.
         */
        function scrollToPage(page) {

            var // the new page node (prevent selecting nodes from end of array for negative values)
                pageNode = (page > 0) ? pageNodes.eq(page - 1) : $();

            if (pageNode.length > 0) {
                appPaneNode.scrollTop(Utils.getChildNodePositionInNode(appPaneNode, pageNode).top - self.getContentMargin().top);
            }
        }

        /**
         * Loads the specified page, and stores the original page size at the
         * page node.
         */
        function loadPage(page, priority) {

            var // the page node of the specified page
                pageNode = pageNodes.eq(page - 1);

            // do not load initialized page again
            if (pageNode.children().length === 0) {
                pageLoader.loadPage(pageNode, page, priority).done(function () {
                    loadedPageNodes[page] = pageNode;
                    updatePageZoom(pageNode);
                    // new pages may have moved into the visible area
                    updateVisiblePages();
                });
            }
        }

        /**
         * Cancels all running background tasks regarding updating the page
         * nodes in the visible area.
         */
        function cancelMorePagesTimer() {
            // cancel the timer that loads more pages above and below the visible
            // area, e.g. to prevent (or defer) out-of-memory situations on iPad
            if (loadMorePagesTimer) {
                loadMorePagesTimer.abort();
                loadMorePagesTimer = null;
            }
        }

        /**
         * Updates all pages that are currently visible in the application
         * pane.
         */
        function updateVisiblePages() {

            var // find the first page that is visible at the top border of the visible area
                beginPage = _(pageNodes).sortedIndex(appPaneNode.scrollTop(), function (value) {
                    if (_.isNumber(value)) { return value; }
                    var pagePosition = Utils.getChildNodePositionInNode(appPaneNode, value);
                    return pagePosition.top + pagePosition.height - 1;
                }) + 1,
                // find the first page that is not visible anymore at the bottom border of the visible area
                endPage = _(pageNodes).sortedIndex(appPaneNode.scrollTop() + appPaneNode[0].clientHeight, function (value) {
                    if (_.isNumber(value)) { return value; }
                    return Utils.getChildNodePositionInNode(appPaneNode, value).top;
                }) + 1,
                // first page loaded with lower priority
                beginPageLowerPrio = Math.max(1, beginPage - 2),
                // one-after last page loaded with lower priority
                endPageLowerPrio = Math.min(endPage + 2, model.getPageCount() + 1);

            // loads the specified page with high priority
            function loadPageHighPriority(page) {
                loadPage(page, 'high');
            }

            // loads the specified page with low priority
            function loadPageMediumPriority(page) {
                loadPage(page, 'medium');
            }

            // fail safety: do nothing if called while view is hidden (e.g. scroll handlers)
            if (!self.isVisible()) { return; }

            // abort old requests not yet running
            pageLoader.abortQueuedRequests();

            // load visible pages with high priority
            Utils.iterateRange(beginPage, endPage, loadPageHighPriority);

            // load two pages above and below the visible area with medium priority after a short delay
            cancelMorePagesTimer();
            loadMorePagesTimer = app.executeDelayed(function () {
                Utils.iterateRange(endPage, endPageLowerPrio, loadPageMediumPriority);
                Utils.iterateRange(beginPage - 1, beginPageLowerPrio - 1, loadPageMediumPriority, { step: -1 });
            }, { delay: 500 });

            // clear all other pages
            _(loadedPageNodes).each(function (pageNode, page) {
                if ((page < beginPageLowerPrio) || (page >= endPageLowerPrio)) {
                    app.destroyImageNodes(pageNode.children('img'));
                    pageNode.empty();
                    delete loadedPageNodes[page];
                }
            });

            // activate the page located at the top border of the visible area
            selectPage(beginPage);
        }

        /**
         * Recalculates the size of the specified page node, according to the
         * original page size and the current zoom type.
         */
        function updatePageZoom(pageNode) {

            var // the original size of the current page
                pageSize = pageLoader.getPageSize(pageNode),
                // the effective zoom factor for the page
                pageZoomFactor = 100;

            // calculate the effective zoom factor
            if (_.isNumber(zoomType)) {
                pageZoomFactor = zoomType;
            } else if (zoomType === 'width') {
                pageZoomFactor = availableSize.width / pageSize.width * 100;
            } else if (zoomType === 'page') {
                pageZoomFactor = Math.min(availableSize.width / pageSize.width * 100, availableSize.height / pageSize.height * 100);
            }
            pageZoomFactor = Utils.minMax(pageZoomFactor, self.getMinZoomFactor(), self.getMaxZoomFactor());

            // set the zoom factor at the page node
            pageLoader.setZoomFactor(pageNode, pageZoomFactor / 100);
        }

        /**
         * Recalculates the size of the page nodes, according to the original
         * page sizes and the current zoom type, and performs other adjustments
         * after the global view layout has changed.
         */
        function refreshLayout() {

            var // find the page that is visible at the vertical center of the visible area
                centerPage = _(pageNodes).sortedIndex(appPaneNode.scrollTop(), function (value) {
                    if (_.isNumber(value)) { return value; }
                    var pagePosition = Utils.getChildNodePositionInNode(appPaneNode, value);
                    return pagePosition.top + pagePosition.height - 1;
                }) + 1,
                // the position of the center page in the visible area of the application pane
                centerPagePosition = null,
                // the ratio of the center page that is located exactly at the screen center
                centerPageRatio = 0,
                // current content margin according to browser window size
                contentMargin = ((window.innerWidth <= 1024) || (window.innerHeight <= 640)) ? 0 : 30;

            if (model.getPageCount() === 0) { return; }

            // restrict center page to valid page numbers, get position of the center page
            centerPage = Utils.minMax(centerPage, 1, model.getPageCount());
            centerPagePosition = Utils.getChildNodePositionInNode(appPaneNode, pageNodes[centerPage - 1], { visibleArea: true });

            // Calculation of the page ratio
            // -----------------------------
            // (1) If 'centerPagePosition.top' is positive, currently the gap
            // between two pages is on top of the screen. Keep the size of this
            // gap constant independent from the page size (a negative integer
            // value in 'centerPageRatio' indicates the page gap mode).
            // (2) If 'centerPagePosition.top' is zero or negative, the upper
            // part of the page is hidden, and the ratio between hidden and
            // visible area of the page will be restored after changing the
            // page size (a positive quotient in 'centerPageRatio' indicates
            // this case).
            centerPageRatio = (centerPagePosition.top > 0) ? -centerPagePosition.top :
                (centerPagePosition.height > 0) ? (-centerPagePosition.top / centerPagePosition.height) : 0;

            // set the current content margin between application pane border and page nodes
            self.setContentMargin(contentMargin);

            // the available inner size in the application pane
            availableSize.width = appPaneNode[0].clientWidth - 2 * contentMargin;
            availableSize.height = ((zoomType === 'page') ? appPaneNode.height() : appPaneNode[0].clientHeight) - 2 * contentMargin;

            // Process all page nodes, update 'current zoom factor' for the
            // selected page. Detaching the page nodes while updating them
            // reduces processing time per page node from ~10ms to ~0.5ms!
            pageNodes.detach().each(function () { updatePageZoom($(this)); });
            pageContainerNode.append(pageNodes);
            zoomFactor = pageLoader.getPageZoom(pageNodes[selectedPage - 1]) * 100;

            // restore the correct scroll position with the new page sizes
            centerPagePosition = Utils.getChildNodePositionInNode(appPaneNode, pageNodes[centerPage - 1]);
            appPaneNode.scrollTop(centerPagePosition.top + ((centerPageRatio < 0) ? centerPageRatio : Math.round(centerPagePosition.height * centerPageRatio)));
        }

        /**
         * Moves the browser focus to the application pane.
         */
        function grabFocusHandler() {
            appPaneNode.focus();
            // Bug 25924: sometimes, Firefox selects the entire page
            window.getSelection().removeAllRanges();
        }

        /**
         * Stores the current scroll position while the view is hidden.
         */
        function windowHideHandler() {
            appPaneNode.data({ scrollLeft: appPaneNode.scrollLeft(), scrollTop: appPaneNode.scrollTop() });
        }

        /**
         * Restores the scroll position after the view was hidden.
         */
        function windowShowHandler() {
            appPaneNode.scrollLeft(appPaneNode.data('scrollLeft') || 0).scrollTop(appPaneNode.data('scrollTop') || 0);
        }

        /**
         * Returns a save point containing all settings needed to restore the
         * current view settings.
         */
        function failSaveHandler() {
            return { page: selectedPage, zoom: zoomType };
        }

        /**
         * Initializes the view settings after the document has been opened.
         *
         * @param {Object} point
         *  A save point that may have been created before by this application.
         */
        function importSuccessHandler(point) {

            // restore zoom type
            zoomType = Utils.getOption(point, 'zoom');
            if (_.isNumber(zoomType)) {
                zoomType = Math.round(zoomType);
            } else if (!_.isString(zoomType) || (zoomType.length === 0)) {
                zoomType = 'page';
            }

            // restore selected page
            self.showPage(Utils.getIntegerOption(point, 'page', 1, 1, model.getPageCount()));

            // update visible pages once manually (no scroll event is triggered,
            // if the first page is shown which does not cause any scrolling).
            updateVisiblePages();
        }

        /**
         * Handles tracking events originating from the mouse and simulates
         * touch-like scrolling on the page nodes.
         *
         * @param {jQuery.Event} event
         *  The jQuery tracking event.
         */
        var trackingHandler = (function () {

            var // the duration to collect move events, in milliseconds
                COLLECT_DURATION = 150,
                // distances of last move events in COLLECT_DURATION
                lastMoves = null;

            // removes all outdated entries from the lastMoves array
            function updateLastMoves(moveX, moveY) {

                var now = _.now();

                while ((lastMoves.length > 0) && (now - lastMoves[0].now > COLLECT_DURATION)) {
                    lastMoves.shift();
                }
                if (_.isNumber(moveX) && _.isNumber(moveY)) {
                    lastMoves.push({ now: now, x: moveX, y: moveY });
                }
                return now;
            }

            // starts the trailing animation
            function trailingAnimation() {

                var now = updateLastMoves(),
                    move = _(lastMoves).reduce(function (memo, entry) {
                        var factor = (now - entry.now) / COLLECT_DURATION;
                        memo.x -= entry.x * factor;
                        memo.y -= entry.y * factor;
                        return memo;
                    }, { x: 0, y: 0 });

                // reduce distance for initial animation frame
                move.x /= (COLLECT_DURATION / ANIMATION_DELAY / 2);
                move.y /= (COLLECT_DURATION / ANIMATION_DELAY / 2);

                // run the scroll animation
                startScrollAnimation(function () { move.x *= 0.85; move.y *= 0.85; return move; }, 20);
            }

            function trackingHandler(event) {

                switch (event.type) {
                case 'tracking:start':
                    lastMoves = [];
                    abortScrollAnimation();
                    break;
                case 'tracking:move':
                    scrollAppPaneNode(-event.moveX, -event.moveY);
                    updateLastMoves(event.moveX, event.moveY);
                    break;
                case 'tracking:end':
                    trailingAnimation();
                    break;
                case 'tracking:cancel':
                    break;
                }
            }

            return trackingHandler;
        }()); // end of trackingHandler() local scope

        /**
         * Handles gesture events and changes the current zoom.
         *
         * @param {jQuery.Event} event
         *  The jQuery gesture event.
         */
        var gestureHandler = (function () {

            // get the current relative scale factor from the passed event
            function getScale(event) {
                var scale = event.originalEvent.scale;
                // if current zoom type is 'zoom-to-something', do not change it
                // while scaling factor from event is between 0.95 and 1.05
                return (_.isNumber(zoomType) || (scale <= 0.95) || (scale >= 1.05)) ? scale : null;
            }

            // changes the temporary page scaling while zooming
            function changePageScale(scale) {
                var cssScale = _.isNumber(scale) ? ('scale(' + scale + ')') : '';
                Utils.setCssAttributeWithPrefixes(pageNodes, 'transform', cssScale);
                updateZoomStatus(scale);
            }

            // updates the zoom according to the current scale factor
            function changeZoom(event) {
                var scale = getScale(event);
                changePageScale(null);
                if (_.isNumber(scale)) { self.setZoomType(zoomFactor * scale); }
                app.getController().update();
            }

            function gestureHandler(event) {
                switch (event.type) {
                case 'gesturechange':
                    changePageScale(getScale(event));
                    break;
                case 'gestureend':
                    changeZoom(event);
                    break;
                }
                return false;
            }

            return gestureHandler;
        }()); // end of gestureHandler() local scope

        /**
         * Handles scroll events and updates the visible pages.
         *
         * @param {jQuery.Event} event
         *  The jQuery scroll event.
         */
        var scrollHandler = app.createDebouncedMethod(cancelMorePagesTimer, updateVisiblePages, { delay: 200, maxDelay: 1000 });

        /**
         * Initialization after construction.
         */
        function initHandler() {

            model = app.getModel();
            appPaneNode = self.getAppPaneNode();

            // make the application pane focusable for global navigation with F6 key
            appPaneNode.addClass('f6-target').attr('tabindex', 1);

            // create the side pane
            self.addPane(sidePane = new SidePane(app, {
                position: 'right',
                resizeable: !Modernizr.touch,
                minSize: SidePane.DEFAULT_WIDTH,
                maxSize: 1.8 * SidePane.DEFAULT_WIDTH
            }));

            // create the page preview group
            pageGroup = new PageGroup(app, sidePane);

            // initialize the side pane
            sidePane
                .addViewComponent(new ToolBox(app, { fixed: 'top' })
                    .addGroup('app/view/sidepane', new Button(BaseControls.HIDE_SIDEPANE_OPTIONS))
                    .addRightTab()
                    .addGroup('app/edit', new PreviewControls.EditDocumentButton(app))
                    .addGap()
                    .addGroup('app/quit', new Button(BaseControls.QUIT_OPTIONS))
                )
                .addViewComponent(new Component(app)
                    .addGroup('pages/current', pageGroup)
                );

            // create the top overlay pane
            self.addPane(topOverlayPane = new Pane(app, { position: 'top', classes: 'inline right', overlay: true, transparent: true, hoverEffect: true })
                .addViewComponent(new ToolBox(app)
                    .addGroup('app/view/sidepane', new Button(BaseControls.SHOW_SIDEPANE_OPTIONS))
                    .addGap()
                    .addGroup('app/edit', new PreviewControls.EditDocumentButton(app))
                    .addGap()
                    .addGroup('app/quit', new Button(BaseControls.QUIT_OPTIONS))
                )
            );

            // create the bottom overlay pane
            self.addPane(bottomOverlayPane = new Pane(app, { position: 'bottom', classes: 'inline right', overlay: true, transparent: true, hoverEffect: true })
                .addViewComponent(bottomToolBox = new ToolBox(app))
            );

            // initially, hide the side pane, and show the overlay tool bars
            self.toggleSidePane(false);
        }

        function deferredInitHandler() {

            var // the bottom tool box in the side pane
                sidePaneToolBox = null,
                // the number of pages in the document
                pageCount = model.getPageCount(),
                // the HTML mark-up for the empty page nodes
                pageMarkup = '';

            if (pageCount >= 1) {

                // initialize side pane depending on page count
                sidePane.addViewComponent(sidePaneToolBox = new ToolBox(app, { fixed: 'bottom' }));
                if (pageCount > 1) {
                    sidePaneToolBox
                        .addGroup('pages/previous', new Button(PreviewControls.PREV_OPTIONS))
                        .addGroup('pages/current',  new PreviewControls.PageChooser(app))
                        .addGroup('pages/next',     new Button(PreviewControls.NEXT_OPTIONS));
                }
                sidePaneToolBox
                    .addRightTab()
                    .addGroup('zoom/dec',  new Button(PreviewControls.ZOOMOUT_OPTIONS))
                    .addGroup('zoom/type', new PreviewControls.ZoomTypeChooser())
                    .addGroup('zoom/inc',  new Button(PreviewControls.ZOOMIN_OPTIONS));

                // create the status overlay pane
                self.addPane(new Pane(app, { position: 'bottom', classes: 'inline right', overlay: true, transparent: true })
                    .addViewComponent(new ToolBox(app).addPrivateGroup(statusLabel))
                );

                // initialize bottom overlay pane depending on page count
                if (pageCount > 1) {
                    bottomToolBox.newLine().addRightTab()
                        .addGroup('pages/previous', new Button(PreviewControls.PREV_OPTIONS))
                        .addGroup('pages/current',  new PreviewControls.PageChooser(app))
                        .addGroup('pages/next',     new Button(PreviewControls.NEXT_OPTIONS));
                }
                bottomToolBox.newLine().addRightTab()
                    .addGroup('zoom/dec',  new Button(PreviewControls.ZOOMOUT_OPTIONS))
                    .addGroup('zoom/type', new PreviewControls.ZoomTypeChooser())
                    .addGroup('zoom/inc',  new Button(PreviewControls.ZOOMIN_OPTIONS));

                // save the scroll position while view is hidden
                app.getWindow().on({ beforehide: windowHideHandler, show: windowShowHandler });

                // no layout refreshes without any pages
                self.on('refresh:layout', refreshLayout);

                // initialize touch-like tracking with mouse, attach the scroll event handler
                appPaneNode
                    .enableTracking({ selector: '.page', sourceEvents: 'mouse' })
                    .on('tracking:start tracking:move tracking:end tracking:cancel', trackingHandler)
                    .on('gesturestart gesturechange gestureend', gestureHandler)
                    .on('scroll', scrollHandler);

                // initialize all page nodes
                _(pageCount).times(function (index) {
                    pageMarkup += '<div class="page" data-page="' + (index + 1) + '"></div>';
                });
                self.insertContentNode(pageContainerNode.html(pageMarkup));
                pageNodes = pageContainerNode.children();
            }

            // set focus to application pane, and update the view
            self.grabFocus();
            app.getController().update();
        }

        // methods ------------------------------------------------------------

        /**
         * Returns whether the main side pane is currently visible.
         *
         * @returns {Boolean}
         *  Whether the main side pane is currently visible.
         */
        this.isSidePaneVisible = function () {
            return sidePane.isVisible();
        };

        /**
         * Changes the visibility of the main side pane and the overlay tool
         * box. If the side pane is visible, the overlay tool box is hidden,
         * and vice versa.
         *
         * @param {Boolean} state
         *  Whether to show or hide the main side pane.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.toggleSidePane = function (state) {
            this.lockPaneLayout(function () {
                sidePane.toggle(state);
                topOverlayPane.toggle(!state);
                bottomOverlayPane.toggle(!state);
            });
            return this;
        };

        /**
         * Returns the one-based index of the page currently shown.
         *
         * @returns {Number}
         *  The one-based index of the current page.
         */
        this.getPage = function () {
            return selectedPage;
        };

        /**
         * Shows the specified page of the current document.
         *
         * @param {Number|String} page
         *  The one-based index of the page to be shown; or one of the keywords
         *  'first', 'previous', 'next', or 'last'.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.showPage = function (page) {

            // convert page keyword to page number
            switch (page) {
            case 'first':
                page = 1;
                break;
            case 'previous':
                page = this.getPage() - 1;
                break;
            case 'next':
                page = this.getPage() + 1;
                break;
            case 'last':
                page = model.getPageCount();
                break;
            }

            selectPage(page);
            scrollToPage(page);
            return this;
        };

        /**
         * Returns the current zoom type.
         *
         * @returns {Number|String}
         *  The current zoom type, either as fixed percentage, or as one of the
         *  keywords 'width' (page width is aligned to width of the visible
         *  area), or 'page' (page size is aligned to visible area).
         */
        this.getZoomType = function () {
            return zoomType;
        };

        /**
         * Returns the current effective zoom factor in percent.
         *
         * @returns {Number}
         *  The current zoom factor in percent.
         */
        this.getZoomFactor = function () {
            return zoomFactor;
        };

        /**
         * Returns the minimum zoom factor in percent.
         *
         * @returns {Number}
         *  The minimum zoom factor in percent.
         */
        this.getMinZoomFactor = function () {
            return ZOOM_FACTORS[0];
        };

        /**
         * Returns the maximum zoom factor in percent.
         *
         * @returns {Number}
         *  The maximum zoom factor in percent.
         */
        this.getMaxZoomFactor = function () {
            return _.last(ZOOM_FACTORS);
        };

        /**
         * Changes the current zoom settings.
         *
         * @param {Number|String} newZoomType
         *  The new zoom type. Either a fixed percentage, or one of the
         *  keywords 'width' (page width is aligned to width of the visible
         *  area), or 'page' (page size is aligned to visible area).
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.setZoomType = function (newZoomType) {
            if (zoomType !== newZoomType) {
                zoomType = newZoomType;
                refreshLayout();
                updateZoomStatus();
            }
            return this;
        };

        /**
         * Switches to 'fixed' zoom mode, and decreases the current zoom level
         * by one according to the current effective zoom factor, and updates
         * the view.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.decreaseZoomLevel = function () {

            var // find last entry in ZOOM_FACTORS with a factor less than current zoom
                prevZoomFactor = Utils.findLast(ZOOM_FACTORS, function (factor) { return factor < zoomFactor; });

            return this.setZoomType(_.isNumber(prevZoomFactor) ? prevZoomFactor : this.getMinZoomFactor());
        };

        /**
         * Switches to 'fixed' zoom mode, and increases the current zoom level
         * by one according to the current effective zoom factor, and updates
         * the view.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.increaseZoomLevel = function () {

            var // find first entry in ZOOM_FACTORS with a factor greater than current zoom
                nextZoomFactor = _(ZOOM_FACTORS).find(function (factor) { return factor > zoomFactor; });

            return this.setZoomType(_.isNumber(nextZoomFactor) ? nextZoomFactor : this.getMaxZoomFactor());
        };

        // initialization -----------------------------------------------------

        // fail-save handler returns data needed to restore the application after browser refresh
        app.registerFailSaveHandler(failSaveHandler);
        // initialize the view after import with the fail-save information
        app.on('docs:import:success', importSuccessHandler);

    } // class PreviewView

    // exports ================================================================

    // derive this class from class BaseView
    return BaseView.extend({ constructor: PreviewView });

});
