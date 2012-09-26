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

define('io.ox/office/tk/component/toolpane',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/component/toolbar',
     'io.ox/office/tk/component/topbar'
    ], function (Utils, ToolBar, TopBar) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class ToolPane =========================================================

    /**
     * Represents a container element with multiple tool bars where one tool
     * bar is visible at a time. Tool bars can be selected with a tab control
     * shown above the visible tool bar.
     *
     * @param {ox.ui.Window} appWindow
     *  The application window object.
     *
     * @param {Controller} controller
     *  The application controller.
     *
     * @param {String} key
     *  The controller key used to change the visible tool bar. Will be bound
     *  to the tab control shown above the visible tool bar.
     */
    function ToolPane(appWindow, controller, key) {

        var // self reference
            self = this,

            // the container element representing the tool pane
            node = $('<div>').addClass('io-ox-pane top toolpane'),

            // the top bar to select the visible tool bar
            topBar = new TopBar(appWindow),

            // the tab buttons to select the tool bars
            radioGroup = null,

            // all registered tool bars, mapped by tool bar key
            toolBars = {},

            // identifiers of all registered tool bars, in registration order
            toolBarIds = [],

            // identifier of the tool bar currently visible
            visibleToolBarId = '';

        // private methods ----------------------------------------------------

        /**
         * Activates the tool bar with the specified identifier.
         */
        function showToolBar(id) {
            if (id in toolBars) {
                if (visibleToolBarId in toolBars) {
                    toolBars[visibleToolBarId].hide();
                }
                visibleToolBarId = id;
                toolBars[id].show();
            }
        }

        /**
         * Handles keyboard events in the tool pane.
         */
        function toolPaneKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // index of the visible tool bar
                index = _(toolBarIds).indexOf(visibleToolBarId);

            if (event.keyCode === KeyCodes.F7) {
                if (keydown) {
                    index = event.shiftKey ? (index - 1) : (index + 1);
                    index = Utils.minMax(index, 0, toolBarIds.length - 1);
                    self.showToolBar(toolBarIds[index]);
                    self.grabFocus();
                }
                return false;
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the root element containing this tool pane as jQuery object.
         */
        this.getNode = function () {
            return node;
        };

        /**
         * Creates a new tool bar object and registers it at the controller
         * passed to the constructor of this tool pane.
         *
         * @param {String} id
         *  The unique identifier of the new tool bar.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new tab in the
         *  tab bar representing the tool bar. Supports all options for buttons
         *  in radio groups (see method RadioGroup.createOptionButton() for
         *  details).
         *
         * @returns {ToolBar}
         *  The new tool bar object.
         */
        this.createToolBar = function (id, options) {

            var // create a new tool bar object, and store it in the map
                toolBar = toolBars[id] = new ToolBar(appWindow);

            // add the tool bar to the pane, and register it at the controller
            toolBarIds.push(id);
            node.append(toolBar.getNode());
            controller.registerViewComponent(toolBar);

            // create the tab bar radio group on first call, add option tab
            if (!radioGroup) {
                radioGroup = topBar.addRadioGroup(key, { auto: true, whiteIcon: true });
            }
            radioGroup.addOptionButton(id, options);

            // hide all tool bars but the first
            if (toolBarIds.length > 1) {
                toolBar.hide();
            } else {
                visibleToolBarId = id;
            }

            return toolBar;
        };

        /**
         * Creates a drop-down button in the tab bar and inserts the passed
         * view component into its drop-down menu. Registers the view component
         * at the controller passed to the constructor of this tool pane.
         *
         * @param {Component} component
         *  The view component instance whose root node will be inserted into
         *  the drop-down menu.
         *
         * @param {String} [options]
         *  A map of options to control the properties of the drop-down button.
         *  Supports all options of the Scrollable class constructor.
         *
         * @returns {ToolPane}
         *  A reference to this instance.
         */
        this.addMenu = function (component, options) {
            topBar.addMenu(component, Utils.extendOptions(options, { whiteIcon: true }));
            return this;
        };

        /**
         * Returns the identifier of the tool bar currently visible.
         */
        this.getVisibleToolBarId = function () {
            return visibleToolBarId;
        };

        /**
         * Activates the tool bar with the specified identifier.
         *
         * @param {String} id
         *  The identifier of the tool bar to be shown.
         *
         * @returns {ToolPane}
         *  A reference to this tool pane.
         */
        this.showToolBar = function (id) {
            controller.change(key, id);
            return this;
        };

        /**
         * Returns whether this tool pane contains the control that is
         * currently focused. Searches in the visible tool bar and in the tool
         * bar tabs.
         */
        this.hasFocus = function () {
            return topBar.hasFocus() || ((visibleToolBarId in toolBars) && toolBars[visibleToolBarId].hasFocus());
        };

        /**
         * Sets the focus to the visible tool bar.
         */
        this.grabFocus = function () {
            if (visibleToolBarId in toolBars) {
                toolBars[visibleToolBarId].grabFocus();
            }
            return this;
        };

        /**
         * Triggers a 'refresh' event at all registered tool bars.
         */
        this.refresh = function () {
            topBar.trigger('refresh');
            _(toolBars).invoke('trigger', 'refresh');
            return this;
        };

        this.destroy = function () {
            topBar.destroy();
            _(toolBars).invoke('destroy');
            topBar = radioGroup = toolBars = null;
        };

        // initialization -----------------------------------------------------

        // prepare the controller
        controller
            // add item definition for the tab bar
            .addDefinition(key, { get: function () { return visibleToolBarId; }, set: showToolBar })
            // register the tab bar at the controller
            .registerViewComponent(topBar);

        // change visible tool bar with keyboard
        node.on('keydown keypress keyup', toolPaneKeyHandler);

    } // class ToolPane

    // exports ================================================================

    return ToolPane;

});
