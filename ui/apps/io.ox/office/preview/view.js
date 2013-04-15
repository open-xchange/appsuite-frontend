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
     'io.ox/office/tk/control/label',
     'io.ox/office/framework/view/baseview',
     'io.ox/office/framework/view/pane',
     'io.ox/office/framework/view/toolbox',
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/style.less'
    ], function (Utils, Button, Label, BaseView, Pane, ToolBox, gt) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // predefined zoom-out factors
        ZOOMOUT_FACTORS = [25, 35, 50, 75],

        // predefined zoom-in factors
        ZOOMIN_FACTORS = [150, 200, 300, 400, 600, 800, 1200, 1600];

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

            // the root node containing the current page contents
            pageNode = $('<div>').addClass('page'),

            // current page index (one-based!)
            page = 0,

            // current zoom level (index into the predefined arrays)
            zoom = 0;

        // base constructor ---------------------------------------------------

        BaseView.call(this, app, { scrollable: true, margin: '52px 30px ' + (52 + Utils.SCROLLBAR_HEIGHT) + 'px' });

        // private methods ----------------------------------------------------

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
         * Initialization after construction. Will be called once after
         * construction of the application is finished.
         */
        function initHandler() {

            model = app.getModel();

            self.addPane(new Pane(app, { position: 'top', classes: 'inline right', overlay: true, transparent: true, hoverEffect: true })
                .addViewComponent(new ToolBox(app)
                    .addGroup('app/quit', new Button({ icon: 'icon-remove', tooltip: gt('Close document') }))
                )
            );

            self.addPane(new Pane(app, { position: 'bottom', classes: 'inline right', overlay: true, transparent: true, hoverEffect: true })
                .addViewComponent(new ToolBox(app)
                    .addGroup('pages/first',    new Button({ icon: 'docs-first-page',    tooltip: gt('Show first page') }))
                    .addGroup('pages/previous', new Button({ icon: 'docs-previous-page', tooltip: gt('Show previous page') }))
                    .addGroup('pages/current',  new Label({                              tooltip: gt('Current page and total page count') }))
                    .addGroup('pages/next',     new Button({ icon: 'docs-next-page',     tooltip: gt('Show next page') }))
                    .addGroup('pages/last',     new Button({ icon: 'docs-last-page',     tooltip: gt('Show last page') }))
                    .addGap()
                    .addGroup('zoom/dec',     new Button({ icon: 'docs-zoom-out', tooltip: gt('Zoom out') }))
                    .addGroup('zoom/current', new Label({                         tooltip: gt('Current zoom factor') }))
                    .addGroup('zoom/inc',     new Button({ icon: 'docs-zoom-in',  tooltip: gt('Zoom in') }))
                )
            );

            // insert the page node into the application pane
            self.insertContentNode(pageNode);

            // listen to specific scroll keys to switch to previous/next page
            self.getAppPaneNode().on('keydown', keyHandler);
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

            var // the Deferred object waiting for the page contents
                def = null;

            // check that the page changes inside the allowed page range
            if ((page === newPage) || (newPage < 1) || (newPage > model.getPageCount())) {
                return;
            }
            page = newPage;

            // switch application pane to busy state (this keeps the Close button active)
            self.appPaneBusy();
            pageNode.empty();

            // load the requested page
            if (_.browser.Chrome) {
                // as SVG mark-up (Chrome does not show images in linked SVG)
                def = model.loadPageAsSvg(page).done(function (svgMarkup) {
                    pageNode[0].innerHTML = svgMarkup;
                });
            } else {
                // preferred: as an image element linking to the SVG file
                def = model.loadPageAsImage(page).done(function (imgNode) {
                    pageNode.append(imgNode);
                });
            }

            // post-processing
            def.done(function () {
                updateZoom(scrollTo);
            })
            .fail(function () {
                pageNode.empty();
                self.showError(gt('Load Error'), gt('An error occurred while loading the page.'), { closeable: true });
            })
            .always(function () {
                app.getController().update();
                // do not hide the busy animation if page has not been loaded correctly
                if ((pageNode.width() > 0) && (pageNode.height() > 0)) {
                    self.appPaneIdle();
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

            var // the current zoom factor
                factor = self.getZoomFactor() / 100,
                // the child node of the page representing the SVG contents
                childNode = pageNode.children().first(),
                // the vertical/horizontal margin to adjust scroll size
                vMargin = 0, hMargin = 0,
                // the application pane node
                appPaneNode = self.getAppPaneNode();

            if (childNode.is('img')) {
                // IE: must use width/height element attributes (instead of CSS attributes)
                childNode.css('max-width', 'none').attr({
                    width: childNode[0].naturalWidth * factor,
                    height: childNode[0].naturalHeight * factor
                });
            } else {

                // the vertical margin to adjust scroll size
                vMargin = childNode.height() * (factor - 1) / 2;
                // the horizontal margin to adjust scroll size
                hMargin = childNode.width() * (factor - 1) / 2;

                // CSS 'zoom' not supported in all browsers, need to transform with
                // scale(). But: transformations do not modify the element size, so
                // we need to modify page margin to get the correct scroll size.
                Utils.setCssAttributeWithPrefixes(childNode, 'transform', 'scale(' + factor + ')');
                childNode.css('margin', vMargin + 'px ' + hMargin + 'px');

                // Chrome bug/problem: sometimes, the page node has width 0 (e.g.,
                // if browser zoom is not 100%) regardless of existing SVG, must
                // set its size explicitly to see anything...
                pageNode.width(childNode.width() * factor).height(childNode.height() * factor);
            }

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
         * Returns the one-based index of the page currently shown.
         *
         * @returns {Number}
         *  The one-based index of the current page.
         */
        this.getPage = function () {
            return page;
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
            if (zoom > this.getMinZoomLevel()) {
                zoom -= 1;
                updateZoom();
            }
            return this;
        };

        /**
         * Increases the current zoom level by one, and updates the view.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.increaseZoomLevel = function () {
            if (zoom < this.getMaxZoomLevel()) {
                zoom += 1;
                updateZoom();
            }
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

        // initialization -----------------------------------------------------

        // initialization after construction
        app.registerInitHandler(initHandler);

    } // class PreviewView

    // exports ================================================================

    // derive this class from class BaseView
    return BaseView.extend({ constructor: PreviewView });

});
