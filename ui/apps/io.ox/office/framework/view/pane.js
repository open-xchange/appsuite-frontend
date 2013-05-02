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

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class PaneSizeTracking =================================================

    /**
     * Implementation helper for resizeable view panes. Inserts a draggable DOM
     * element at the inner border of the view pane, and implements mouse event
     * handling.
     */
    function PaneSizeTracking(app, pane) {

        var // self reference
            self = this,

            // the map of all events to be bound to the window while tracking
            EVENT_MAP = null,

            // the options map of the view pane
            options = pane.getOptions(),

            // minimum size of the view pane
            minSize = Utils.getIntegerOption(options, 'minSize', 1, 1),

            // maximum size of the view pane
            maxSize = Utils.getIntegerOption(options, 'maxSize', 0x7FFFFFFF, minSize),

            // the position of the view pane
            position = pane.getPosition(),

            // whether the view pane is oriented vertically
            vertical = Utils.isVerticalPosition(position),

            // correction factor for trailing view panes (enlarge when offset becomes smaller)
            factor = Utils.isLeadingPosition(position) ? 1 : -1,

            // the method to get or set the pane size
            paneSizeFunc = _.bind(pane.getNode()[vertical ? 'height' : 'width'], pane.getNode()),

            // whether tracking is currently active
            tracking = false,

            // the original size of the view pane when tracking has been started
            originalSize = 0,

            // the start mouse offset when tracking has been started
            startOffset = 0;

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
                pane.trigger('resize', size);
            }
        }

        /**
         * Returns the screen offset from the passed mouse event (x-offset for
         * left/right panes, or y-offset for top/bottom panes).
         */
        function getOffset(event) {
            return vertical ? event.pageY : event.pageX;
        }

        /**
         * Starts mouse tracking to change the view pane size.
         */
        function startTracking(event) {
            originalSize = getPaneSize();
            startOffset = getOffset(event);
            tracking = true;
            $(window).on(EVENT_MAP);
        }

        /**
         * Handles tracking events and changes the view pane size.
         */
        function trackingHandler(event) {
            var size = originalSize + (getOffset(event) - startOffset) * factor;
            setPaneSize(Utils.minMax(size, minSize, maxSize));
        }

        /**
         * Handles global keyboard events (e.g. cancel tracking with Escape
         * button).
         */
        function keyHandler(event) {
            if (event.keyCode === KeyCodes.ESCAPE) {
                self.cancelTracking();
            }
        }

        /**
         * Stops mouse tracking and removes all global event listeners.
         */
        function stopTracking() {
            if (tracking) {
                $(window).off(EVENT_MAP);
                tracking = false;
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Cancels mouse tracking and restores the original view pane size.
         */
        this.cancelTracking = function () {
            if (tracking) {
                stopTracking();
                setPaneSize(originalSize);
            }
        };

        this.destroy = function () {
            this.cancelTracking();
        };

        // initialization -----------------------------------------------------

        // no size tracking for transparent view panes
        if (!pane.isTransparent() && Utils.getBooleanOption(options, 'resizeable', false)) {

            // initialize tracking event map
            EVENT_MAP = {
                mousemove: trackingHandler,
                keydown: keyHandler,
                mouseup: stopTracking
            };

            // create draggable node to resize the pane, start mouse tracking on mouse click
            $('<div>').addClass('resizer ' + position)
                .appendTo(pane.getNode())
                .on('mousedown', startTracking);
        }

    } // class PaneSizeTracking

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

        var // the container element representing the pane
            node = Utils.createContainerNode('view-pane unselectable', options),

            // position of the pane in the application window
            position = Utils.getStringOption(options, 'position', 'top'),

            // overlay pane or fixed pane
            overlay = Utils.getBooleanOption(options, 'overlay', false),

            // transparent overlay pane
            transparent = overlay && Utils.getBooleanOption(options, 'transparent', false),

            // view components contained in this pane
            components = [],

            // handler called to insert a new component into this view pane
            componentInserter = Utils.getFunctionOption(options, 'componentInserter'),

            // mouse tracker for resizeable panes
            sizeTracking = null;

        // base constructor ---------------------------------------------------

        // add event hub
        Events.extend(this);

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
            sizeTracking.cancelTracking();
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
            sizeTracking.destroy();
            _(components).invoke('destroy');
            node = components = sizeTracking = null;
        };

        // initialization -----------------------------------------------------

        // mouse tracking for resizeable panes
        sizeTracking = new PaneSizeTracking(app, this);

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
