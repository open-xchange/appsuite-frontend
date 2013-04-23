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

define('io.ox/office/preview/view',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group',
     'io.ox/office/tk/control/button',
     'io.ox/office/tk/control/label',
     'io.ox/office/framework/view/baseview',
     'io.ox/office/framework/view/basecontrols',
     'io.ox/office/framework/view/pane',
     'io.ox/office/framework/view/sidepane',
     'io.ox/office/framework/view/component',
     'io.ox/office/framework/view/toolbox',
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/style.less'
    ], function (Utils, Group, Button, Label, BaseView, BaseControls, Pane, SidePane, Component, ToolBox, gt) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // predefined zoom-out factors
        ZOOMOUT_FACTORS = [25, 35, 50, 75],

        // predefined zoom-in factors
        ZOOMIN_FACTORS = [150, 200, 300, 400, 600, 800, 1200, 1600],

        // options for the button and label elements
        GroupOptions = {
            QUIT:    { icon: 'icon-remove',        tooltip: gt('Close document') },
            FIRST:   { icon: 'docs-first-page',    tooltip: gt('Show first page') },
            PREV:    { icon: 'docs-previous-page', tooltip: gt('Show previous page') },
            NEXT:    { icon: 'docs-next-page',     tooltip: gt('Show next page') },
            LAST:    { icon: 'docs-last-page',     tooltip: gt('Show last page') },
            ZOOMOUT: { icon: 'docs-zoom-out',      tooltip: gt('Zoom out') },
            ZOOMIN:  { icon: 'docs-zoom-in',       tooltip: gt('Zoom in') },
            PAGE:    { tooltip: gt('Current page and total page count') },
            ZOOM:    { tooltip: gt('Current zoom factor'), width: 65 }
        },

        // minimum horizontal distance between page thumbnail buttons
        PREVIEW_BUTTON_DISTANCE = 8,

        // fixed total width of a page thumbnail button
        PREVIEW_BUTTON_WIDTH = Math.floor((SidePane.DEFAULT_WIDTH - Utils.SCROLLBAR_WIDTH - 3 * PREVIEW_BUTTON_DISTANCE) / 2),

        // fixed total height of a page thumbnail button
        PREVIEW_BUTTON_HEIGHT = PREVIEW_BUTTON_WIDTH + 20;

    // private global functions ===============================================

    /**
     * Loads the specified page into the passed DOM node, after clearing all
     * its old contents. Loads either SVG mark-up as text and inserts it into
     * the passed DOM node, or an <img> element linking to an SVG file on the
     * server, depending on the current browser.
     *
     * @param {HTMLElement|jQuery} node
     *  The target node that will contain the loaded page.
     *
     * @param {PreviewModel} model
     *  The model that actually loads the page from the server.
     *
     * @param {Number} page
     *  The one-based page index.
     *
     * @returns {jQuery.Promise}
     *  The Promise of a Deferred object waiting for the image data. Will be
     *  resolved with the original size of the page (as object with the
     *  properties 'width' and 'height', in pixels).
     */
    function loadPageIntoNode(node, model, page) {

        var // the Deferred object waiting for the image
            def = null;

        function resolveSize(childNode) {
            var size = { width: childNode.width(), height: childNode.height() };
            return ((size.width > 0) && (size.height > 0)) ? size : $.Deferred().reject();
        }

        node = $(node);
        if (_.browser.Chrome) {
            // as SVG mark-up (Chrome does not show embedded images in <img> elements linked to an SVG file)
            def = model.loadPageAsSvg(page).then(function (svgMarkup) {
                node[0].innerHTML = svgMarkup;
                // resolve with original image size
                return resolveSize(node.children().first());
            });
        } else {
            // preferred: as an image element linking to the SVG file (Safari cannot parse SVG mark-up)
            def = model.loadPageAsImage(page).then(function (imgNode) {
                node.empty().append(imgNode.css({ maxWidth: '', width: '', height: '' }));
                // resolve with original image size (naturalWidth/naturalHeight with SVG does not work in IE10)
                return resolveSize(imgNode);
            });
        }

        // clear node on error
        return def.fail(function () { node.empty(); }).promise();
    }

    /**
     * Recalculates the size of the passed page node, according to the original
     * page size and zoom factor.
     *
     * @param {HTMLElement|jQuery} pageNode
     *  The page node containing the SVG contents.
     *
     * @param {Object} pageSize
     *  The original page size, as pixels, in 'width' and 'height' properties.
     *
     * @param {Number} zoomFactor
     *  The new zoom factor.
     */
    function setZoomFactor(pageNode, pageSize, zoomFactor) {

        var // the child node in the page, containing the SVG
            childNode = $(pageNode).children().first(),
            // the resulting width/height
            width = Math.floor(pageSize.width * zoomFactor),
            height = Math.floor(pageSize.height * zoomFactor);

        if (childNode.is('img')) {
            // <img> element: resize with CSS width/height
            childNode.width(width).height(height);
        } else {
            // <svg> element (Chrome): scale with CSS zoom (supported in WebKit)
            childNode.css('zoom', zoomFactor);
        }

        // Chrome bug/problem: sometimes, the page node has width 0 (e.g., if browser zoom is
        // not 100%) regardless of existing SVG, must set its size explicitly to see anything...
        $(pageNode).width(width).height(height);
    }

    /**
     * Converts the image data of the passed <img> element to an inline bitmap
     * represented by a data URL.
     *
     * @param {HTMLImageElement|jQuery} imgNode
     *  The <img> element.
     *
     * @param {Object} imageSize
     *  The original image size, as pixels, in 'width' and 'height' properties.
     */
    function convertImageToBitmap(imgNode, imageSize) {

        var // the size of the canvas (maximum four times the current image size)
            bitmapWidth = Math.min($(imgNode).width() * 4, imageSize.width),
            bitmapHeight = Math.min($(imgNode).height() * 4, imageSize.height),
            // the <canvas> element for SVG/bitmap conversion
            canvas = $('<canvas>').attr({ width: bitmapWidth, height: bitmapHeight })[0];

        try {
            canvas.getContext('2d').drawImage(Utils.getDomNode(imgNode), 0, 0, imageSize.width, imageSize.height, 0, 0, bitmapWidth, bitmapHeight);
            // currently, canvas.toDataURL() works in Firefox only, even with images from same origin
            $(imgNode).attr('src', canvas.toDataURL());
        } catch (ex) {
            Utils.error('convertImageToBitmap(): exception caucht: ' + ex);
        }
    }

    // class PreviewGroup =====================================================

    var PreviewGroup = Group.extend({ constructor: function (app) {

        var // self reference
            self = this,

            // all buttons currently created, mapped by page index
            buttons = {};

        // base constructor ---------------------------------------------------

        Group.call(this, { classes: 'page-preview' });

        // private methods ----------------------------------------------------

        /**
         * Creates and inserts a button element representing the page with the
         * passed index.
         *
         * @returns {jQuery}
         *  The button element created by this method.
         */
        function createButton(page) {

            var // the dummy node containing the busy animation
                busyNode = $('<div>').addClass('page'),
                // the page node containing the page contents
                pageNode = $('<div>').addClass('page'),
                // zero-based column and row index of the page in the preview area
                col = (page - 1) % 2,
                row = Math.floor((page - 1) / 2),
                // the button node containing the page node and the page number
                buttonNode = Utils.createButton({
                    value: page,
                    label: String(page),
                    css: {
                        left: col * (PREVIEW_BUTTON_WIDTH + PREVIEW_BUTTON_DISTANCE),
                        top: row * PREVIEW_BUTTON_HEIGHT + PREVIEW_BUTTON_DISTANCE,
                        width: PREVIEW_BUTTON_WIDTH,
                        height: PREVIEW_BUTTON_HEIGHT
                    }
                });

            function updatePageSize(node, pageSize) {

                var // the child node in the page, containing the SVG
                    childNode = node.children().first(),
                    // the available width and height inside the button node
                    maxWidth = buttonNode.width(),
                    maxHeight = buttonNode.height() - 20,
                    // the zoom factor according to available size
                    widthFactor = Math.min(maxWidth / pageSize.width, 1),
                    heightFactor = Math.min(maxHeight / pageSize.height, 1),
                    zoomFactor = Math.min(widthFactor, heightFactor);

                // set the calculated zoom factor
                setZoomFactor(node, pageSize, zoomFactor);

                // Firefox has serious performance issues when rendering/scrolling
                // nodes with many SVG contents, convert SVG pages to inline bitmaps
                if (_.browser.Firefox && childNode.is('img')) {
                    convertImageToBitmap(childNode, pageSize);
                }
            }

            // insert the button node into the DOM before loading the image
            self.addChildNodes(buttonNode.append(busyNode));
            app.getView().insertTemporaryNode(pageNode);

            // set default page size (DIN A* Portrait) before loading the page (in case of error)
            updatePageSize(busyNode, { width: 210, height: 297 });
            busyNode.append($('<div>').addClass('abs').busy());

            // load the image, update page size
            loadPageIntoNode(pageNode, app.getModel(), page)
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
         * Highlights the button representing the page with the passed index.
         */
        function updateHandler(page) {
            Utils.selectOptionButton(self.getNode().children(), page);
        }

        // methods ------------------------------------------------------------

        /**
         * Updates the thumbnail pages currently shown, according to the passed
         * visible range in the scrollable area.
         *
         * @param {Object} visiblePosition
         *  Position of the visible area.
         *
         * @returns {PreviewGroup}
         *  A reference to this instance.
         */
        this.updatePreview = function (visiblePosition) {
            _(app.getModel().getPageCount()).times(function (index) {
                var page = index + 1;
                if (!(page in buttons)) {
                    buttons[page] = createButton(page);
                }
            });
            return this;
        };

        // initialization -----------------------------------------------------

        // initialize total size of the preview area
        app.on('docs:import:success', function () {
            self.getNode()
                .width(2 * PREVIEW_BUTTON_WIDTH + PREVIEW_BUTTON_DISTANCE)
                .height(Math.floor(app.getModel().getPageCount() / 2) * PREVIEW_BUTTON_HEIGHT + 2 * PREVIEW_BUTTON_DISTANCE);
        });

        this.registerUpdateHandler(updateHandler)
            .registerChangeHandler('click', { selector: Utils.BUTTON_SELECTOR });

    }}); // class PreviewComponent

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

            // the main side pane containing the thumbnails
            sidePane = null,

            // tool pane floating over the top of the application pane
            topOverlayPane = null,

            // tool pane floating over the bottom of the application pane
            bottomOverlayPane = null,

            // the application status label
            statusLabel = new BaseControls.StatusLabel(app),

            // the page preview control
            previewGroup = null,

            // the root node containing the current page contents
            pageNode = $(),

            // unique page-change counter to synchronize deferred page loading
            uniqueId = 0,

            // current page index (one-based!)
            page = 0,

            // current zoom level (index into the predefined arrays)
            zoom = 0;

        // base constructor ---------------------------------------------------

        BaseView.call(this, app, {
            initHandler: initHandler,
            scrollable: true,
            margin: '52px 30px ' + (52 + Utils.SCROLLBAR_HEIGHT) + 'px'
        });

        // private methods ----------------------------------------------------

        /**
         * Initialization after construction.
         */
        function initHandler() {

            model = app.getModel();

            // create the side pane
            self.addPane(sidePane = new SidePane(app, { position: 'right' })
                .addViewComponent(new ToolBox(app, { fixed: 'top' })
                    .addGroup('app/view/sidepane', new Button({ icon: 'docs-hide-sidepane', tooltip: gt('Hide side panel'), value: false }))
                    .addRightTab()
                    .addGroup('app/quit', new Button(GroupOptions.QUIT))
                )
                .addViewComponent(new Component(app)
                    .addGroup('pages/current', previewGroup = new PreviewGroup(app))
                )
                .addViewComponent(new ToolBox(app, { fixed: 'bottom' })
                    .addGroup('pages/first',    new Button(GroupOptions.FIRST))
                    .addGroup('pages/previous', new Button(GroupOptions.PREV))
                    .addGroup('pages/next',     new Button(GroupOptions.NEXT))
                    .addGroup('pages/last',     new Button(GroupOptions.LAST))
                    .addRightTab()
                    .addGroup('zoom/dec', new Button(GroupOptions.ZOOMOUT))
                    .addGroup('zoom/inc', new Button(GroupOptions.ZOOMIN))
                )
            );

            // create the top overlay pane
            self.addPane(topOverlayPane = new Pane(app, { position: 'top', classes: 'inline right', overlay: true, transparent: true, hoverEffect: true })
                .addViewComponent(new ToolBox(app)
                    .addGroup('app/view/sidepane', new Button({ icon: 'docs-show-sidepane', tooltip: gt('Show side panel'), value: true }))
                    .addGap()
                    .addGroup('app/quit', new Button(GroupOptions.QUIT))
                )
            );

            // create the second overlay pane containing the status label
            self.addPane(new Pane(app, { position: 'top', classes: 'inline right', overlay: true, transparent: true })
                .addViewComponent(new ToolBox(app).addPrivateGroup(statusLabel))
            );

            // create the bottom overlay pane
            self.addPane(bottomOverlayPane = new Pane(app, { position: 'bottom', classes: 'inline right', overlay: true, transparent: true, hoverEffect: true })
                .addViewComponent(new ToolBox(app)
                    .addGroup('pages/first',    new Button(GroupOptions.FIRST))
                    .addGroup('pages/previous', new Button(GroupOptions.PREV))
                    .addGroup('pages/next',     new Button(GroupOptions.NEXT))
                    .addGroup('pages/last',     new Button(GroupOptions.LAST))
                    .addGap()
                    .addGroup('zoom/dec',     new Button(GroupOptions.ZOOMOUT))
                    .addGroup('zoom/inc',     new Button(GroupOptions.ZOOMIN))
                )
            );

            // initially, hide the side pane, and show the overlay tool bars
            self.toggleSidePane(false);

            // update preview pages if side pane is toggled
            sidePane.on('refresh:layout', function () {
                if (sidePane.isVisible()) {
                    previewGroup.updatePreview(Utils.getVisibleAreaPosition(sidePane.getScrollableNode()));
                }
            });

            // listen to specific scroll keys to switch to previous/next page
            self.getAppPaneNode().on('keydown', keyHandler);
        }

        /**
         * Handles 'keydown' events and show the previous/next page, if the
         * respective page boundary has been reached.
         */
        function keyHandler(event) {

            var // the scrollable application pane node
                scrollNode = self.getAppPaneNode()[0],
                // the original scroll position
                scrollPos = scrollNode.scrollTop;

            // ignore all key events with additional control keys
            if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
                return;
            }

            // handle supported keys
            switch (event.keyCode) {

            case KeyCodes.UP_ARROW:
            case KeyCodes.PAGE_UP:
                app.executeDelayed(function () {
                    if ((scrollPos === 0) && (scrollNode.scrollTop === 0)) {
                        showPage(page - 1, 'bottom');
                    }
                });
                break;

            case KeyCodes.DOWN_ARROW:
            case KeyCodes.PAGE_DOWN:
                app.executeDelayed(function () {
                    var bottomPos = Math.max(0, scrollNode.scrollHeight - scrollNode.clientHeight);
                    if ((scrollPos === bottomPos) && (scrollNode.scrollTop === bottomPos)) {
                        showPage(page + 1, 'top');
                    }
                });
                break;
            }
        }

        /**
         * Shows the status label with the passed caption text.
         */
        function showStatusLabel(caption) {
            statusLabel.update({ caption: caption, type: 'success', fadeOut: true });
        }

        /**
         * Fetches the specified page from the preview model and shows it with
         * the current zoom level in the page node.
         *
         * @param {Number} newPage
         *  The one-based index of the page to be shown.
         *
         * @param {String} [scrollTo]
         *  If set to the string 'top', the new page will be scrolled to the
         *  top border. If set to the string 'bottom', the new page will be
         *  scrolled to the bottom border. Otherwise, the scroll position will
         *  not be changed.
         */
        function showPage(newPage, scrollTo) {

            var // the new page node
                newPageNode = $('<div>').addClass('page'),
                // unique index for current call of this method
                currentId = 0;

            // check that the page changes inside the allowed page range
            if ((page === newPage) || (newPage < 1) || (newPage > model.getPageCount())) {
                return;
            }

            // store new page index and show overlay status label
            currentId = (uniqueId += 1);
            page = newPage;
            showStatusLabel(self.getPageLabel());
            app.getController().update();

            // switch application pane to busy state (this keeps the Close button active)
            self.appPaneBusy();
            pageNode.addClass('busy');

            // new page node must be part of the DOM for page size calculations
            self.insertTemporaryNode(newPageNode);

            // load the requested page, post-processing only if the current
            // page has not been changed again in the meantime
            loadPageIntoNode(newPageNode, model, page)
            .always(function () {
                if (currentId === uniqueId) {
                    self.appPaneIdle();
                    pageNode = newPageNode;
                    self.removeAllContentNodes().insertContentNode(pageNode);
                    app.getController().update();
                }
            })
            .done(function (size) {
                if (currentId === uniqueId) {
                    // store original image size in page node (will be used in method updateZoom())
                    pageNode.data('size', size);
                    updateZoom(scrollTo);
                }
            })
            .fail(function () {
                if (currentId === uniqueId) {
                    self.showError(
                        gt('Load Error'),
                        //#. %1$d is the current page number that caused the error
                        //#, c-format
                        gt('An error occurred while loading page %1$d.', newPage),
                        { closeable: true }
                    );
                }
            });
        }

        /**
         * Changes the zoom level and refreshes the page view.
         *
         * @param {Number} newZoom
         *  The new zoom level.
         */
        function changeZoom(newZoom) {
            if ((self.getMinZoomLevel() <= newZoom) && (newZoom <= self.getMaxZoomLevel()) && (zoom !== newZoom)) {
                zoom = newZoom;
                updateZoom();
                showStatusLabel(self.getZoomLabel());
            }
        }

        /**
         * Recalculates the CSS zoom and margins, according to the current page
         * size and zoom level.
         *
         * @param {String} [scrollTo]
         *  If set to the string 'top', the new page will be scrolled to the
         *  top border. If set to the string 'bottom', the new page will be
         *  scrolled to the bottom border. Otherwise, the scroll position will
         *  not be changed.
         */
        function updateZoom(scrollTo) {

            var // the current zoom factor
                zoomFactor = self.getZoomFactor() / 100,
                // the original size of the page
                pageSize = pageNode.data('size'),
                // the application pane node
                appPaneNode = self.getAppPaneNode();

            // set the current zoom factor to the page
            setZoomFactor(pageNode, pageSize, zoomFactor);

            // refresh view (scroll bars may have appeared or vanished)
            self.refreshPaneLayout();

            // update scroll position
            switch (scrollTo) {
            case 'top':
                appPaneNode.scrollTop(0);
                break;
            case 'bottom':
                appPaneNode.scrollTop(appPaneNode[0].scrollHeight);
                break;
            }
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
            sidePane.toggle(state);
            topOverlayPane.toggle(!state);
            bottomOverlayPane.toggle(!state);
            return this;
        };

        /**
         * Returns the one-based index of the page currently shown.
         *
         * @returns {Number}
         *  The one-based index of the current page.
         */
        this.getPage = function () {
            return page;
        };

        /**
         * Returns the one-based index of the page currently shown.
         *
         * @returns {Number}
         *  The one-based index of the current page.
         */
        this.getPageLabel = function () {
            // the gettext comments must be located directly before gt(), but
            // 'return' cannot be the last token in a line
            // -> use a temporary variable to store the result
            var label =
                //#. %1$s is the current page index in office document preview
                //#. %2$s is the number of pages in office document preview
                //#, c-format
                gt('Page %1$s of %2$s', page, model.getPageCount());
            return label;
        };

        /**
         * Shows the specified page of the current document.
         *
         * @param {Number} newPage
         *  The one-based index of the page to be shown.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.showPage = function (newPage) {
            showPage(newPage, 'top');
            return this;
        };

        /**
         * Shows the first page of the current document.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.showFirstPage = function () {
            showPage(1, 'top');
            return this;
        };

        /**
         * Shows the previous page of the current document.
         *
         * @param {jQuery.Event} [event]
         *  The 'keydown' event object, if called from a keyboard shortcut.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.showPreviousPage = function (event) {
            showPage(page - 1, 'top');
            return this;
        };

        /**
         * Shows the next page of the current document.
         *
         * @param {jQuery.Event} [event]
         *  The 'keydown' event object, if called from a keyboard shortcut.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.showNextPage = function (event) {
            showPage(page + 1, 'top');
            return this;
        };

        /**
         * Shows the last page of the current document.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.showLastPage = function () {
            showPage(model.getPageCount(), 'bottom');
            return this;
        };

        /**
         * Returns the current zoom level. The zoom level is a zero-based array
         * index into the table of predefined zoom factors.
         *
         * @returns {Number}
         *  The current zoom level.
         */
        this.getZoomLevel = function () {
            return zoom;
        };

        /**
         * Returns the minimum zoom level.
         *
         * @returns {Number}
         *  The minimum zoom level.
         */
        this.getMinZoomLevel = function () {
            return -ZOOMOUT_FACTORS.length;
        };

        /**
         * Returns the maximum zoom level.
         *
         * @returns {Number}
         *  The maximum zoom level.
         */
        this.getMaxZoomLevel = function () {
            return ZOOMIN_FACTORS.length;
        };

        /**
         * Decreases the current zoom level by one, and updates the view.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.decreaseZoomLevel = function () {
            changeZoom(zoom - 1);
            return this;
        };

        /**
         * Increases the current zoom level by one, and updates the view.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.increaseZoomLevel = function () {
            changeZoom(zoom + 1);
            return this;
        };

        /**
         * Returns the current zoom factor in percent.
         *
         * @returns {Number}
         *  The current zoom factor in percent.
         */
        this.getZoomFactor = function () {
            return (zoom === 0) ? 100 : (zoom < 0) ? ZOOMOUT_FACTORS[ZOOMOUT_FACTORS.length + zoom] : ZOOMIN_FACTORS[zoom - 1];
        };

        this.getZoomLabel = function () {
            // the gettext comments must be located directly before gt(), but
            // 'return' cannot be the last token in a line
            // -> use a temporary variable to store the result
            var label =
                //#. %1$d is the current zoom factor, in percent
                //#, c-format
                gt('Zoom: %1$d%', this.getZoomFactor());
            return label;
        };

        /**
         * Returns a save point containing all settings needed to restore the
         * current view settings.
         *
         * @returns {Object}
         *  A save point with all view settings.
         */
        this.getSavePoint = function () {
            return { page: page, zoom: zoom };
        };

        /**
         * Restores the view from the passed save point.
         *
         * @param {Object} point
         *  A save point that has been created before by the method
         *  PreviewView.getSavePoint().
         */
        this.restoreFromSavePoint = function (point) {
            zoom = Utils.getIntegerOption(point, 'zoom', 0, this.getMinZoomLevel(), this.getMaxZoomLevel());
            showPage(Utils.getIntegerOption(point, 'page', 1, 1, model.getPageCount()), 'top');
        };

    } // class PreviewView

    // exports ================================================================

    // derive this class from class BaseView
    return BaseView.extend({ constructor: PreviewView });

});
