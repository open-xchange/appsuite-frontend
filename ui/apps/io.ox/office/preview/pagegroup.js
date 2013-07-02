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

define('io.ox/office/preview/pagegroup',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group',
     'io.ox/office/framework/view/sidepane',
     'io.ox/office/preview/viewutils'
    ], function (Utils, Group, SidePane, ViewUtils) {

    'use strict';

    var // horizontal margin between group and scroll pane
        HOR_MARGIN = 13,

        // fixed total width of a page button (two buttons in default side pane width)
        BUTTON_WIDTH = 100,

        // fixed total height of a page button
        BUTTON_HEIGHT = 130;

    // class PageGroup ========================================================

    function PageGroup(app, sidePane) {

        var // self reference
            self = this,

            // the scrollable area in the side pane
            scrollableNode = sidePane.getScrollableNode(),

            // all button elements, mapped by one-based page index
            buttonNodes = [],

            // number of pages per row
            columns = 0,

            // current button width, in pixels
            buttonWidth = 0;

        // base constructor ---------------------------------------------------

        Group.call(this, { classes: 'page-preview' });

        // private methods ----------------------------------------------------

        /**
         * Highlights the button representing the page with the passed index.
         */
        function updateHandler(page) {
            Utils.selectOptionButton(self.getNode().find(Utils.BUTTON_SELECTOR), page);
        }

        /**
         * Updates the size of the specified page node, so that it will fit
         * into the button node.
         *
         * @param {jQuery} buttonNode
         *  The outer button node.
         *
         * @param {jQuery} pageNode
         *  The inner page node.
         *
         * @param {Object} pageSize
         *  The original page size, in pixels, in the properties 'width' and
         *  'height'.
         */
        function updatePageSize(buttonNode, pageNode, pageSize) {

            var // the child node in the page, containing the SVG
                childNode = pageNode.children().first(),
                // the available width and height inside the button node
                maxWidth = buttonNode.width(),
                maxHeight = buttonNode.height() - 20,
                // the zoom factor according to available size
                widthFactor = Math.min(maxWidth / pageSize.width, 1),
                heightFactor = Math.min(maxHeight / pageSize.height, 1),
                zoomFactor = Math.min(widthFactor, heightFactor);

            // set the calculated zoom factor
            ViewUtils.setZoomFactor(pageNode, pageSize, zoomFactor);

            // Firefox has serious performance issues when rendering/scrolling
            // nodes with many SVG contents, convert SVG pages to inline bitmaps
            if (_.browser.Firefox && childNode.is('img')) {
                ViewUtils.convertImageToBitmap(childNode, pageSize);
            }
        }

        /**
         * Creates a new button element representing the page with the passed
         * index, and loads the page contents in a background task.
         *
         * @param {Number} page
         *  The one-based index of the page.
         *
         * @returns {jQuery}
         *  The button element created by this method.
         */
        var updateButtonNode = (function () {

            var // list of pending buttons waiting to load their page contents
                pendingInfos = [],
                // the background loop processing the pending pages
                timer = null,
                // the number of pages currently loaded (number of running AJAX requests)
                runningRequests = 0;

            // direct callback: called every time when updateButtonNode() has been called
            function registerButtonNode(buttonNode, page, visible) {

                var // the object containing all information about the button node
                    pendingInfo = null;

                // clear the button if it is not visible anymore
                if (!visible) {
                    pendingInfos = _(pendingInfos).filter(function (pendingInfo) { return page !== pendingInfo.page; });
                    buttonNode.find('.page').remove();
                    return;
                }

                // do nothing if the button node is already initialized
                if (buttonNode.find('.page').length > 0) {
                    return;
                }

                // create the target page node, and a temporary busy node
                pendingInfo = {
                    page: page,
                    buttonNode: buttonNode,
                    busyNode: $('<div>').addClass('page'),
                    pageNode: $('<div>').addClass('page')
                };

                // insert the page node into the DOM before loading the image
                app.getView().insertTemporaryNode(pendingInfo.pageNode);

                // set default page size (DIN A* Portrait) before loading the page (in case of error)
                buttonNode.append(pendingInfo.busyNode);
                updatePageSize(buttonNode, pendingInfo.busyNode, { width: 210, height: 297 });
                pendingInfo.busyNode.append($('<div>').addClass('abs').busy());

                // register the nodes for the deferred callback loading the page contents
                pendingInfos.push(pendingInfo);
            }

            // deferred callback: starts a background loop that loads all pending pages into the button nodes
            function loadPages() {

                // check if the background loop is already running
                if (timer) { return; }

                // create a new background loop that processes all pages contained in pendingInfos
                timer = app.repeatDelayed(function () {

                    var // pending nodes and page number
                        pendingInfo = null;

                    // do not request more than 10 pages at a time
                    if (runningRequests >= 5) { return; }

                    // find a pending button that still contains its busy node (buttons may have been hidden
                    // in the meantime), abort the background loop, if no more pages have to be loaded
                    while ((pendingInfo = pendingInfos.shift()) && !Utils.containsNode(pendingInfo.buttonNode, pendingInfo.busyNode)) {}
                    if (!pendingInfo) { return Utils.BREAK; }

                    // load the page into the button node
                    runningRequests += 1;
                    ViewUtils.loadPageIntoNode(pendingInfo.pageNode, app.getModel(), pendingInfo.page)
                    .always(function () {
                        runningRequests -= 1;
                    })
                    .done(function (pageSize) {
                        pendingInfo.busyNode.remove();
                        pendingInfo.buttonNode.append(pendingInfo.pageNode);
                        updatePageSize(pendingInfo.buttonNode, pendingInfo.pageNode, pageSize);
                    })
                    .fail(function () {
                        pendingInfo.busyNode.empty().addClass('icon-remove').css({
                            color: '#f88',
                            fontSize: '60px',
                            lineHeight: pendingInfo.busyNode.height() + 'px',
                            textDecoration: 'none' // otherwise, IE underlines when hovering
                        });
                    });

                }, { delay: 25 });

                // forget reference to the timer, when all page requests are running
                timer.done(function () { timer = null; });
            }

            // create and return the debounced updateButtonNode() method
            return app.createDebouncedMethod(registerButtonNode, loadPages);

        }()); // end of local scope of createPageButton()

        /**
         * Updates all preview pages currently shown, according to the visible
         * range in the scrollable area.
         */
        function updateVisiblePages() {

            var // position and size of visible area in scrollable area
                visiblePosition = Utils.getVisibleAreaPosition(scrollableNode),
                // top margin of group node, used as offset in position calculations
                topMargin = Utils.convertCssLength(self.getNode().css('margin-top'), 'px', 0),
                // row range visible in the scrollable node (closed range)
                firstRow = 0, lastRow = 0,
                // page range visible in the scrollable node (closed range)
                firstPage = 0, lastPage = 0;

            // get row range in visible area (add a row above and below)
            firstRow = Math.floor((visiblePosition.top - topMargin) / BUTTON_HEIGHT) - 1;
            lastRow = Math.floor((visiblePosition.top + visiblePosition.height - topMargin) / BUTTON_HEIGHT) + 1;

            // get one-based page range in visible area (restrict range to pages in document)
            firstPage = Math.max(1, firstRow * columns + 1);
            lastPage = Math.min(app.getModel().getPageCount(), (lastRow + 1) * columns);

            // create page data for all visible button nodes, remove page data from other button nodes
            _(buttonNodes).each(function (buttonNode, page) {
                updateButtonNode(buttonNode, page, (firstPage <= page) && (page <= lastPage));
            });
        }

        /**
         * Updates the position of the button nodes according to the current
         * width of the side pane.
         */
        function updateButtonNodes() {

            var // number of pages shown in the document
                pageCount = app.getModel().getPageCount(),
                // inner width available for button nodes
                innerWidth = scrollableNode.outerWidth() - 2 * HOR_MARGIN - Utils.SCROLLBAR_WIDTH;

            // do nothing, if the side pane is not visible, or no pages are available
            if ((pageCount === 0) || !sidePane.isVisible()) { return; }

            // create empty button nodes for all pages on first call
            if (buttonNodes.length === 0) {
                for (var page = 1; page <= pageCount; page += 1) {
                    buttonNodes[page] = Utils.createButton({ value: page, label: String(page) });
                    self.addFocusableControl(buttonNodes[page]);
                }
            }

            // calculate number of pages available per row, and effective button width
            columns = Math.max(1, Math.floor(innerWidth / BUTTON_WIDTH + 0.4));
            buttonWidth = Math.floor(innerWidth / columns);

            // update size of the own group node
            self.getNode().width(innerWidth).height(Math.ceil(pageCount / columns) * BUTTON_HEIGHT);

            // update position and size of all button nodes
            _(buttonNodes).each(function (buttonNode, page) {

                var // zero-based column index of the button
                    col = (page - 1) % columns,
                    // zero-based row index of the button
                    row = Math.floor((page - 1) / columns);

                buttonNode.css({ left: col * buttonWidth, top: row * BUTTON_HEIGHT, width: buttonWidth, height: BUTTON_HEIGHT });
            });

            // update page data for all visible button nodes
            updateVisiblePages();
        }

        /**
         * Scrolls the scrollable node to the specified button node.
         */
        function scrollToButton(buttonNode) {
            if (sidePane.isVisible()) {
                Utils.scrollToChildNode(scrollableNode, buttonNode, { padding: 25 });
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Selects the specified page in the preview, and scrolls the preview
         * area to make the page visible.
         *
         * @param {Number} page
         *  The one-based page index.
         *
         * @returns {PageGroup}
         *  A reference to this instance.
         */
        this.selectAndShowPage = function (page) {
            if (page in buttonNodes) {
                scrollToButton(buttonNodes[page]);
                updateHandler(page);
            }
            return this;
        };

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateHandler)
            .registerChangeHandler('click', { selector: Utils.BUTTON_SELECTOR });

        // when refreshing the side pane (e.g. due to changed size of browser
        // window or side pane), update the positions of all button nodes
        sidePane.on('refresh:layout', updateButtonNodes);

        // when showing or resizing the side pane, scroll to current page
        sidePane.on('show resize', function () {
            self.selectAndShowPage(app.getView().getPage());
        });

        // update pages while scrolling (debounced to skip a few scroll events)
        scrollableNode.on('scroll', app.createDebouncedMethod($.noop, updateVisiblePages, { delay: 50, maxDelay: 200 }));

        // keyboard focus traveling: scroll to focused node
        this.getNode().on('focusin', Utils.BUTTON_SELECTOR, function (event) {
            scrollToButton(event.target);
        });

    } // class PageGroup

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: PageGroup });

});
