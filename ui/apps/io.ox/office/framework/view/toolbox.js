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

define('io.ox/office/framework/view/toolbox',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/button',
     'io.ox/office/framework/view/component'
    ], function (Utils, Button, Component) {

    'use strict';

    var // CSS class for tool boxes currently collapsed
        COLLAPSED_CLASS = 'collapsed';

    // class ToolBox ==========================================================

    /**
     * Represents a view component with a fixed width and a vertically oriented
     * layout. Optionally, a heading label will be shown that allows to
     * collapse and expand the tool box.
     *
     * @constructor
     *
     * @extends Component
     *
     * @param {BaseApplication} app
     *  The application containing this tool box instance.
     *
     * @param {String} id
     *  The unique identifier of the tool box. Will be used to register a
     *  controller item that handles the collapsed state of the tool box.
     *
     * @param {Object} [options]
     *  A map of options controlling the appearance and behavior of the tool
     *  box. Supports all options of the Component base class. Additionally,
     *  the following options are supported:
     *  @param {String} [options.label]
     *      If specified, a heading label will be shown at the top border of
     *      the tool box. The heading label can be clicked to collapse (hide
     *      all its contents but the heading label) and expand (show all its
     *      contents) the tool box.
     */
    function ToolBox(app, id, options) {

        var // self reference
            self = this,

            // the unique base controller key of the tool box
            baseKey = 'view/toolbox/' + id,

            // the label for the heading button
            headingLabel = Utils.getStringOption(options, 'label');

        // base constructor ---------------------------------------------------

        Component.call(this, app, options);

        // initialization -----------------------------------------------------

        this.getNode().addClass('toolbox');

        // tool box with heading (button that collapses/expands the tool box)
        if (_.isString(headingLabel)) {

            // add a special marker CSS class
            this.getNode().addClass('collapsing');

            // create a controller item that collapses/expands the tool box
            app.getController().registerDefinition(baseKey + '/expand', {
                set: function (expand) { self.getNode().toggleClass(COLLAPSED_CLASS); }
            });

            // create the heading button
            this.createButton(baseKey + '/expand', { classes: 'heading', label: headingLabel });
        }

    } // class ToolBox

    // exports ================================================================

    // derive this class from class Component
    return Component.extend({ constructor: ToolBox });

});
