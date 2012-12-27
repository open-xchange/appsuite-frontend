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

define('io.ox/office/tk/view/toolbox',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/button',
     'io.ox/office/tk/view/component'
    ], function (Utils, Button, Component) {

    'use strict';

    // class ToolBox ==========================================================

    /**
     * Represents a view component with a fixed width and a vertically oriented
     * layout.
     *
     * @constructor
     *
     * @extends Component
     */
    function ToolBox(options) {

        var // self reference
            self = this,

            // options for the heading button
            headingOptions = Utils.extendOptions(options, { classes: 'heading', width: '100%', icon: 'caret-icon down' }),

            // the heading button that collapses/expands the tool box
            headingButton = new Button(headingOptions);

        // private methods ----------------------------------------------------

        function headingActionHandler() {

            var // the DOM node of this tool box
                node = self.getNode();

            node.toggleClass('collapsed');
            headingButton.setIcon('caret-icon ' + (node.hasClass('collapsed') ? 'right' : 'down'));
            self.trigger('cancel');
        }

        // base constructor ---------------------------------------------------

        Component.call(this, Utils.extendOptions(options, {
            classes: Utils.getStringOption(options, 'classes', '') + ' toolbox'
        }));

        // initialization -----------------------------------------------------

        // add the top 'shadow'
        this.getNode().append($('<div>').addClass('top-shadow'));

        // add the heading button to the tool box, and register the action handler
        this.addPrivateGroup(headingButton);
        headingButton.on('change', headingActionHandler);

    } // class ToolBox

    // exports ================================================================

    // derive this class from class Component
    return Component.extend({ constructor: ToolBox });

});
