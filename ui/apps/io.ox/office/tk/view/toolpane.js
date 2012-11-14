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
     'io.ox/office/tk/component/toolbar',
     'io.ox/office/tk/control/radiogroup'
    ], function (Utils, Pane, ToolBar, RadioGroup) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // the controller key used to switch the visible tool bar
        KEY_SHOW_TOOLBAR = 'tk/toolbars/show';

    // class ToolPane =========================================================

    /**
     * Represents a container element with multiple tool bars where one tool
     * bar is visible at a time. Tool bars can be selected with a tab control
     * shown above the visible tool bar.
     *
     * @constructor
     *
     * @extends Pane
     *
     * @param {Application} app
     *  The application.
     */
    function ToolPane(app) {

        var // self reference
            self = this,

            // the application controller
            controller = app.getController(),

            // tab bar to switch the tool bars (temporary)
            tabBar = new ToolBar(app.getWindow()),

            // radio group to switch the tool bars (temporary)
            tabBarGroup = new RadioGroup(),

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

        // base constructor ---------------------------------------------------

        Pane.call(this, app);

        // methods ------------------------------------------------------------

        this.getTabBar = function () {
            return tabBar;
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
         *  in radio groups (see method RadioGroup.addOptionButton() for
         *  details).
         *
         * @returns {ToolBar}
         *  The new tool bar object.
         */
        this.createToolBar = function (id, options) {

            var // create a new tool bar object, and store it in the map
                toolBar = toolBars[id] = new ToolBar(app.getWindow());

            // add the tool bar to the pane, and register it at the controller
            toolBarIds.push(id);
            this.getNode().append(toolBar.getNode());
            controller.registerViewComponent(toolBar);

            // add an option button to the tab bar
            tabBarGroup.addOptionButton(id, options);

            // hide all tool bars but the first
            if (toolBarIds.length > 1) {
                toolBar.hide();
                // show tab bar if at least two tool bars have been created
                tabBar.show();
            } else {
                visibleToolBarId = id;
            }

            return toolBar;
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
            controller.change(KEY_SHOW_TOOLBAR, id);
            return this;
        };

        /**
         * Returns whether this tool pane contains the control that is
         * currently focused. Searches in the visible tool bar and in the tool
         * bar tabs.
         */
        this.hasFocus = function () {
            return (visibleToolBarId in toolBars) && toolBars[visibleToolBarId].hasFocus();
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

        this.destroy = function () {
            _(toolBars).invoke('destroy');
            toolBars = null;
        };

        // initialization -----------------------------------------------------

        // insert the tab bar into this tool pane, but hide it initially
        this.getNode().addClass('toolpane').append(tabBar.getNode());
        controller.registerViewComponent(tabBar);
        tabBar.addGroup(KEY_SHOW_TOOLBAR, tabBarGroup).hide();

        // add item definition for the tab bar
        controller.addDefinition(KEY_SHOW_TOOLBAR, {
            get: function () { return visibleToolBarId; },
            set: showToolBar
        });

        // change visible tool bar with keyboard
        this.getNode().on('keydown keypress keyup', toolPaneKeyHandler);

    } // class ToolPane

    // exports ================================================================

    // derive this class from class Pane
    return Pane.extend({ constructor: ToolPane });

});
