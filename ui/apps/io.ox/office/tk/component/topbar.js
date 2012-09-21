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

define('io.ox/office/tk/component/topbar',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/radiogroup',
     'io.ox/office/tk/component/toolbar'
    ], function (Utils, RadioGroup, ToolBar) {

    'use strict';

    // class TopBar ===========================================================

    /**
     * A special tool bar that is located in the header area of the application
     * window and has special CSS formatting. Unlike other view components, a
     * top bar inserts itself into the application window on construction.
     *
     * @constructor
     *
     * @extends ToolBar
     *
     * @param {ox.ui.Window} appWindow
     *  The application window object. The new top bar will be inserted into
     *  the header area of this window.
     */
    function TopBar(appWindow) {

        var // self reference
            self = this;

        // private methods ----------------------------------------------------

        /**
         * Handles resize events of the browser window, and adjusts the width
         * of this top bar according to the current window width.
         */
        function windowResizeHandler(event) {
            var node = self.getNode();
            // TODO: replace the arbitrary value 220 with the actual width of the right-hand controls
            node.width($(window).width() - node.offset().left - 220);
        }

        // base constructor ---------------------------------------------------

        ToolBar.call(this, appWindow);

        // initialization -----------------------------------------------------

        // insert this top bar into the window header
        appWindow.nodes.toolbar.parent().css('vertical-align', 'bottom');
        this.getNode().removeClass('toolbar').addClass('tabbar').appendTo(appWindow.nodes.toolbar.parent());

        // listen to browser window resize events when the OX window is visible
        Utils.registerWindowResizeHandler(appWindow, windowResizeHandler);

    } // class TopBar

    // exports ================================================================

    // derive this class from class ToolBar
    return ToolBar.extend({ constructor: TopBar });

});
