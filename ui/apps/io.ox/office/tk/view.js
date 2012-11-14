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

define('io.ox/office/tk/view',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/component/toolpane',
     'gettext!io.ox/office/main'
    ], function (Utils, ToolPane, gt) {

    'use strict';

    // class View =============================================================

    /**
     * Base class for the view instance of an office application. Creates the
     * application window, and provides functionality to create and control the
     * top, bottom, and side pane elements.
     */
    function View(app) {

        var // the application model
            model = app.getModel(),

            // the application controller
            controller = app.getController(),

            // the application window
            win = ox.ui.createWindow({ name: app.getName() }),

            // centered application pane
            appPane = $('<div>').addClass('io-ox-pane center').append(model.getNode());

        // private methods ----------------------------------------------------

        /**
         * Handles resize events of the browser window, and adjusts the pane
         * nodes.
         */
        function windowResizeHandler(event) {
        }

        // methods ------------------------------------------------------------

        this.getApplicationPane = function () {
            return appPane;
        };

        // initialization -----------------------------------------------------

        // set the window at the application instance
        app.setWindow(win);

        // add the main application pane
        win.nodes.main.addClass(app.getName().replace(/[.\/]/g, '-') + '-main').append(appPane);

        // listen to browser window resize events when the OX window is visible
        app.registerWindowResizeHandler(windowResizeHandler);

        // update all view components every time the window will be shown
        win.on('show', function () { controller.update(); });

    } // class View

    // exports ================================================================

    return _.makeExtendable(View);

});
