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

            // all button elements currently created, mapped by page index
            buttonNodes = {},

            // number of pages per row
            columns = 0,

            // current button width, in pixels
            buttonWidth = 0;

        // base constructor ---------------------------------------------------

        Group.call(this, { classes: 'page-preview' });

        // private methods ----------------------------------------------------

        /**
         * Returns the position and size the button element of the specified
         * page would take, according to the current size of the scrollable
         * area.
         *
         * @param {Number} page
         *  The one-based index of the page.
         */
        function getPageButtonRectangle(page) {

            var // zero-based column index of the button
                col = (page - 1) % columns,
                // zero-based row index of the button
                row = Math.floor((page - 1) / columns);

            return {
                left: col * buttonWidth,
                top: row * BUTTON_HEIGHT,
                width: buttonWidth,
                height: BUTTON_HEIGHT
            };
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
        var createPageButton = (function () {

            var // list of pending buttons waiting to load their page contents
                pendingInfos = [];

            // direct callback: called every time when createPageButton() has been called
            function createButtonNode(page) {

                var // the dummy node containing the busy animation
                    busyNode = $('<div>').addClass('page'),
                    // the page node containing the page contents
                    pageNode = $('<div>').addClass('page'),
                    // the button node containing the page node and the page number
                    buttonNode = Utils.createButton({
                        value: page,
                        label: String(page),
                        css: getPageButtonRectangle(page)
                    }).append(busyNode);

                // select button of active page
                Utils.toggleButtons(buttonNode, page === app.getView().getPage());

                // insert the button node and page node into the DOM before loading the image
                self.addChildNodes(buttonNode);
                app.getView().insertTemporaryNode(pageNode);

                // set default page size (DIN A* Portrait) before loading the page (in case of error)
                updatePageSize(buttonNode, busyNode, { width: 210, height: 297 });
                busyNode.append($('<div>').addClass('abs').busy());

                // register the nodes for the deferred callback loading the page contents
                pendingInfos.push({ page: page, buttonNode: buttonNode, busyNode: busyNode, pageNode: pageNode });

                return buttonNode;
            }

            // deferred callback: loads the pages into the existing button nodes
            function loadPages() {

                var // pending nodes and page number
                    pendingInfo = null;

                // find a pending button that is still in the DOM (buttons may have been removed in the meantime)
                while ((pendingInfo = pendingInfos.shift()) && !Utils.containsNode(self.getNode(), pendingInfo.buttonNode)) {}
                if (!pendingInfo) { return; }

                // load the page into the button node
                ViewUtils.loadPageIntoNode(pendingInfo.pageNode, app.getModel(), pendingInfo.page)
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

                // if more pages are waiting, return true to repeat deferred callback after the delay
                return pendingInfos.length > 0;
            }

            // create and return the debounced createPageButton() method
            return app.createDebouncedMethod(createButtonNode, loadPages, { delay: 25, repeat: true });

        }()); // end of local scope of createPageButton()

        /**
         * Updates the position and size of the specified page button. Creates
         * a new page button if necessary.
         *
         * @param {Number} page
         *  The one-based index of the page.
         *
         * @returns {jQuery}
         *  The button element.
         */
        function updatePageButton(page) {

            if (page in buttonNodes) {
                buttonNodes[page].css(getPageButtonRectangle(page));
            } else {
                buttonNodes[page] = createPageButton(page);
            }

            return buttonNodes[page];
        }

        /**
         * Highlights the button representing the page with the passed index.
         */
        function updateHandler(page) {
            Utils.selectOptionButton(self.getNode().children(), page);
        }

        // methods ------------------------------------------------------------

        /**
         * Updates all preview pages currently shown, according to the visible
         * range in the scrollable area.
         *
         * @returns {PageGroup}
         *  A reference to this instance.
         */
        this.updatePages = function () {

            var // number of pages shown in the document
                pageCount = app.getModel().getPageCount(),
                // position and size of visible area in scrollable area
                visiblePosition = Utils.getVisibleAreaPosition(scrollableNode),
                // inner width available for button nodes
                innerWidth = visiblePosition.width - 2 * HOR_MARGIN,
                // top margin of group node, used as offset in position calculations
                topMargin = Utils.convertCssLength(this.getNode().css('margin-top'), 'px', 0),
                // row range visible in the scrollable node (closed range)
                firstRow = 0, lastRow = 0,
                // page range visible in the scrollable node (closed range)
                firstPage = 0, lastPage = 0;

            // calculate number of pages available per row, and effective button width
            columns = Math.max(1, Math.floor(innerWidth / BUTTON_WIDTH + 0.4));
            buttonWidth = Math.floor(innerWidth / columns);

            // update size of the own group node
            this.getNode().width(innerWidth).height(Math.ceil(pageCount / columns) * BUTTON_HEIGHT);

            // get row range in visible area (add a row above and below)
            firstRow = Math.floor((visiblePosition.top - topMargin) / BUTTON_HEIGHT) - 1;
            lastRow = Math.floor((visiblePosition.top + visiblePosition.height - topMargin) / BUTTON_HEIGHT) + 1;

            // get one-based page range in visible area (restrict range to pages in document)
            firstPage = Math.max(1, firstRow * columns + 1);
            lastPage = Math.min(app.getModel().getPageCount(), (lastRow + 1) * columns);

            // remove existing page buttons not shown anymore
            _(buttonNodes).each(function (buttonNode, page) {
                if ((page < firstPage) || (page > lastPage)) {
                    buttonNode.remove();
                    delete buttonNodes[page];
                }
            });

            // create missing page buttons, update position of all existing pages
            Utils.iterateRange(firstPage, lastPage + 1, updatePageButton);

            return this;
        };

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

            var // the button node of the specified page (created if necessary)
                buttonNode = sidePane.isVisible() ? updatePageButton(page) : null;

            if (buttonNode) {
                Utils.scrollToChildNode(scrollableNode, buttonNode, { padding: 25 });
                updateHandler(page);
            }
            return this;
        };

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateHandler)
            .registerChangeHandler('click', { selector: Utils.BUTTON_SELECTOR });

        // update pages while scrolling (debounced to skip a few scroll events)
        scrollableNode.on('scroll', app.createDebouncedMethod($.noop, function () {
            this.updatePages();
        }, { context: this, delay: 50, maxDelay: 200 }));

        // when refreshing the side pane (e.g. due to changed size of browser
        // window), update the pages shown in the current visible area
        sidePane.on('refresh:layout', function () {
            self.updatePages();
        });

        // when showing or resizing the side pane, scroll to current page
        sidePane.on('show resize', function (event) {
            self.selectAndShowPage(app.getView().getPage());
        });

    } // class PageGroup

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: PageGroup });

});
