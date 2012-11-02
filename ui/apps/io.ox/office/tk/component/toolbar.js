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

define('io.ox/office/tk/component/toolbar',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/component/component'
    ], function (Utils, Component) {

    'use strict';

    // class ToolBar ==========================================================

    /**
     * A tool bar is a view component with form controls that are displayed as
     * a horizontal bar.
     *
     * @constructor
     *
     * @extends Component
     *
     * @param {ox.ui.Window} appWindow
     *  The application window object.
     */
    function ToolBar(appWindow) {

        var // DOM child element measuring the total width of the controls
            containerNode = $('<span>');

        // private methods ----------------------------------------------------

        /**
         * Handler function that will be called for every inserted group.
         */
        function insertGroupHandler(groupNode) {
            containerNode.append(groupNode);
        }

        // base constructor ---------------------------------------------------

        Component.call(this, appWindow, insertGroupHandler);

        // initialization -----------------------------------------------------

        // prepare component root node
        this.getNode().addClass('toolbar').append(containerNode);

    } // class ToolBar

    // exports ================================================================

    // derive this class from class Component
    return Component.extend({ constructor: ToolBar });

});
