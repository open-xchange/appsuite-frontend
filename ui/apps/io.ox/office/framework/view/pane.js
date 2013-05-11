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

define('io.ox/office/framework/view/pane',
    ['io.ox/core/event',
     'io.ox/office/tk/utils'
    ], function (Events, Utils) {

    'use strict';

    // class Pane =============================================================

    /**
     * Represents a container element attached to a specific border of the
     * application window.
     *
     * @constructor
     *
     * @extends Events
     *
     * @param {BaseApplication} app
     *  The application containing this pane element.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the new view pane.
     *  The following options are supported:
     *  @param {String} [options.classes]
     *      Additional CSS classes that will be set at the root DOM node of the
     *      view pane.
     *  @param {Object} [options.css]
     *      Additional CSS formatting that will be set at the root DOM node of
     *      the view pane.
     *  @param {String} [options.position='top']
     *      The border of the application window to attach the view pane to.
     *      Supported values are 'top', 'bottom', 'left', and 'right'.
     *  @param {String} [options.resizeable=false]
     *      If set to true, the pane will be resizeable at its inner border.
     *      Has no effect for transparent overlay panes.
     *  @param {Boolean} [options.overlay=false]
     *      If set to true, the pane will overlay the application pane instead
     *      of reserving and consuming the space needed for its size.
     *  @param {Boolean} [options.transparent=false]
     *      If set to true, the background of an overlay pane will be
     *      transparent. Has no effect if the pane is not in overlay mode.
     *  @param {Boolean} [options.hoverEffect=false]
     *      If set to true, the view components in a transparent overlay view
     *      pane will be displayed half-transparent as long as the mouse does
     *      not hover the view component. Has no effect if the pane is not in
     *      transparent overlay mode, or if the current device is a touch
     *      device.
     *  @param {Function} [options.componentInserter]
     *      A function that will implement inserting the root DOM node of a new
     *      view component into this view pane. The function receives the
     *      reference to the new view component instance as first parameter.
     *      Will be called in the context of this view pane instance. If
     *      omitted, view components will be appended to the root node of this
     *      view pane.
     */
    function Pane(app, options) {

        var // self reference
            self = this,

            // the container element representing the pane
            node = Utils.createContainerNode('view-pane unselectable', options),

            // position of the pane in the application window
            position = Utils.getStringOption(options, 'position', 'top'),

            // overlay pane or fixed pane
            overlay = Utils.getBooleanOption(options, 'overlay', false),

            // transparent overlay pane
            transparent = overlay && Utils.getBooleanOption(options, 'transparent', false),

            // minimum size of the view pane (for resizeable panes)
            minSize = Utils.getIntegerOption(options, 'minSize', 1, 1),

            // maximum size of the view pane (for resizeable panes)
            maxSize = Utils.getIntegerOption(options, 'maxSize', 0x7FFFFFFF, minSize),

            // view components contained in this pane
            components = [],

            // handler called to insert a new component into this view pane
            componentInserter = Utils.getFunctionOption(options, 'componentInserter'),

            // whether the view pane is oriented vertically
            vertical = Utils.isVerticalPosition(position),

            // the method to get or set the pane size, according to pane position
            paneSizeFunc = _.bind(node[vertical ? 'height' : 'width'], node),

            // correction factor for trailing view panes (enlarge when position becomes smaller)
            resizeFactor = Utils.isLeadingPosition(position) ? 1 : -1,

            // the original size of the view pane when tracking has been started
            originalSize = 0;

        // base constructor ---------------------------------------------------

        // add event hub
        Events.extend(this);

        // private methods ----------------------------------------------------

        /**
         * Returns the current size of the pane (width for left/right panes, or
         * height for top/bottom panes).
         */
        function getPaneSize() {
            return paneSizeFunc();
        }

        /**
         * Changes the size of the pane (width for left/right panes, or height
         * for top/bottom panes), and updates the entire view.
         */
        function setPaneSize(size) {
            if (getPaneSize() !== size) {
                paneSizeFunc(size);
                app.getView().refreshPaneLayout();
                self.trigger('resize', size);
            }
        }

        /**
         * Handles all tracking events to resize this view pane.
         */
        function trackingHandler(event) {
            switch (event.type) {
            case 'tracking:start':
                originalSize = getPaneSize();
                break;
            case 'tracking:move':
            case 'tracking:end':
                var size = originalSize + resizeFactor * (vertical ? event.offsetY : event.offsetX);
                setPaneSize(Utils.minMax(size, minSize, maxSize));
                break;
            case 'tracking:cancel':
                setPaneSize(originalSize);
                break;
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the root element representing this pane as jQuery object.
         */
        this.getNode = function () {
            return node;
        };

        /**
         * Returns the options map that has been passed to the constructor.
         */
        this.getOptions = function () {
            return options;
        };

        /**
         * Returns whether this view pane is currently visible.
         *
         * @returns {Boolean}
         *  Whether the view pane is currently visible.
         */
        this.isVisible = function () {
            return (node.css('display') !== 'none') && Utils.containsNode(document, node);
        };

        /**
         * Makes this view pane visible.
         *
         * @returns {Pane}
         *  A reference to this instance.
         */
        this.show = function () {
            return this.toggle(true);
        };

        /**
         * Hides this view pane.
         *
         * @returns {Pane}
         *  A reference to this instance.
         */
        this.hide = function () {
            return this.toggle(false);
        };

        /**
         * Changes the visibility of this view pane.
         *
         * @param {Boolean} [state]
         *  If specified, shows or hides the view pane independently from its
         *  current visibility state. If omitted, toggles the visibility of the
         *  view pane.
         *
         * @returns {Pane}
         *  A reference to this instance.
         */
        this.toggle = function (state) {
            var visible = this.isVisible();
            $.cancelTracking();
            node.toggle(state);
            if (visible !== this.isVisible()) {
                app.getView().refreshPaneLayout();
                this.trigger(this.isVisible() ? 'show' : 'hide');
            }
            return this;
        };

        /**
         * Returns the position of this view pane.
         *
         * @returns {String}
         *  The border of the application window this view pane is attached to.
         *  Possible values are 'top', 'bottom', 'left', and 'right'.
         */
        this.getPosition = function () {
            return position;
        };

        /**
         * Returns whether this pane is an overlay pane.
         *
         * @returns {Boolean}
         *  Whether this view pane is an overlay pane.
         */
        this.isOverlay = function () {
            return overlay;
        };

        /**
         * Returns whether this pane is a transparent overlay pane.
         *
         * @returns {Boolean}
         *  Whether this view pane is a transparent overlay pane.
         */
        this.isTransparent = function () {
            return transparent;
        };

        /**
         * Adds the passed view component into this pane.
         *
         * @param {Component} component
         *  The view component to be added to this pane.
         *
         * @returns {Pane}
         *  A reference to this instance.
         */
        this.addViewComponent = function (component) {
            components.push(component);
            if (_.isFunction(componentInserter)) {
                componentInserter.call(this, component);
            } else {
                node.append(component.getNode());
            }
            return this;
        };

        this.destroy = function () {
            this.events.destroy();
            _(components).invoke('destroy');
            node = components = null;
        };

        // initialization -----------------------------------------------------

        // no size tracking for transparent view panes
        if (!transparent && Utils.getBooleanOption(options, 'resizeable', false)) {
            $('<div>').addClass('resizer ' + position)
                .enableTracking()
                .on('tracking:start tracking:move tracking:end tracking:cancel', trackingHandler)
                .appendTo(node);
        }

        // overlay mode
        node.toggleClass('overlay', overlay);
        if (transparent) {
            node[Utils.isVerticalPosition(position) ? 'height' : 'width'](0);
            // hover effect for view components embedded in the pane (not for touch devices)
            if (!Modernizr.touch && Utils.getBooleanOption(options, 'hoverEffect', false)) {
                node.addClass('hover-effect');
            }
        }

    } // class Pane

    // exports ================================================================

    return _.makeExtendable(Pane);

});
