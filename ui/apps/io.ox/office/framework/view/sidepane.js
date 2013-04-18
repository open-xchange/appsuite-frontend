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

define('io.ox/office/framework/view/sidepane',
    ['io.ox/office/tk/utils',
     'io.ox/office/framework/view/pane',
     'io.ox/office/framework/view/toolbox',
     'gettext!io.ox/office/main'
    ], function (Utils, Pane, ToolBox, gt) {

    'use strict';

    // class SidePane =========================================================

    /**
     * A view pane attached to the left or right border of the application
     * window. Contains tool boxes stacked vertically. Provides fixed areas at
     * the top and at the bottom of the side pane with tool boxes that will
     * always be visible. The inner area between the fixed areas will be
     * scrollable.
     *
     * @constructor
     *
     * @extends Pane
     *
     * @param {BaseApplication} app
     *  The application containing this side pane.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the side pane. Supports
     *  all options supported by the base class Pane. The 'options.position'
     *  option will be restricted to the values 'left' and 'right'. The option
     *  'options.componentInserter' is not supported anymore. Additionally, the
     *  following options are supported:
     *  @param {Function} [options.refreshHandler]
     *      A function that will be called when the layout of the side pane
     *      needs to be refreshed. Will be called when the application
     *      controller sends 'update' events (the visibility of tool boxes may
     *      have changed), after expanding or collapsing a tool box, or when
     *      the size of the browser window has been changed.
     */
    function SidePane(app, options) {

        var // self reference
            self = this,

            // container node for the upper fixed tool boxes in the side pane
            fixedTopNode = $('<div>').addClass('fixed-toolboxes top'),

            // scrollable container node for the tool boxes in the side panes
            scrollableNode = $('<div>').addClass('scrollable-toolboxes'),

            // container node for the upper fixed tool boxes in the side pane
            fixedBottomNode = $('<div>').addClass('fixed-toolboxes bottom'),

            // refresh layout of the side pane after changes of tool boxes
            refreshHandler = Utils.getFunctionOption(options, 'refreshHandler', $.noop);

        // base constructor ---------------------------------------------------

        Pane.call(this, app, Utils.extendOptions(options, {
            position: (Utils.getStringOption(options, 'position') === 'left') ? 'left' : 'right',
            insertHandler: insertHandler,
            componentInserter: toolBoxInserter
        }));

        // private methods ----------------------------------------------------

        /**
         * Updates the side pane according to the current browser window size.
         */
        function refreshLayout() {
            if (!self.isVisible()) { return; }

            // update top/bottom positions of scrollable container in case the fixed tool boxes have changed
            scrollableNode.css({ top: fixedTopNode.height() - 1, bottom: fixedBottomNode.height() - 1 });
            // toggle visibility of border lines above/below container node
            scrollableNode.toggleClass('scrollable', scrollableNode[0].clientHeight < scrollableNode[0].scrollHeight);

            // call refresh handler passed to constructor
            refreshHandler.call(self);
        }

        /**
         * Will be called after the side pane has been inserted into the
         * application window, used for delayed initialization with valid pane
         * node geometry.
         */
        function insertHandler() {

            // call insert handler passed to constructor
            Utils.getFunctionOption(options, 'insertHandler', $.noop).call(self);

            // update side pane after controller updates (tool box visibility may have
            // changed), and after the size of the browser window has been changed
            app.getController().on('update', refreshLayout);
            app.registerWindowResizeHandler(refreshLayout);
        }

        /**
         * Inserts the passed tool box into the side pane.
         */
        function toolBoxInserter(toolBox) {
            switch (Utils.getStringOption(toolBox.getOptions(), 'fixed')) {
            case 'top':
                fixedTopNode.append(toolBox.getNode());
                break;
            case 'bottom':
                fixedBottomNode.append(toolBox.getNode());
                break;
            default:
                scrollableNode.append(toolBox.getNode());
            }
        }

        // methods ------------------------------------------------------------

        this.getFixedTopNode = function () {
            return fixedTopNode;
        };

        this.getScrollableNode = function () {
            return scrollableNode;
        };

        this.getFixedBottomNode = function () {
            return fixedBottomNode;
        };

        /**
         * Creates a tool box in this side pane, and registers it for automatic
         * visibility handling.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new tool box.
         *  Supports all options supported by the constructor of the class
         *  ToolBox, and the following additional options:
         *  @param {String} [options.fixed]
         *      If set to 'top' or 'bottom', the new tool box will be appended
         *      to the upper respectively lower fixed area of the side pane,
         *      and cannot be scrolled outside the visible area. Otherwise, the
         *      tool box will be appended to the scrollable area of the side
         *      pane.
         *  @param {String} [options.visible]
         *      The key of the controller item that controls the visibility of
         *      the tool box. The visibility will be bound to the 'enabled'
         *      state of the respective controller item. If omitted, the tool
         *      box will always be visible.
         *
         * @returns {ToolBox}
         *  The new tool box instance.
         */
        this.createToolBox = function (options) {

            var // the new tool box instance
                toolBox = new ToolBox(app, options),
                // the controller item controlling the visibility of the tool box
                visibleKey = Utils.getStringOption(options, 'visible');

            // insert tool box into the side pane, refresh layout after expanding/collapsing
            this.addViewComponent(toolBox);
            toolBox.on('expand', refreshLayout);

            // update visibility according to enabled state of controller item
            if (_.isString(visibleKey)) {
                // initially hide the tool box
                toolBox.hide();
                app.getController().on('update', function (event, result) {
                    if ((visibleKey in result) && (toolBox.isVisible() !== result[visibleKey].enable)) {
                        toolBox.toggle(result[visibleKey].enable);
                        refreshLayout();
                    }
                });
            }

            return toolBox;
        };

        // initialization -----------------------------------------------------

        // insert the container nodes for fixed and scrollable tool boxes
        this.getNode().addClass('side-pane').append(fixedTopNode, scrollableNode, fixedBottomNode);

    } // class SidePane

    // exports ================================================================

    // derive this class from class Pane
    return Pane.extend({ constructor: SidePane });

});
