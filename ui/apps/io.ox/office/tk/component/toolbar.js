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
     'io.ox/office/tk/control/radiogroup',
     'io.ox/office/tk/component/component'
    ], function (Utils, RadioGroup, Component) {

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

        var // reference to this tool bar
            self = this,

            // DOM child element measuring the total width of the controls
            containerNode = $('<span>'),

            // resize handler functions supporting flexible tool bar sizing
            resizeHandlers = [];

        // private methods ----------------------------------------------------

        /**
         * Registers a resize handler function provided by a button group
         * object.
         *
         * @param {Function} resizeHandler
         *  The resize handler. Will be called in the context of this tool bar.
         *  Receives a boolean parameter 'enlarge'. If set to true, the handler
         *  must try to increase the width of the button group. If set to
         *  false, the handler must try to decrease the width of the button
         *  group.
         */
        function registerResizeHandler(resizeHandler) {
            // store the resize handler object
            resizeHandlers.push(resizeHandler);
        }

        /**
         * Handler function that will be called for every inserted group.
         */
        function insertGroupHandler(groupNode) {
            containerNode.append(groupNode);
        }

        /**
         * Listens to size events of the browser window, and tries to expand or
         * shrink resizeable button groups according to the available space in
         * the tool bar.
         */
        function windowResizeHandler() {

            var // available space (width() returns content width without padding)
                width = self.getNode().width();

            // try to enlarge one or more controls, until tool bar overflows
            _(resizeHandlers).each(function (resizeHandler) {
                if (containerNode.width() < width) { resizeHandler.call(self, true); }
            });

            // try to shrink one or more controls, until tool bar does not overflow
            _(resizeHandlers).each(function (resizeHandler) {
                if (containerNode.width() > width) { resizeHandler.call(self, false); }
            });
        }

        // class RadioGroupProxy ----------------------------------------------

        /**
         * Proxy class returned as inserter for buttons into a radio group.
         *
         * @constructor
         *
         * @param {String} key
         *  The unique key of the radio group.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the radio group. See
         *  method ToolBar.addRadioGroup() for details.
         */
        function RadioGroupProxy(key, options) {

            var // the group object containing the option buttons
                radioGroup = new RadioGroup(options),
                // drop-down group in auto-size mode
                dropDownGroup = null;

            // private methods ------------------------------------------------

            /**
             * Tries to show the button group or the drop-down button according
             * to the specified size mode.
             *
             * @param {Boolean} enlarge
             *  If set to true, shows the button group, otherwise shows the
             *  drop-down button.
             */
            function resizeHandler(enlarge) {

                var hideGroup = null, showGroup = null;

                // decide which group to hide and to show
                if (enlarge && dropDownGroup.isVisible()) {
                    hideGroup = dropDownGroup;
                    showGroup = radioGroup;
                } else if (!enlarge && radioGroup.isVisible()) {
                    hideGroup = radioGroup;
                    showGroup = dropDownGroup;
                }

                // hide and show the groups
                if (hideGroup && showGroup) {
                    showGroup.show();
                    if (hideGroup.hasFocus()) {
                        showGroup.grabFocus();
                    }
                    hideGroup.hide();
                }
            }

            // methods --------------------------------------------------------

            /**
             * Adds a new button to this radio group.
             *
             * @param {String} value
             *  The unique value associated to this button.
             *
             * @param {Object} [options]
             *  A map of options to control the properties of the new button.
             *  See method Utils.createButton() for details.
             */
            this.addButton = function (value, options) {
                radioGroup.addButton(value, options);
                if (dropDownGroup) {
                    dropDownGroup.addButton(value, options);
                }
                return this;
            };

            /**
             * Returns a reference to the tool bar containing this button
             * group. Useful for method chaining.
             */
            this.end = function () { return self; };

            // initialization -------------------------------------------------

            // create second radio group in auto-size mode
            if (Utils.getBooleanOption(options, 'auto')) {
                if (radioGroup.hasDropDown) {
                    dropDownGroup = radioGroup;
                    radioGroup = new RadioGroup(Utils.extendOptions(options, { dropDown: false }));
                } else {
                    dropDownGroup = new RadioGroup(Utils.extendOptions(options, { dropDown: true }));
                }
                self.addGroup(key, dropDownGroup);
                registerResizeHandler(resizeHandler);
            }

            self.addGroup(key, radioGroup);

        } // class RadioGroupProxy

        // base constructor ---------------------------------------------------

        Component.call(this, appWindow, insertGroupHandler);

        // methods ------------------------------------------------------------

        /**
         * Creates a radio button group, and appends it to this tool bar. The
         * radio group may be visualized as button group (all buttons are
         * visible in the tool bar), or as drop-down group (a single button
         * shows a drop-down menu when clicked).
         *
         * @param {String} key
         *  The unique key of the group. This key is shared by all buttons
         *  inserted into this group.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the radio group.
         *  Supports all generic formatting options of the RadioGroup class
         *  constructor. Additionally, the following options are supported:
         *  @param {Boolean} [options.auto=false]
         *      If set to true, the group will be changed between a button
         *      group and a drop-down group automatically, depending on the
         *      horizontal space available in the tool bar.
         *
         * @returns {RadioGroupProxy}
         *  A proxy object that implements methods to add option buttons to the
         *  radio group.
         */
        this.addRadioGroup = function (key, options) {
            return new RadioGroupProxy(key, options);
        };

        // initialization -----------------------------------------------------

        // prepare component root node
        this.getNode().addClass('toolbar').append(containerNode);

        // listen to browser window resize events when the OX window is visible
        Utils.registerWindowResizeHandler(appWindow, windowResizeHandler);

    } // class ToolBar

    // exports ================================================================

    // derive this class from class Component
    return Component.extend({ constructor: ToolBar });

});
