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

define('io.ox/office/tk/view/sidepane',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/view/pane',
     'io.ox/office/tk/view/component'
    ], function (Utils, Pane, Component) {

    'use strict';

    // class SidePane =========================================================

    /**
     * Represents a container element containing multiple stacked tool boxes.
     *
     * @constructor
     *
     * @extends Pane
     *
     * @param {Application} app
     *  The application.
     */
    function SidePane(app) {

        var // all registered tool boxes, mapped by tool box key
            toolBoxes = {};

        // base constructor ---------------------------------------------------

        Pane.call(this, app, { classes: 'side-pane' });

        // methods ------------------------------------------------------------

        /**
         * Creates a new tool box in the side pane.
         *
         * @param {String} id
         *  The unique identifier of the tool box.
         *
         * @param {Object} [options]
         *  A map of options for the tool box in the side pane. Supports all
         *  options for labels (see class Label for details), and the following
         *  additional options:
         *  @param {String} [options.visible]
         *      The key of the controller item that controls the visibility of
         *      the tool box. The visibility will be bound to the 'enabled'
         *      state of the respective controller item.
         */
        this.createToolBox = function (id, options) {

            var // create a new tool box object, and store it in the map
                toolBox = toolBoxes[id] = new Component(app, { classes: 'toolbox', visible: Utils.getStringOption(options, 'visible') });

            // add the tool box to this side pane, add a heading label to the tool box
            this.addViewComponent(toolBox);
            toolBox.addLabel(id, Utils.extendOptions(options, { classes: 'heading' }));

            return toolBox;
        };

    } // class SidePane

    // exports ================================================================

    // derive this class from class Pane
    return Pane.extend({ constructor: SidePane });

});
