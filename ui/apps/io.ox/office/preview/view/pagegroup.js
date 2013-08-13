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

define('io.ox/office/preview/view/pagegroup',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/keycodes',
     'io.ox/office/tk/control/group',
     'io.ox/office/preview/view/pageloader',
     'gettext!io.ox/office/main'
    ], function (Utils, KeyCodes, Group, PageLoader, gt) {

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

            // the view instance containing this page group
            view = app.getView(),

            // the scrollable area in the side pane
            scrollableNode = sidePane.getScrollableNode(),

            // all button nodes as permanent jQuery collection, for performance
            buttonNodes = $(),

            // the queue for AJAX page requests
            pageLoader = new PageLoader(app),

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
            Utils.toggleButtons(Utils.getSelectedButtons(buttonNodes).removeAttr('tabindex'), false);
            Utils.toggleButtons(buttonNodes.eq(page - 1).attr('tabindex', 1), true);
        }

        /**
         * Updates the size of the specified page node, so that it will fit
         * into the parent button node.
         *
         * @param {jQuery} pageNode
         *  The page node, as jQuery object.
         */
        function updatePageSize(pageNode) {

            var // the original size of the passed page
                pageSize = pageLoader.getPageSize(pageNode),
                // the child node in the page, containing the SVG
                childNode = pageNode.children().first(),
                // maximum width and height available for the page
                maxWidth = buttonWidth - 12,
                maxHeight = BUTTON_HEIGHT - 33,
                // the zoom factor according to available size
                widthFactor = 0, heightFactor = 0, zoomFactor = 0;

            // calculate zoom factor for the page
            widthFactor = Math.min(maxWidth / pageSize.width, 1);
            heightFactor = Math.min(maxHeight / pageSize.height, 1);
            zoomFactor = Math.min(widthFactor, heightFactor);
            pageLoader.setZoomFactor(pageNode, zoomFactor);

            // Firefox has serious performance issues when rendering/scrolling
            // nodes with many SVG contents, convert to inline bitmaps instead
            if (_.browser.Firefox && childNode.is('img') && !/^data:/.test(childNode.attr('src'))) {
                pageLoader.convertImageToBitmap(childNode, pageSize);
            }
        }

        /**
         * Updates all preview pages currently shown, according to the visible
         * range in the scrollable area.
         */
        function updateVisiblePages() {

            var // position and size of visible area in scrollable area
                visiblePosition = Utils.getVisibleAreaPosition(scrollableNode),
                // top margin of group node, used as offset in position calculations
                topMargin = Utils.convertCssLength(self.getNode().css('margin-top'), 'px', 1),
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

            // abort old requests not yet running
            pageLoader.abortQueuedRequests();

            // load pages for all visible button nodes, clear pages of hidden button nodes
            buttonNodes.each(function () {

                var // one-based page index
                    page = Utils.getControlValue($(this)),
                    // whether the button is in the visible range
                    visible = (firstPage <= page) && (page <= lastPage),
                    // the page node already contained in the button node
                    pageNode = $(this).children('.page');

                // clear the page node if it is not visible anymore
                if (!visible) {
                    app.destroyImageNodes(pageNode.children('img'));
                    pageNode.empty();
                    return;
                }

                // do nothing if the page node is already initialized
                if (pageNode.children().length > 0) { return; }

                // load page and update node size with real page size
                pageLoader.loadPage(pageNode, page, 'low').done(function () {
                    updatePageSize(pageNode);
                });
            });
        }

        /**
         * Creates the button nodes for all pages and inserts them into the
         * root node of this group.
         */
        function createButtonNodes() {

            var // number of pages shown in the document
                pageCount = app.getModel().getPageCount(),
                // the HTML mark-up for the button nodes
                markup = '';

            // generate the HTML mark-up for all button nodes
            Utils.iterateRange(1, pageCount + 1, function (page) {
                markup += Utils.createButtonMarkup('<div class="page"></div>', { focusable: true, label: gt.noI18n(page) });
            });

            // insert the buttons into the group
            self.setChildMarkup(markup);
            buttonNodes = self.getNode().children();
            buttonNodes.removeAttr('tabindex');

            // set one-based page index as button value
            buttonNodes.each(function (index) { Utils.setControlValue($(this), index + 1); });
        }

        /**
         * Updates the position of the button nodes according to the current
         * width of the side pane.
         */
        function updateButtonNodes() {

            var // number of pages shown in the document
                pageCount = app.getModel().getPageCount(),
                // inner width available for button nodes
                innerWidth = scrollableNode.outerWidth() - 2 * HOR_MARGIN - Utils.SCROLLBAR_WIDTH,
                // initialize button nodes on first call
                initializeButtons = buttonNodes.length === 0,
                // the focused button (needs to be restored after detach/append)
                focusButton = Utils.getFocusedControl(buttonNodes);

            // do nothing, if the side pane is not visible, or no pages are available
            if ((pageCount === 0) || !self.isReallyVisible()) { return; }

            // create empty button nodes for all pages on first call
            if (initializeButtons) {
                createButtonNodes();
            }

            // calculate number of pages available per row, and effective button width
            columns = Math.max(1, Math.floor(innerWidth / BUTTON_WIDTH + 0.4));
            buttonWidth = Math.floor(innerWidth / columns);

            // update size of the own group node
            self.getNode().width(innerWidth).height(Math.ceil(pageCount / columns) * BUTTON_HEIGHT);

            // Update position and size of all button nodes. Detaching the
            // button nodes while updating them reduces total processing time
            // by 95% on touch devices!
            buttonNodes.detach().each(function () {

                var // one-based page index
                    page = Utils.getControlValue($(this)),
                    // zero-based column index of the button
                    col = (page - 1) % columns,
                    // zero-based row index of the button
                    row = Math.floor((page - 1) / columns);

                $(this).css({ left: col * buttonWidth, top: row * BUTTON_HEIGHT, width: buttonWidth, height: BUTTON_HEIGHT });
                updatePageSize($(this).children('.page'));
            });
            self.getNode().append(buttonNodes);
            // restore focus after detach/append
            focusButton.focus();

            // select active button on first call (after positioning the buttons)
            if (initializeButtons) {
                self.selectAndShowPage(view.getPage());
            }

            // update page data for all visible button nodes
            updateVisiblePages();
        }

        /**
         * Scrolls the scrollable node to the specified button node.
         */
        function scrollToButton(buttonNode) {
            if (self.isReallyVisible()) {
                Utils.scrollToChildNode(scrollableNode, buttonNode, { padding: 3 });
            }
        }

        /**
         * Handles keyboard events and moves the browser focus to a new button
         * node.
         */
        function keyDownHandler(event) {

            function showPage(diff) {

                var // the page number of the button currently focused
                    page = Utils.getControlValue($(document.activeElement));

                page = Utils.minMax(page + diff, 1, app.getModel().getPageCount());
                self.triggerChange(buttonNodes.eq(page - 1), { preserveFocus: true });
                buttonNodes.eq(page - 1).focus();
            }

            // no extra modifier keys must be pressed
            if (!KeyCodes.matchModifierKeys(event)) { return; }

            switch (event.keyCode) {
            case KeyCodes.SPACE:
                showPage(0);
                return false;
            case KeyCodes.LEFT_ARROW:
                showPage(-1);
                return false;
            case KeyCodes.RIGHT_ARROW:
                showPage(1);
                return false;
            case KeyCodes.UP_ARROW:
                showPage(-columns);
                return false;
            case KeyCodes.DOWN_ARROW:
                showPage(columns);
                return false;
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
            if ((1 <= page) && (page <= buttonNodes.length)) {
                scrollToButton(buttonNodes.eq(page - 1));
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
        sidePane.on('pane:show pane:resize', function () {
            self.selectAndShowPage(view.getPage());
        });

        // update pages while scrolling (debounced to skip a few scroll events)
        scrollableNode.on('scroll', app.createDebouncedMethod($.noop, updateVisiblePages, { delay: 50, maxDelay: 200 }));

        // keyboard navigation
        this.getNode().on('keydown', keyDownHandler);

        // keyboard focus traveling: scroll to focused node
        this.getNode().on('focusin', Utils.BUTTON_SELECTOR, function (event) {
            scrollToButton(event.target);
        });

    } // class PageGroup

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: PageGroup });

});
