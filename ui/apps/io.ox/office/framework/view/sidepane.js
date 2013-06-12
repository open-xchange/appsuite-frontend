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
     'io.ox/office/framework/view/toolbox'
    ], function (Utils, Pane, ToolBox) {

    'use strict';

    // class SidePane =========================================================

    /**
     * A view pane attached to the left or right border of the application
     * window. Contains tool boxes stacked vertically. Provides fixed areas at
     * the top and at the bottom of the side pane with tool boxes that will
     * always be visible. The inner area between the fixed areas will be
     * scrollable.
     *
     * Triggers the following events:
     * - 'refresh:layout': After the view containing this side pane has
     *      triggered a 'refresh:layout' event by itself, and this side pane
     *      has updated the position and size of the fixed and scrollable
     *      sections containing the tool boxes.
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
     *  'options.componentInserter' is not supported anymore.
     *  A map of options to control the properties of the side pane. The
     *  following options are supported:
     *  @param {String} [options.position='right']
     *      The position of the side pane, either 'left' or 'right'.
     *  @param {Function} [options.insertHandler]
     *      A function that will be called after this side pane has been
     *      inserted into the application window. Needed if the geometry of the
     *      pane DOM node needs to be initialized to perform further
     *      initialization tasks. Will be called in the context of this side
     *      pane instance.
     *  @param {Function} [options.refreshHandler]
     *      A function that will be called when the layout of the side pane
     *      needs to be refreshed. Will be called when the application
     *      controller send 'update' events (the visibility of tool boxes may
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
            fixedBottomNode = $('<div>').addClass('fixed-toolboxes bottom');

        // base constructor ---------------------------------------------------

        Pane.call(this, app, Utils.extendOptions({
            // default options, can be overridden by passed options
            css: { width: SidePane.DEFAULT_WIDTH + 'px' }
        }, options, {
            // fixed options, will override passed options
            position: (Utils.getStringOption(options, 'position') === 'left') ? 'left' : 'right',
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

            // notify listeners
            self.trigger('refresh:layout');
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

        // update side pane after controller updates (tool box visibility
        // may have changed), and after the view has refreshed the panes
        app.getController().on('update', refreshLayout);
        app.getView().on('refresh:layout', refreshLayout);

    } // class SidePane

    // constants ==============================================================

    /**
     * Default width of side panes, in pixels.
     */
    SidePane.DEFAULT_WIDTH = 249;

    // exports ================================================================

    // derive this class from class Pane
    return Pane.extend({ constructor: SidePane });

});
