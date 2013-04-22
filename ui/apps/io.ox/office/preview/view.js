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
        };

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
            Utils.log('page=' + page + ' size=' + JSON.stringify(size));
            return ((size.width > 0) && (size.height > 0)) ? size : $.Deferred().reject();
        }

        // set transparency to container node while loading next page
        node = $(node).addClass('busy');

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

        // restore opacity after loading, clear node on error
        return def.always(function () { node.removeClass('busy'); }).fail(function () { node.empty(); }).promise();
    }

    // class PreviewGroup =====================================================

    var PreviewGroup = Group.extend({ constructor: function (app) {

        var // self reference
            self = this;

        // private methods ----------------------------------------------------

        function createButton(page) {

            var pageNode = $('<div>').addClass('page'),
                buttonNode = Utils.createButton({ value: page, label: String(page) });

            // insert the button node into the DOM before loading the image
            self.getNode().append(buttonNode.append(pageNode));

            // load the image and insert it into the button node
            loadPageIntoNode(pageNode, app.getModel(), page).done(function (size) {
                pageNode.width(70).height(90);
            });
        }

        function updateHandler(page) {
            Utils.selectOptionButton(self.getNode().children(), page);
        }

        // base constructor ---------------------------------------------------

        Group.call(this, { classes: 'page-preview' });

        // initialization -----------------------------------------------------

        this.registerUpdateHandler(updateHandler)
            .registerChangeHandler('click', { selector: Utils.BUTTON_SELECTOR });

        app.on('docs:import:success', function () {
            self.getNode().empty();
            _(app.getModel().getPageCount()).times(function (index) { createButton(index + 1); });
        });

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

            // the root node containing the current page contents
            pageNode = $('<div>').addClass('page'),

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
            self.insertContentNode(pageNode);

            // create the side pane
            self.addPane(sidePane = new SidePane(app, { position: 'right', css: { width: '249px' } })
                .addViewComponent(new ToolBox(app, { fixed: 'top' })
                    .addGroup('app/view/sidepane', new Button({ icon: 'docs-hide-sidepane', tooltip: gt('Hide side panel'), value: false }))
                    .addRightTab()
                    .addGroup('app/quit', new Button(GroupOptions.QUIT))
                )
                .addViewComponent(new Component(app)
                    .addGroup('pages/current', new PreviewGroup(app))
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

            // check that the page changes inside the allowed page range
            if ((page === newPage) || (newPage < 1) || (newPage > model.getPageCount())) {
                return;
            }

            // store new page index and show overlay status label
            page = newPage;
            showStatusLabel(self.getPageLabel());

            // switch application pane to busy state (this keeps the Close button active)
            self.appPaneBusy();

            // load the requested page, post-processing
            loadPageIntoNode(pageNode, model, page)
            .done(function (size) {
                // store original image size in page node (used in updateZoom() method)
                pageNode.data('size', size);
                updateZoom(scrollTo);
            })
            .fail(function () {
                self.showError(
                    gt('Load Error'),
                    //#. %1$d is the current page number that caused the error
                    //#, c-format
                    gt('An error occurred while loading page %1$d.', newPage),
                    { closeable: true }
                );
            })
            .always(function () {
                self.appPaneIdle();
                app.getController().update();
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
                factor = self.getZoomFactor() / 100,
                // the original size of the page
                originalSize = pageNode.data('size'),
                // the child node of the page representing the SVG contents
                childNode = pageNode.children().first(),
                // the vertical/horizontal margin to adjust scroll size
                vMargin = 0, hMargin = 0,
                // the application pane node
                appPaneNode = self.getAppPaneNode();

            if (childNode.is('img')) {
                childNode.width(originalSize.width * factor).height(originalSize.height * factor);
            } else if (childNode.length > 0) {

                // the horizontal and vertical margins to adjust scroll size
                hMargin = originalSize.width * (factor - 1) / 2;
                vMargin = originalSize.height * (factor - 1) / 2;

                // CSS 'zoom' not supported in all browsers, need to transform with
                // scale(). But: transformations do not modify the element size, so
                // we need to modify page margin to get the correct scroll size.
                Utils.setCssAttributeWithPrefixes(childNode, 'transform', 'scale(' + factor + ')');
                childNode.css('margin', vMargin + 'px ' + hMargin + 'px');

                // Chrome bug/problem: sometimes, the page node has width 0 (e.g.,
                // if browser zoom is not 100%) regardless of existing SVG, must
                // set its size explicitly to see anything...
                pageNode.width(originalSize.width * factor).height(originalSize.height * factor);
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
