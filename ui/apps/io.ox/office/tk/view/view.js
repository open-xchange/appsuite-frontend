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

define('io.ox/office/tk/view/view',
        ['io.ox/office/tk/utils',
         'io.ox/office/tk/view/pane'
        ], function (Utils, Pane) {

    'use strict';

    // private global functions ===============================================

    /**
     * Translates the two passed boolean flags describing a pane position to
     * the correct name of a window border side.
     *
     * @param {Boolean} horizontal
     *  If true, selects horizontal panes (top or bottom); otherwise, selects
     *  vertical panes (left or right).
     *
     * @param {Boolean} leading
     *  If true, selects the leading pane (top or left); otherwise, selects the
     *  trailing pane (bottom or right).
     */
    function getPaneSide(horizontal, leading) {
        return horizontal ? (leading ? 'top' : 'bottom') : (leading ? 'left' : 'right');
    }

    // class View =============================================================

    /**
     * Base class for the view instance of an office application. Creates the
     * application window, and provides functionality to create and control the
     * top, bottom, and side pane elements.
     *
     * @param {Object} [options]
     *  Additional options to control the appearance of the view. The following
     *  options are supported:
     *  @param {Number} [options.modelPadding=0]
     *      The padding of the model root node to the borders of the scrollable
     *      application pane.
     */
    function View(app, options) {

        var // the application controller
            controller = app.getController(),

            // the application window
            win = ox.ui.createWindow({ name: app.getName() }),

            // centered application pane
            appPane = null,

            // application model container node
            modelContainerNode = $('<div>').addClass('app-pane-model-container'),

            // all pane instances, mapped by identifier, and by border side
            panes = { all: {}, top: [], bottom: [], left: [], right: [] },

            // inner shadows for application pane
            shadowNodes = {};

        // private methods ----------------------------------------------------

        /**
         * Handles resize events of the browser window, and adjusts the view
         * pane nodes.
         */
        function windowResizeHandler(event) {

            var // current offsets representing available space in the application window
                offsets = { top: 0, bottom: 0, left: 0, right: 0 };

            // updates the position of a single pane, and updates the 'offsets' object
            function updatePane(pane, horizontal, leading) {

                var paneNode = pane.getNode(),
                    paneOffsets = null;

                if (paneNode.css('display') !== 'none') {
                    paneOffsets = _.clone(offsets);
                    paneOffsets[getPaneSide(horizontal, !leading)] = 'auto';
                    paneNode.css(paneOffsets);
                    offsets[getPaneSide(horizontal, leading)] += (horizontal ? paneNode.outerHeight() : paneNode.outerWidth());
                }
            }

            // updates the top and bottom panes
            function updateHorizontalPanes() {
                _(panes.top).each(function (pane) { updatePane(pane, true, true); });
                _(panes.bottom).each(function (pane) { updatePane(pane, true, false); });
            }

            // updates the left and right panes
            function updateVerticalPanes() {
                _(panes.left).each(function (pane) { updatePane(pane, false, true); });
                _(panes.right).each(function (pane) { updatePane(pane, false, false); });
            }

            // start with panes located at the smaller sides of the window
            if (win.nodes.main.width() < win.nodes.main.height()) {
                updateHorizontalPanes();
                updateVerticalPanes();
            } else {
                updateVerticalPanes();
                updateHorizontalPanes();
            }

            // update the application pane and the shadow nodes (jQuery interprets numbers as pixels automatically)
            appPane.getNode().css(offsets);
            shadowNodes.top.css({ top: offsets.top - 10, height: 10, left: offsets.left, right: offsets.right });
            shadowNodes.bottom.css({ bottom: offsets.bottom - 10, height: 10, left: offsets.left, right: offsets.right });
            shadowNodes.left.css({ top: offsets.top, bottom: offsets.bottom, left: offsets.left - 10, width: 10 });
            shadowNodes.right.css({ top: offsets.top, bottom: offsets.bottom, right: offsets.right - 10, width: 10 });
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the central DOM node of the application (the complete inner
         * area between all existing view panes). This is always the parent
         * node of the application model root node.
         *
         * @returns {jQuery}
         *  The central DOM node of the application.
         */
        this.getApplicationNode = function () {
            return appPane.getNode();
        };

        /**
         * Returns the specified view pane which has been added with the method
         * View.createPane() before.
         *
         * @param {String} id
         *  The unique identifier of the view pane.
         *
         * @returns {Pane|Null}
         *  The view pane with the specified identifier, or null if no view
         *  pane has been found.
         */
        this.getPane = function (id) {
            return (id in panes.all) ? panes.all[id] : null;
        };

        /**
         * Adds the passed view pane instance into this view.
         *
         * @param {String} id
         *  The unique identifier of the view pane.
         *
         * @param {Pane} pane
         *  The new view pane instance.
         *
         * @param {String} side
         *  The border of the application window to attach the view pane to.
         *  Supported values are 'top', 'bottom', 'left', and 'right'.
         *
         * @returns {View}
         *  A reference to this instance.
         */
        this.addPane = function (id, pane, side) {
            if (_.isArray(panes[side])) {
                panes.all[id] = pane;
                panes[side].push(pane);
                win.nodes.main.append(pane.getNode().addClass(side));
                windowResizeHandler();
            }
            return this;
        };

        this.showPane = function (id) {
            if (id in panes.all) {
                panes.all[id].getNode().show();
                windowResizeHandler();
            }
            return this;
        };

        this.hidePane = function (id) {
            if (id in panes.all) {
                panes.all[id].getNode().hide();
                windowResizeHandler();
            }
            return this;
        };

        this.togglePane = function (id, state) {
            if (id in panes.all) {
                panes.all[id].getNode().toggle(state);
                windowResizeHandler();
            }
            return this;
        };

        this.destroy = function () {
            _(panes.all).invoke('destroy');
            appPane.destroy();
            win = appPane = panes = null;
        };

        // initialization -----------------------------------------------------

        // set the window at the application instance
        app.setWindow(win);

        // insert the document model root node into the container node
        modelContainerNode.append(app.getModel().getNode());
        modelContainerNode.css('margin', Utils.getIntegerOption(options, 'modelPadding', 0, 0) + 'px');

        // create the application pane, and insert the model container
        appPane = new Pane(app, { classes: 'app-pane' });
        appPane.getNode().append(modelContainerNode);

        // move window tool bar to the right
        win.nodes.outer.addClass('toolbar-right');

        // add the main application pane
        win.nodes.main.addClass('io-ox-office-main ' + app.getName().replace(/[.\/]/g, '-') + '-main').append(appPane.getNode());

        // add shadow nodes above application pane, but below other panes
        _(['top', 'bottom', 'left', 'right']).each(function (border) {
            win.nodes.main.append(shadowNodes[border] = $('<div>').addClass('app-pane-shadow'));
        });

        // listen to browser window resize events when the OX window is visible
        app.registerWindowResizeHandler(windowResizeHandler);

        // update all view components every time the window will be shown
        win.on('show', function () { controller.update(); });

    } // class View

    // exports ================================================================

    return _.makeExtendable(View);

});
