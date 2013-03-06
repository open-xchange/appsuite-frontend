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
     'io.ox/office/framework/view/baseview',
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/style.css'
    ], function (Utils, BaseView, gt) {

    'use strict';

    var // predefined zoom-out factors
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
            pageNode = $('<div>', { tabindex: -1 }).addClass('page'),

            // current page index (one-based!)
            page = 0,

            // current zoom level (index into the predefined arrays)
            zoom = 0;

        // base constructor ---------------------------------------------------

        BaseView.call(this, app, grabFocusHandler, { scrollable: true, margin: '52px 30px' });

        // private methods ----------------------------------------------------

        /**
         * Sets the browser focus to the page node.
         */
        function grabFocusHandler() {
            pageNode.focus();
        }

        /**
         * Initialization after construction. Will be called once after
         * construction of the application is finished.
         */
        function initHandler() {

            var // the tool pane for upper tool boxes
                topPane = self.createPane('toppane', 'top', { overlay: true, transparent: true }),
                // the tool pane for lower tool boxes
                bottomPane = self.createPane('bottompane', 'bottom', { overlay: true, transparent: true });

            model = app.getModel();

            topPane.createToolBox('top', { hoverEffect: true, classes: 'right' })
                .createButton('app/quit', { icon: 'icon-remove', tooltip: gt('Close document') });

            bottomPane.createToolBox('bottom', { hoverEffect: true, classes: 'right' })
                .createGroupContainer(function () {
                    this.createButton('pages/first',    { icon: 'docs-first-page',    tooltip: gt('Show first page') })
                        .createButton('pages/previous', { icon: 'docs-previous-page', tooltip: gt('Show previous page') })
                        .createLabel('pages/current',   {                             tooltip: gt('Current page and total page count') })
                        .createButton('pages/next',     { icon: 'docs-next-page',     tooltip: gt('Show next page') })
                        .createButton('pages/last',     { icon: 'docs-last-page',     tooltip: gt('Show last page') });
                })
                .createGroupContainer(function () {
                    this.createButton('zoom/dec',    { icon: 'docs-zoom-out', tooltip: gt('Zoom out') })
                        .createLabel('zoom/current', {                        tooltip: gt('Current zoom factor') })
                        .createButton('zoom/inc',    { icon: 'docs-zoom-in',  tooltip: gt('Zoom in') });
                });

            // insert the page node into the application pane
            self.insertContentNode(pageNode);
        }

        /**
         * Fetches the specified page from the preview model and shows it with
         * the current zoom level in the page node.
         *
         * @param {Number} newPage
         *  The one-based index of the page to be shown.
         */
        function showPage(newPage) {

            var // a timeout for the window busy call
                busyPromise = null;

            // check that the page changes inside the allowed page range
            if ((page === newPage) || (newPage < 1) || (newPage > model.getPageCount())) {
                return;
            }
            page = newPage;

            // switch window to busy state after a short delay
            busyPromise = app.executeDelayed(function () { app.getWindow().busy(); }, { delay: 500 });

            // load the requested page
            model.loadPage(page)
            .done(function (html) {
                pageNode[0].innerHTML = html;
                updateZoom();
            })
            .fail(function () {
                self.showError(gt('Load Error'), gt('An error occurred while loading the page.'), { closeable: true });
            })
            .always(function () {
                app.getController().update();
                busyPromise.abort();
                app.getWindow().idle();
            });
        }

        /**
         * Recalculates the CSS zoom and margins, according to the current page
         * size and zoom level.
         */
        function updateZoom() {

            var // the current zoom factor
                factor = self.getZoomFactor() / 100,
                // the scale transformation
                scale = 'scale(' + factor + ')',
                // the SVG root node
                svgNode = pageNode.children().first(),
                // the vertical margin to adjust scroll size
                vMargin = svgNode.height() * (factor - 1) / 2,
                // the horizontal margin to adjust scroll size
                hMargin = svgNode.width() * (factor - 1) / 2;

            // CSS 'zoom' not supported in all browsers, need to transform with
            // scale(). But: transformations do not modify the element size, so
            // we need to modify page margin to get the correct scroll size.
            // Chrome bug/problem: sometimes, the page node has width 0 (e.g.,
            // if browser zoom is not 100%) regardless of existing SVG, must
            // set its size explicitly to see anything...
            svgNode.css({
                '-webkit-transform': scale,
                '-moz-transform': scale,
                '-ms-transform': scale,
                transform: scale,
                margin: vMargin + 'px ' + hMargin + 'px'
            });
            pageNode.css({
                width: svgNode.width() * factor,
                height: svgNode.height() * factor
            });

            // refresh view (scroll bars may have appeared or vanished)
            self.refreshPaneLayout();
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
            showPage(1);
            return this;
        };

        /**
         * Shows the previous page of the current document.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.showPreviousPage = function () {
            showPage(page - 1);
            return this;
        };

        /**
         * Shows the next page of the current document.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.showNextPage = function () {
            showPage(page + 1);
            return this;
        };

        /**
         * Shows the last page of the current document.
         *
         * @returns {PreviewView}
         *  A reference to this instance.
         */
        this.showLastPage = function () {
            showPage(model.getPageCount());
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
            showPage(Utils.getIntegerOption(point, 'page', 1, 1, model.getPageCount()));
        };

        // initialization -----------------------------------------------------

        // initialization after construction
        app.registerInitHandler(initHandler);

    } // class PreviewView

    // exports ================================================================

    // derive this class from class BaseView
    return BaseView.extend({ constructor: PreviewView });

});
