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

define('io.ox/office/tk/view/pane',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/view/component',
     'io.ox/office/tk/view/toolbox'
    ], function (Utils, Component, ToolBox) {

    'use strict';

    // class Pane =============================================================

    /**
     * Represents a container element attached to a specific border of the
     * application window.
     *
     * @constructor
     *
     * @param {OfficeApplication} app
     *  The application containing this pane element.
     *
     * @param {String} id
     *  The unique identifier of the view pane.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new view pane.
     *  The following options are supported:
     *  @param {Boolean} [options.transparent=false]
     *      If set to true, the background of the pane will be transparent.
     *  @param {String} [options.classes]
     *      Additional CSS classes that will be set at the root DOM node of the
     *      view pane.
     *  @param {Object} [options.css]
     *      Additional CSS formatting that will be set at the root DOM node of
     *      the view pane.
     */
    function Pane(app, id, options) {

        var // the container element representing the pane
            node = Utils.createContainerNode('view-pane', options),

            // view components contained in this pane
            components = [];

        // methods ------------------------------------------------------------

        /**
         * Returns the root element representing this pane as jQuery object.
         */
        this.getNode = function () {
            return node;
        };

        /**
         * Returns the unique identifier of this view pane.
         */
        this.getIdentifier = function () {
            return id;
        };

        /**
         * Adds the passed view component into this pane, and registers it at
         * the application controller.
         *
         * @param {Component} component
         *  The view component to be added to this pane.
         *
         * @returns {Pane}
         *  A reference to this instance.
         */
        this.addViewComponent = function (component) {
            components.push(component);
            node.append(component.getNode());
            app.getController().registerViewComponent(component);
            return this;
        };

        /**
         * Creates a new tool box component in this pane, and registers it at
         * the application controller.
         *
         * @param {Object} [options]
         *  A map of options for the tool box in the pane. Supports all options
         *  supported by the ToolBox class constructor.
         *
         * @returns {ToolBox}
         *  The new tool box component.
         */
        this.createToolBox = function (options) {
            var toolBox = new ToolBox(app, options);
            this.addViewComponent(toolBox);
            return toolBox;
        };

        this.destroy = function () {
            _(components).each(function (component) {
                app.getController().unregisterViewComponent(component);
                component.destroy();
            });
            node = components = null;
        };

        // initialization -----------------------------------------------------

        // additional CSS classes
        node.toggleClass('transparent', Utils.getBooleanOption(options, 'transparent', false));

    } // class Pane

    // exports ================================================================

    return _.makeExtendable(Pane);

});
