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
     'io.ox/office/tk/view/view',
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/style.css'
    ], function (Utils, View, gt) {

    'use strict';

    var // minimum zoom level (25%)
        MIN_ZOOM = -4,

        // maximum zoom level (1600%)
        MAX_ZOOM = 8;

    // class PreviewView ======================================================

    /**
     * @constructor
     *
     * @extends View
     */
    function PreviewView(app) {

        var // self reference
            self = this,

            // the preview model
            model = null,

            // the root node containing the current page contents
            pageNode = $('<div>', { tabindex: 0 }).addClass('page'),

            // current page index (one-based!)
            page = 0,

            // current zoom level (0 means 100%, in steps of sqrt(2) up and down)
            zoom = 0;

        // base constructor ---------------------------------------------------

        View.call(this, app, { scrollable: true, margin: '52px 30px 30px' });

        // private methods ----------------------------------------------------

        /**
         * Initialization after construction. Will be called once after
         * construction of the application is finished.
         */
        function initHandler() {

            var // the tool pane for tool boxes
                toolPane = self.createPane('toolpane', 'top', { overlay: true, transparent: true, css: { textAlign: 'center' } });

            model = app.getModel();

            toolPane.createToolBox({ hoverEffect: true, classes: 'inline' })
                .addGroupContainer(function () {
                    this.addButton('pages/first',    { icon: 'arrow-first',    tooltip: gt('Show first page') })
                        .addButton('pages/previous', { icon: 'arrow-previous', tooltip: gt('Show previous page') })
                        .addLabel('pages/current',   {                         tooltip: gt('Current page and total page count') })
                        .addButton('pages/next',     { icon: 'arrow-next',     tooltip: gt('Show next page') })
                        .addButton('pages/last',     { icon: 'arrow-last',     tooltip: gt('Show last page') });
                })
                .addGroupContainer(function () {
                    this.addButton('zoom/dec',    { icon: 'icon-zoom-out', tooltip: gt('Zoom out') })
                        .addLabel('zoom/current', {                        tooltip: gt('Current zoom factor') })
                        .addButton('zoom/inc',    { icon: 'icon-zoom-in',  tooltip: gt('Zoom in') });
                });

            toolPane.createToolBox({ hoverEffect: true, css: { float: 'right', paddingRight: '26px' } })
                .addButton('app/quit', { icon: 'icon-remove', tooltip: gt('Close document') });

            // show alert banners above the overlay pane (floating buttons below alert banners)
            self.showAlertsBeforePane('toolpane');

            // insert the page node into the application pane
            self.insertContentNode(pageNode);
        }

        function showPage(newPage) {

            var // a timeout for the window busy call
                busyTimeout = null;

            // check that the page changes inside the allowed page range
            if ((page === newPage) || (newPage < 1) || (newPage > model.getPageCount())) {
                return;
            }
            page = newPage;

            // switch window to busy state after a short delay
            busyTimeout = app.executeDelayed(function () {
                app.getWindow().busy();
                busyTimeout = null;
            }, 500);

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
                if (busyTimeout) {
                    app.cancelDelayed(busyTimeout);
                } else {
                    app.getWindow().idle();
                }
            });
        }

        function updateZoom() {

            var // the current zoom factor
                factor = self.getZoomFactor() / 100,
                // the scale transformation
                scale = 'scale(' + factor + ')',
                // the vertical margin to adjust scroll size
                vMargin = pageNode.height() * (factor - 1) / 2,
                // the horizontal margin to adjust scroll size
                hMargin = pageNode.width() * (factor - 1) / 2;

            // CSS 'zoom' not supported in all browsers, need to transform with
            // scale(). But: transformations do not modify the element size, so
            // we need to modify page margin to get the correct scroll size.
            pageNode.css({
                '-webkit-transform': scale,
                '-moz-transform': scale,
                '-ms-transform': scale,
                transform: scale,
                margin: vMargin + 'px ' + hMargin + 'px'
            });
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the root DOM element containing the contents of the current
         * page.
         */
        this.getPageNode = function () {
            return pageNode;
        };

        this.grabFocus = function () {
            pageNode.focus();
            return this;
        };

        /**
         * Returns the one-based index of the page currently shown.
         */
        this.getPage = function () {
            return page;
        };

        /**
         * Shows the first page of the current document.
         */
        this.showFirstPage = function () {
            showPage(1);
        };

        /**
         * Shows the previous page of the current document.
         */
        this.showPreviousPage = function () {
            showPage(page - 1);
        };

        /**
         * Shows the next page of the current document.
         */
        this.showNextPage = function () {
            showPage(page + 1);
        };

        /**
         * Shows the last page of the current document.
         */
        this.showLastPage = function () {
            showPage(model.getPageCount());
        };

        this.getZoomLevel = function () {
            return zoom;
        };

        this.getMinZoomLevel = function () {
            return MIN_ZOOM;
        };

        this.getMaxZoomLevel = function () {
            return MAX_ZOOM;
        };

        this.decreaseZoomLevel = function () {
            if (zoom > MIN_ZOOM) {
                zoom -= 1;
                updateZoom();
            }
        };

        this.increaseZoomLevel = function () {
            if (zoom < MAX_ZOOM) {
                zoom += 1;
                updateZoom();
            }
        };

        this.getZoomFactor = function () {
            return Utils.roundSignificantDigits(100 * Math.pow(Math.SQRT2, zoom), 2);
        };

        this.getSavePoint = function () {
            return { page: page, zoom: zoom };
        };

        this.restoreFromSavePoint = function (point) {
            zoom = Utils.getIntegerOption(point, 'zoom', 0, MIN_ZOOM, MAX_ZOOM);
            showPage(Utils.getIntegerOption(point, 'page', 1, 1, model.getPageCount()));
        };

        // initialization -----------------------------------------------------

        // initialization after construction
        app.registerInitHandler(initHandler);

    } // class PreviewView

    // exports ================================================================

    // derive this class from class View
    return View.extend({ constructor: PreviewView });

});
