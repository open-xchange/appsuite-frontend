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
     'io.ox/office/tk/control/button',
     'io.ox/office/framework/view/baseview',
     'io.ox/office/framework/view/basecontrols',
     'io.ox/office/framework/view/pane',
     'io.ox/office/framework/view/sidepane',
     'io.ox/office/framework/view/component',
     'io.ox/office/framework/view/toolbox',
     'io.ox/office/preview/viewutils',
     'io.ox/office/preview/controls',
     'io.ox/office/preview/pagegroup',
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/style.less'
    ], function (Utils, Button, BaseView, BaseControls, Pane, SidePane, Component, ToolBox, ViewUtils, PreviewControls, PageGroup, gt) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // predefined zoom factors
        ZOOM_FACTORS = [25, 35, 50, 75, 100, 150, 200, 300, 400, 600, 800, 1200, 1600],

        // margins between page and border of application pane
        CONTENT_MARGIN = { left: 30, right: 30, top: 52, bottom: 52 + Utils.SCROLLBAR_HEIGHT },

        // margins between overlay panes and border of application pane
        OVERLAY_MARGIN = { left: 8, right: Utils.SCROLLBAR_WIDTH + 8, bottom: Utils.SCROLLBAR_HEIGHT };

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

            // the status label for the page number and zoom factor
            statusLabel = new BaseControls.StatusLabel(app),

            // the tool box containing page and zoom control groups
            bottomToolBox = null,

            // the page preview control
            pageGroup = null,

            // the root node containing the current page contents
            pageNode = $(),

            // unique page-change counter to synchronize deferred page loading
            uniqueId = 0,

            // current page index (one-based!)
            page = 0,

            // current zoom type (percentage or keyword)
            zoomType = 100,

            // the current effective zoom factor, in percent
            zoomFactor = 100;

        // base constructor ---------------------------------------------------

        BaseView.call(this, app, {
            initHandler: initHandler,
            grabFocusHandler: grabFocusHandler,
            scrollable: true,
            contentMargin: CONTENT_MARGIN,
            overlayMargin: { left: 8, right: Utils.SCROLLBAR_WIDTH + 8, bottom: Utils.SCROLLBAR_HEIGHT }
        });

        // private methods ----------------------------------------------------

        /**
         * Initialization after construction.
         */
        function initHandler() {

            model = app.getModel();

            // make the application pane focusable for global navigation with F6 key
            self.getAppPaneNode().addClass('f6-target').attr('tabindex', 1);

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
                    .addGroup('app/quit', new Button(BaseControls.QUIT_OPTIONS))
                )
                .addViewComponent(new Component(app)
                    .addGroup('pages/current', pageGroup)
                )
                .addViewComponent(new ToolBox(app, { fixed: 'bottom' })
                    .addGroup('pages/previous', new Button(PreviewControls.PREV_OPTIONS))
                    .addGroup('pages/current',  new PreviewControls.PageChooser())
                    .addGroup('pages/next',     new Button(PreviewControls.NEXT_OPTIONS))
                    .addRightTab()
                    .addGroup('zoom/dec',  new Button(PreviewControls.ZOOMOUT_OPTIONS))
                    .addGroup('zoom/type', new PreviewControls.ZoomTypeChooser())
                    .addGroup('zoom/inc',  new Button(PreviewControls.ZOOMIN_OPTIONS))
                );

            // create the top overlay pane
            self.addPane(topOverlayPane = new Pane(app, { position: 'top', classes: 'inline right', overlay: true, transparent: true, hoverEffect: true })
                .addViewComponent(new ToolBox(app)
                    .addGroup('app/view/sidepane', new Button(BaseControls.SHOW_SIDEPANE_OPTIONS))
                    .addGap()
                    .addGroup('app/quit', new Button(BaseControls.QUIT_OPTIONS))
                )
            );

            // create the bottom overlay pane
            self.addPane(new Pane(app, { position: 'bottom', classes: 'inline right', overlay: true, transparent: true })
                .addViewComponent(new ToolBox(app, { focusable: false })
                    .addPrivateGroup(statusLabel)
                )
                .addViewComponent(bottomToolBox = new ToolBox(app, { hoverEffect: true })
                    .addGroup('pages/previous', new Button(PreviewControls.PREV_OPTIONS))
                    .addGroup('pages/current',  new PreviewControls.PageChooser())
                    .addGroup('pages/next',     new Button(PreviewControls.NEXT_OPTIONS))
                    .addGap()
                    .addGroup('zoom/dec',  new Button(PreviewControls.ZOOMOUT_OPTIONS))
                    .addGroup('zoom/type', new PreviewControls.ZoomTypeChooser())
                    .addGroup('zoom/inc',  new Button(PreviewControls.ZOOMIN_OPTIONS))
                )
            );

            // initially, hide the side pane, and show the overlay tool bars
            self.toggleSidePane(false);

            // listen to specific scroll keys to switch to previous/next page
            self.getAppPaneNode().on('keydown', keyHandler);

            // set focus to application pane after import
            app.on('docs:import:after', function () {
                self.on('refresh:layout', function () { updateZoom(); });
                self.grabFocus();
            });
        }

        /**
         * Moves the browser focus to the application pane.
         */
        function grabFocusHandler() {
            self.getAppPaneNode().focus();
            // Bug 25924: sometimes, Firefox selects the entire page
            window.getSelection().removeAllRanges();
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
                    if ((scrollPos === 0) && (scrollNode.scrollTop === 0) && !pageNode.hasClass('busy')) {
                        showPage(page - 1, 'bottom');
                        app.getController().update();
                    }
                });
                break;

            case KeyCodes.DOWN_ARROW:
            case KeyCodes.PAGE_DOWN:
                app.executeDelayed(function () {
                    var bottomPos = Math.max(0, scrollNode.scrollHeight - scrollNode.clientHeight);
                    if ((scrollPos === bottomPos) && (scrollNode.scrollTop === bottomPos) && !pageNode.hasClass('busy')) {
                        showPage(page + 1, 'top');
                        app.getController().update();
                    }
                });
                break;
            }
        }

        /**
         * Updates the status label with the current page number.
         */
        function updatePageStatus() {
            statusLabel.update({
                caption:
                    //#. %1$s is the current page index in office document preview
                    //#. %2$s is the number of pages in office document preview
                    //#, c-format
                    gt('Page %1$s of %2$s', page, model.getPageCount()),
                type: 'info'
            });
        }

        /**
         * Shows the current zoom factor in the status label for a short time,
         * then switches back to the display of the current page number.
         */
        var updateZoomStatus = app.createDebouncedMethod(function () {
            statusLabel.update({
                caption:
                    //#. %1$d is the current zoom factor, in percent
                    //#, c-format
                    gt('Zoom: %1$d%', zoomFactor),
                type: 'info'
            });
        }, updatePageStatus, { delay: 1000 });

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

            // store new page index, update preview, and show overlay status label
            currentId = (uniqueId += 1);
            page = newPage;
            pageGroup.selectAndShowPage(page);
            updatePageStatus();

            // switch application pane to busy state (this keeps the Close button active)
            self.appPaneBusy();
            pageNode.addClass('busy');

            // new page node must be part of the DOM for page size calculations
            self.insertTemporaryNode(newPageNode);

            // load the requested page, post-processing only if the current
            // page has not been changed again in the meantime
            ViewUtils.loadPageIntoNode(newPageNode, model, page, { fetchSiblings: true })
            .always(function () {
                if (currentId === uniqueId) {
                    self.appPaneIdle();
                    pageNode = newPageNode;
                    self.removeAllContentNodes().insertContentNode(pageNode);
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

            var // the original size of the page
                pageSize = pageNode.data('size'),
                // the application pane node
                appPaneNode = self.getAppPaneNode(),
                // the available width for a page in the application pane
                availableWidth = appPaneNode[0].clientWidth - CONTENT_MARGIN.left - CONTENT_MARGIN.right,
                // the available height for a page in the application pane
                availableHeight = appPaneNode[0].clientHeight - CONTENT_MARGIN.top - CONTENT_MARGIN.bottom;

            // calculate the effective zoom factor
            if (_.isNumber(zoomType)) {
                zoomFactor = zoomType;
            } else if (_.isObject(pageSize)) {
                switch (zoomType) {
                case 'width':
                    zoomFactor = Math.min(Math.floor(availableWidth / pageSize.width * 100), 100);
                    break;
                case 'page':
                    zoomFactor = Math.min(Math.floor(availableWidth / pageSize.width * 100), Math.floor(availableHeight / pageSize.height * 100), 100);
                    break;
                default:
                    Utils.warn('PreviewView.updateZoom(): unsupported zoom type "' + zoomType + '"');
                    zoomFactor = 100;
                }
            } else {
                zoomFactor = 100;
            }
            zoomFactor = Utils.minMax(zoomFactor, self.getMinZoomFactor(), self.getMaxZoomFactor());

            // set the current zoom factor to the page (prevent zooming on invalid pages)
            if (_.isObject(pageSize)) {
                ViewUtils.setZoomFactor(pageNode, pageSize, zoomFactor / 100);
            }

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
            this.lockPaneLayout(function () {
                sidePane.toggle(state);
                topOverlayPane.toggle(!state);
                bottomToolBox.toggle(!state);
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
            return page;
        };

        /**
         * Shows the specified page of the current document.
         *
         * @param {Number|String} newPage
         *  The one-based index of the page to be shown; or one of the keywords
         *  'first', 'previous', 'next', or 'last'.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.showPage = function (newPage) {

            // fixed page number
            if (_.isNumber(newPage)) {
                showPage(newPage, 'top');
            }

            // page keyword
            switch (newPage) {
            case 'first':
                showPage(1, 'top');
                break;
            case 'previous':
                showPage(page - 1, 'top');
                break;
            case 'next':
                showPage(page + 1, 'top');
                break;
            case 'last':
                showPage(model.getPageCount(), 'bottom');
                break;
            }

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
                updateZoom();
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

        /**
         * Returns a save point containing all settings needed to restore the
         * current view settings.
         *
         * @returns {Object}
         *  A save point with all view settings.
         */
        this.getSavePoint = function () {
            return { page: page, zoom: zoomType };
        };

        /**
         * Restores the view from the passed save point.
         *
         * @param {Object} point
         *  A save point that has been created before by the method
         *  PreviewView.getSavePoint().
         */
        this.restoreFromSavePoint = function (point) {

            // restore zoom type
            zoomType = Utils.getOption(point, 'zoom');
            if (_.isNumber(zoomType)) {
                zoomType = Math.round(zoomType);
            } else if (!_.isString(zoomType) || (zoomType.length === 0)) {
                zoomType = 100;
            }

            // show the last visited page, update GUI
            showPage(Utils.getIntegerOption(point, 'page', 1, 1, model.getPageCount()), 'top');
            app.getController().update();
        };

    } // class PreviewView

    // exports ================================================================

    // derive this class from class BaseView
    return BaseView.extend({ constructor: PreviewView });

});
