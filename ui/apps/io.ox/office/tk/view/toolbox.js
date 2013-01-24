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
     *
     * @param {Object} [options]
     *  A map of options controlling the appearance and behavior of the tool
     *  box. Supports all options of the Component base class. Additionally,
     *  the following options are supported:
     *  @param {String} [options.label]
     *      If specified, a heading label will be shown at the top border of
     *      the tool box. The label can be clicked to collapse and expand the
     *      tool box.
     */
    function ToolBox(options) {

        var // self reference
            self = this,

            // the label for the heading button
            headingLabel = Utils.getStringOption(options, 'label'),

            // the heading button that collapses/expands the tool box
            headingButton = _.isString(headingLabel) ? new Button({ design: 'heading', width: '100%', label: headingLabel, icon: 'caret-icon down' }) : null;

        // private methods ----------------------------------------------------

        function headingActionHandler() {

            var // the DOM node of this tool box
                node = self.getNode();

            node.toggleClass('collapsed');
            headingButton.setIcon('caret-icon ' + (node.hasClass('collapsed') ? 'right' : 'down'));
            self.trigger('cancel');
        }

        // base constructor ---------------------------------------------------

        Component.call(this, options);

        // initialization -----------------------------------------------------

        this.getNode().addClass('toolbox');

        // tool box with heading (button that collapses/expands the tool box)
        if (headingButton) {

            // add top shadow
            this.getNode().append($('<div>').addClass('top-shadow'));

            // add the heading button to the tool box, and register the action handler
            this.addPrivateGroup(headingButton);
            headingButton.on('change', headingActionHandler);
        }

    } // class ToolBox

    // exports ================================================================

    // derive this class from class Component
    return Component.extend({ constructor: ToolBox });

});
