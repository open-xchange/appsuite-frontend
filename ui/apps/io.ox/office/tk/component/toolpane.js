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
     'io.ox/office/tk/component/toolbar'
    ], function (Utils, ToolBar) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class ToolPane =========================================================

    function ToolPane(win, controller, key) {

        var // self reference
            self = this,

            // the container element representing the tool pane
            node = $('<div>').addClass('io-ox-toolpane top'),

            // the top-level tab bar to select tool bars
            tabBar = new ToolBar(win),

            // the tab buttons to select the tool bars
            radioGroup = tabBar.addRadioGroup(key, { type: 'list', autoExpand: true }),

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
         * Sets the focus to the visible tool bar.
         */
        function grabToolBarFocus() {
            if (visibleToolBarId in toolBars) {
                toolBars[visibleToolBarId].grabFocus();
            }
        }

        /**
         * Handles keyboard events in the tool pane.
         * @param event
         * @returns {Boolean}
         */
        function toolPaneKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keydown = event.type === 'keydown',
                // index of the visible tool bar
                index = _(toolBarIds).indexOf(visibleToolBarId);

            if (event.keyCode === KeyCodes.F7) {
                if (keydown) {
                    index = event.shiftKey ? (index - 1) : (index + 1);
                    index = Math.min(Math.max(index, 0), toolBarIds.length - 1);
                    self.showToolBar(toolBarIds[index]);
                    grabToolBarFocus();
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
         * Creates a new tool bar object and registers it at the tab bar.
         *
         * @param {String} id
         *  The unique identifier of the new tool bar.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new tab in the
         *  tab bar representing the tool bar. Supports all options for buttons
         *  in radio groups (see method RadioGroup.addButton() for details).
         *
         * @returns {ToolBar}
         *  The new tool bar object.
         */
        this.createToolBar = function (id, options) {

            var // create a new tool bar object, and store it in the map
                toolBar = toolBars[id] = new ToolBar(win);

            // add a tool bar tab, add the tool bar to the pane, and register it at the controller
            toolBarIds.push(id);
            node.append(toolBar.getNode());
            radioGroup.addButton(id, options);
            controller.registerViewComponent(toolBar);
            toolBar.hide();

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
            controller.change(key, id);
            return this;
        };

        this.destroy = function () {
            tabBar.destroy();
            _(toolBars).invoke('destroy');
            tabBar = radioGroup = toolBars = null;
        };

        // initialization -----------------------------------------------------

        // insert the tool bar selector and a separator line into the tool pane
        tabBar.getNode()
            .appendTo(node)
            .addClass('tabs')
            .children().first().append(
                $('<span>').addClass('separator left'),
                $('<span>').addClass('separator right')
            );

        // prepare the controller
        controller
            // add item definition for the tab bar
            .addDefinitions(Utils.makeSingleOption(key, { get: function () { return visibleToolBarId; }, set: showToolBar }))
            // register the tab bar at the controller
            .registerViewComponent(tabBar);

        // change visible tool bar with keyboard
        node.on('keydown keypress keyup', toolPaneKeyHandler);

    } // class ToolPane

    // exports ================================================================

    return ToolPane;

});
