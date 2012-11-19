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
     */
    function View(app) {

        var // the application controller
            controller = app.getController(),

            // the application window
            win = ox.ui.createWindow({ name: app.getName() }),

            // centered application pane
            appPane = null,

            // all pane instances, mapped by identifier, and by border side
            panes = { all: {}, top: [], bottom: [], left: [], right: [] };

        // private methods ----------------------------------------------------

        /**
         * Handles resize events of the browser window, and adjusts the pane
         * nodes.
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

            // update the application pane
            appPane.getNode().css(offsets);
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the central application pane.
         *
         * @returns {Pane}
         *  The central application pane.
         */
        this.getApplicationPane = function () {
            return appPane;
        };

        /**
         * Returns the specified pane which has been added with the method
         * View.createPane() before.
         *
         * @param {String} id
         *  The unique identifier of the pane.
         *
         * @returns {Pane|Null}
         *  The pane with the specified identifier, or null if no pane has been
         *  found.
         */
        this.getPane = function (id) {
            return (id in panes.all) ? panes.all[id] : null;
        };

        /**
         * Adds the passed pane instance into this view.
         *
         * @param {String} id
         *  The unique identifier of the pane.
         *
         * @param {Pane} pane
         *  The new pane instance.
         *
         * @param {String} side
         *  The border of the application window to attach the pane to.
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

        // add the central application pane, and insert the document model root node
        appPane = new Pane(app, { classes: 'center' });
        appPane.getNode().append(app.getModel().getNode());

        // move window tool bar to the right
        win.nodes.outer.addClass('toolbar-right');

        // add the main application pane
        win.nodes.main.addClass(app.getName().replace(/[.\/]/g, '-') + '-main').append(appPane.getNode());

        // listen to browser window resize events when the OX window is visible
        app.registerWindowResizeHandler(windowResizeHandler);

        // update all view components every time the window will be shown
        win.on('show', function () { controller.update(); });

    } // class View

    // exports ================================================================

    return _.makeExtendable(View);

});
