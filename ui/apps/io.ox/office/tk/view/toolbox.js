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

    var // CSS class for collapseable tool boxes
        COLLAPSING_CLASS = 'collapsing',

        // CSS class for tool boxes currently collapsed
        COLLAPSED_CLASS = 'collapsed';

    // class ToolBox ==========================================================

    /**
     * Represents a view component with a fixed width and a vertically oriented
     * layout.
     *
     * @constructor
     *
     * @extends Component
     *
     * @param {OfficeApplication} app
     *  The application containing this tool box.
     *
     * @param {Object} [options]
     *  A map of options controlling the appearance and behavior of the tool
     *  box. Supports all options of the Component base class. Additionally,
     *  the following options are supported:
     *  @param {String} [options.label]
     *      If specified, a heading label will be shown at the top border of
     *      the tool box.
     *  @param {Boolean} [options.collapse=false]
     *      If set to true, the heading label can be clicked to collapse the
     *      tool box (hide all its contents but the heading label).
     *  @param {Boolean} [options.expand=false]
     *      If set to true, the heading label can be clicked to expand the tool
     *      box (show all its contents) after it has been collapsed.
     */
    function ToolBox(options) {

        var // self reference
            self = this,

            // the label for the heading button
            headingLabel = Utils.getStringOption(options, 'label'),

            // the heading button that collapses/expands the tool box
            headingButton = _.isString(headingLabel) ? new Button({ design: 'heading', label: headingLabel }) : null,

            // whether the heading button can collapse the tool box
            canCollapse = Utils.getBooleanOption(options, 'collapse', false),

            // whether the heading button can expand the tool box
            canExpand = Utils.getBooleanOption(options, 'expand', false);

        // base constructor ---------------------------------------------------

        Component.call(this, options);

        // private methods ----------------------------------------------------

        /**
         * Collapses or expands this tool box.
         *
         * @param {Boolean} expand
         *  If set to true, the tool box will be expanded, otherwise collapsed.
         */
        function expandToolBox(expand) {
            if (headingButton) {
                self.getNode().toggleClass(COLLAPSED_CLASS, !expand);
                headingButton.enable(expand ? canCollapse : canExpand);
            }
        }

        /**
         * Click handler for the heading button that collapses or expands this
         * tool box.
         */
        function headingActionHandler() {
            var expand = self.isCollapsed();
            expandToolBox(expand);
            self.trigger('expand', expand).trigger('cancel');
        }

        // methods ------------------------------------------------------------

        /**
         * Returns whether this tool box can be collapsed and expanded (i.e.
         * whether it contains a heading button).
         */
        this.isCollapseable = function () {
            return this.getNode().hasClass(COLLAPSING_CLASS);
        };

        /**
         * Returns whether this tool box is currently collapsed.
         */
        this.isCollapsed = function () {
            return this.getNode().hasClass(COLLAPSED_CLASS);
        };

        /**
         * Collapses this tool box so that only the heading button remains
         * visible. Has no effect if the tool box is not collapseable (i.e.
         * if it does not contain a heading button).
         *
         * @returns {ToolBox}
         *  A reference to this instance.
         */
        this.collapse = function () {
            expandToolBox(false);
            return this;
        };

        /**
         * Expands this tool box so that all its contents become visible. Has
         * no effect if the tool box is not collapseable (i.e. if it does not
         * contain a heading button).
         *
         * @returns {ToolBox}
         *  A reference to this instance.
         */
        this.expand = function () {
            expandToolBox(true);
            return this;
        };

        // initialization -----------------------------------------------------

        this.getNode().addClass('toolbox');

        // tool box with heading (button that collapses/expands the tool box)
        if (headingButton) {
            // tool boxes with heading button are collapseable
            this.getNode().addClass(COLLAPSING_CLASS);
            // add the heading button to the tool box, and register the action handler
            this.addPrivateGroup(headingButton);
            headingButton.on('change', headingActionHandler);
            // update state and label of heading button
            expandToolBox(true);
        }

    } // class ToolBox

    // exports ================================================================

    // derive this class from class Component
    return Component.extend({ constructor: ToolBox });

});
