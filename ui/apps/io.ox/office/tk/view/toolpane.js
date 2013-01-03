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

define('io.ox/office/tk/view/toolpane',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/view/pane',
     'io.ox/office/tk/view/component'
    ], function (Utils, Pane, Component) {

    'use strict';

    // class ToolPane =========================================================

    /**
     * Represents a container element with multiple tool bars.
     *
     * @constructor
     *
     * @extends Pane
     *
     * @param {Application} app
     *  The application.
     */
    function ToolPane(app) {

        var // all registered tool bars, mapped by tool bar key
            toolBars = {};

        // base constructor ---------------------------------------------------

        Pane.call(this, app, { classes: 'tool-pane' });

        // methods ------------------------------------------------------------

        /**
         * Creates a new tool bar component.
         *
         * @param {String} id
         *  The unique identifier of the new tool bar.
         *
         * @returns {Component}
         *  The new tool bar instance.
         */
        this.createToolBar = function (id) {

            var // create a new tool bar object, and store it in the map
                toolBar = toolBars[id] = new Component({ classes: 'toolbar'});

            // add the tool bar to this tool pane
            this.addViewComponent(toolBar);

            return toolBar;
        };

    } // class ToolPane

    // exports ================================================================

    // derive this class from class Pane
    return Pane.extend({ constructor: ToolPane });

});
