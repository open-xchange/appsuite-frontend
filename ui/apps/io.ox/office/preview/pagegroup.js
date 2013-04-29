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

    var // minimum horizontal distance between page buttons
        DISTANCE = 8,

        // fixed total width of a page button (two buttons in default side pane width)
        BUTTON_WIDTH = Math.floor((SidePane.DEFAULT_WIDTH - Utils.SCROLLBAR_WIDTH - 3 * DISTANCE) / 2),

        // fixed total height of a page button
        BUTTON_HEIGHT = BUTTON_WIDTH + 20;

    // class PageGroup ========================================================

    function PageGroup(app, scrollableNode) {

        var // self reference
            self = this,

            // all button elements currently created, mapped by page index
            buttonNodes = {},

            // number of pages per row
            columns = 0;

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
                left: col * (BUTTON_WIDTH + DISTANCE),
                top: row * BUTTON_HEIGHT + DISTANCE,
                width: BUTTON_WIDTH,
                height: BUTTON_HEIGHT
            };
        }

        /**
         * Creates a new button element representing the page with the passed
         * index.
         *
         * @param {Number} page
         *  The one-based index of the page.
         *
         * @returns {jQuery}
         *  The button element created by this method.
         */
        function createPageButton(page) {

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

            function updatePageSize(targetNode, pageSize) {

                var // the child node in the page, containing the SVG
                    childNode = targetNode.children().first(),
                    // the available width and height inside the button node
                    maxWidth = buttonNode.width(),
                    maxHeight = buttonNode.height() - 20,
                    // the zoom factor according to available size
                    widthFactor = Math.min(maxWidth / pageSize.width, 1),
                    heightFactor = Math.min(maxHeight / pageSize.height, 1),
                    zoomFactor = Math.min(widthFactor, heightFactor);

                // set the calculated zoom factor
                ViewUtils.setZoomFactor(targetNode, pageSize, zoomFactor);

                // Firefox has serious performance issues when rendering/scrolling
                // nodes with many SVG contents, convert SVG pages to inline bitmaps
                if (_.browser.Firefox && childNode.is('img')) {
                    ViewUtils.convertImageToBitmap(childNode, pageSize);
                }
            }

            // insert the button node and page node into the DOM before loading the image
            self.addChildNodes(buttonNode);
            app.getView().insertTemporaryNode(pageNode);

            // set default page size (DIN A* Portrait) before loading the page (in case of error)
            updatePageSize(busyNode, { width: 210, height: 297 });
            busyNode.append($('<div>').addClass('abs').busy());

            // load the image, update page size
            ViewUtils.loadPageIntoNode(pageNode, app.getModel(), page)
            .done(function (pageSize) {
                busyNode.remove();
                buttonNode.append(pageNode);
                updatePageSize(pageNode, pageSize);
            })
            .fail(function () {
                busyNode.empty().addClass('icon-remove').css({
                    color: '#f88',
                    fontSize: '60px',
                    lineHeight: busyNode.height() + 'px',
                    textDecoration: 'none' // otherwise, IE underlines when hovering
                });
            });

            return buttonNode;
        }

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
                // vertical range used to generate page buttons, in pixels (closed range)
                top = 0, bottom = 0,
                // row range visible in the scrollable node (closed range)
                firstRow = 0, lastRow = 0;

            // calculate number of pages available per row
            columns = Math.floor((visiblePosition.width - DISTANCE) / (BUTTON_WIDTH + DISTANCE));

            // update size of the own group node
            this.getNode()
                .width(columns * BUTTON_WIDTH + (columns - 1) * DISTANCE)
                .height(Math.ceil(pageCount / columns) * BUTTON_HEIGHT + 2 * DISTANCE);

            // expand visible range to include more pages than are really visible
            top = Math.max(0, visiblePosition.top - visiblePosition.height);
            bottom = visiblePosition.top + 2 * visiblePosition.height - 1;

            // get row range in visible area
            firstRow = Math.floor((top - DISTANCE) / BUTTON_HEIGHT);
            lastRow = Math.floor((bottom - DISTANCE) / BUTTON_HEIGHT);
            if (firstRow > lastRow) { firstRow = [lastRow, lastRow = firstRow][0]; }
            if (lastRow - firstRow < 2) { firstRow -= 1; lastRow += 1; }

            Utils.log('PageGroup.updatePages(): r1=' + firstRow + ' r2=' + lastRow);

            // TODO: delete/create pages on demand
            _(app.getModel().getPageCount()).times(function (index) {
                updatePageButton(index + 1);
            });

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
                buttonNode = updatePageButton(page);

            Utils.scrollToChildNode(scrollableNode, buttonNode, { padding: DISTANCE });
            updateHandler(page);
            return this;
        };

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateHandler)
            .registerChangeHandler('click', { selector: Utils.BUTTON_SELECTOR });

        // update pages while scrolling
        $(scrollableNode).on('scroll', app.createDebouncedMethod($.noop, function () {
            this.updatePages();
        }, { context: this, delay: 50, maxDelay: 200 }));

    } // class PageGroup

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: PageGroup });

});
