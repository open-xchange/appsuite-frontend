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
     * Instances of this class trigger the following events:
     * - 'pane:show': After the view pane has been shown or hidden. The event
     *      handler receives the new visibility state.
     * - 'pane:resize': After the view pane has been resized. The event handler
     *      receives the new size of the resizeable dimension, in pixels.
     * - 'pane:layout': After the size of the view pane has been changed, by
     *      manipulating (showing, hiding, changing) the view components or
     *      control groups it contains.
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
     *  @param {String} [options.size]
     *      The size of the pane, between window border and application pane.
     *      If omitted, the size will be determined by the DOM contents of the
     *      pane root node.
     *  @param {String} [options.resizeable=false]
     *      If set to true, the pane will be resizeable at its inner border.
     *      Has no effect for transparent overlay panes.
     *  @param {String} [options.minSize=1]
     *      The minimum size of resizeable panes (when the 'options.resizeable'
     *      option is set to true).
     *  @param {String} [options.maxSize=0x7FFFFFFF]
     *      The maximum size of resizeable panes (when the 'options.resizeable'
     *      option is set to true).
     *  @param {Boolean} [options.overlay=false]
     *      If set to true, the pane will overlay the application pane instead
     *      of reserving and consuming the space needed for its size.
     *  @param {Boolean} [options.transparent=false]
     *      If set to true, the background of an overlay pane will be
     *      transparent. Has no effect if the pane is not in overlay mode.
     *  @param {Boolean} [options.hoverEffect=false]
     *      If set to true, all control groups in all view components will be
     *      displayed half-transparent as long as the mouse does not hover the
     *      view pane. Has no effect, if the current device is a touch device.
     *  @param {Boolean} [options.enableContextMenu=false]
     *      If set to true, the view pane will enable the browser context menu.
     *      Otherwise, the context menu will be disabled for all DOM nodes but
     *      for text input fields and text areas.
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

            // the last cached size of the root node, used to detect layout changes
            nodeSize = null,

            // position of the pane in the application window
            position = Utils.getStringOption(options, 'position', 'top'),

            // initial size of the pane in the application window
            size = Utils.getIntegerOption(options, 'size', 0, 0),

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
            resizeFactor = Utils.isLeadingPosition(position) ? 1 : -1;

        // base constructor ---------------------------------------------------

        // add event hub
        Events.extend(this);

        // private methods ----------------------------------------------------

        /**
         * Returns the current outer size of the root node of this view
         * component. If the node is currently invisible, returns the last
         * cached size.
         */
        function getNodeSize() {
            return self.isReallyVisible() ? { width: node.outerWidth(), height: node.outerHeight() } : nodeSize;
        }

        /**
         * Handles 'component:show' and 'component:layout' events. Triggers a
         * 'pane:layout' event to all listeners, if the size of this view pane
         * has been changed due to the changed component.
         */
        function componentLayoutHandler() {
            var newNodeSize = getNodeSize();
            if (!_.isEqual(nodeSize, newNodeSize)) {
                nodeSize = newNodeSize;
                self.trigger('pane:layout');
            }
        }

        /**
         * Handles all tracking events to resize this view pane.
         */
        var trackingHandler = (function () {

            var // the original size of the view pane when tracking has been started
                originalSize = 0;

            function setPaneSize(size) {
                if (paneSizeFunc() !== size) {
                    paneSizeFunc(size);
                    nodeSize = getNodeSize();
                    self.trigger('pane:resize', size);
                }
            }

            function trackingHandler(event) {
                switch (event.type) {
                case 'tracking:start':
                    originalSize = paneSizeFunc();
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

            return trackingHandler;
        }()); // end of local scope of method trackingHandler()

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
            return node.css('display') !== 'none';
        };

        /**
         * Returns whether this view pane is effectively visible (it must not
         * be hidden by itself, it must be inside the DOM tree, and all its
         * parent nodes must be visible too).
         */
        this.isReallyVisible = function () {
            return node.is(Utils.REALLY_VISIBLE_SELECTOR);
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
            var visible = (state === true) || ((state !== false) && !this.isVisible());
            $.cancelTracking();
            if (this.isVisible() !== visible) {
                node.toggle(state);
                this.trigger('pane:show', visible);
                nodeSize = getNodeSize();
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

            // store component
            components.push(component);

            // insert the root node of the component into this view pane
            if (_.isFunction(componentInserter)) {
                componentInserter.call(this, component);
            } else {
                node.append(component.getNode());
            }

            // update the CSS marker class for an opened drop-down menu
            component.on({
                'component:show component:layout': componentLayoutHandler,
                'group:focus': function () { self.getNode().addClass(Utils.FOCUSED_CLASS); },
                'group:blur': function () { self.getNode().removeClass(Utils.FOCUSED_CLASS); }
            });

            return this;
        };

        /**
         * Visits all view components registered at this view pane.
         *
         * @param {Function} iterator
         *  The iterator called for each view component. Receives the reference
         *  to the view component, and its insertion index. If the iterator
         *  returns the Utils.BREAK object, the iteration process will be
         *  stopped immediately.
         *
         * @param {Object} [context]
         *  If specified, the iterator will be called with this context (the
         *  symbol 'this' will be bound to the context inside the iterator
         *  function).
         *
         * @returns {Utils.BREAK|Undefined}
         *  A reference to the Utils.BREAK object, if the iterator has returned
         *  Utils.BREAK to stop the iteration process, otherwise undefined.
         */
        this.iterateViewComponents = function (iterator, context) {
            return _(components).any(function (component, index) {
                return iterator.call(context, component, index) === Utils.BREAK;
            }) ? Utils.BREAK : undefined;
        };

        this.destroy = function () {
            this.events.destroy();
            _(components).invoke('destroy');
            node = components = null;
        };

        // initialization -----------------------------------------------------

        // marker for touch devices
        node.toggleClass('touch', Modernizr.touch);

        // fixed size if specified
        if (size > 0) {
            paneSizeFunc(size);
        }

        // no size tracking for transparent view panes
        if (!transparent && Utils.getBooleanOption(options, 'resizeable', false)) {
            $('<div>').addClass('resizer ' + position)
                .append($('<div>').addClass('handle h1'), $('<div>').addClass('handle h2'))
                .enableTracking()
                .on('tracking:start tracking:move tracking:end tracking:cancel', trackingHandler)
                .appendTo(node);
        }

        // overlay mode
        node.toggleClass('overlay', overlay);
        if (transparent) {
            node[Utils.isVerticalPosition(position) ? 'height' : 'width'](0);
            // hover effect for view components embedded in the pane
            node.toggleClass('hover-effect', Utils.getBooleanOption(options, 'hoverEffect', false));
        }

        // context menu support
        if (!Utils.getBooleanOption(options, 'enableContextMenu', false)) {
            node.on('contextmenu', function (event) {
                if (!$(event.target).is('input,textarea')) { return false; }
            });
        }

        // disable dragging of controls (otherwise, it is possible to drag buttons and other controls around)
        node.on('dragstart', Utils.BUTTON_SELECTOR + ',input,textarea,label', false);

    } // class Pane

    // exports ================================================================

    return _.makeExtendable(Pane);

});
