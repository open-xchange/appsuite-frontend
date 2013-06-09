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

define('io.ox/office/framework/view/nodetracking', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes,

        // the map of all events to be bound to a node to start tracking
        NODE_EVENT_MAP = {
            mousedown: mouseDownHandler,
            touchstart: touchStartHandler
        },

        // the map of all events to be bound to the document when tracking starts
        DOCUMENT_EVENT_MAP = {
            mousemove: mouseMoveHandler,
            mouseup: mouseUpHandler,
            touchmove: touchMoveHandler,
            touchend: touchEndHandler,
            touchcancel: cancelTracking,
            keydown: keyDownHandler
        },

        // the map of all events to be bound to the document after tracking has started
        DEFERRED_EVENT_MAP = {
            mousedown: cancelTracking,
            touchstart: cancelTracking,
            focusout: cancelTracking
        },

        // the node that is currently tracked
        trackingNode = null,

        // the overlay node to preserve the mouse pointer while tracking
        overlayNode = $('<div>').addClass('abs').css('z-index', 10000),

        // the initial tracking position
        startX = 0, startY = 0,

        // the tracking position passed to the last event
        lastX = 0, lastY = 0,

        // the browser timer used for auto-scrolling
        scrollTimer = null;

    // private global functions ===============================================

    /**
     * Triggers the specified event at the current tracking node. Always
     * inserts the properties 'startX' and 'startY' into the event object.
     *
     * @param {String} type
     *  The name of the event.
     *
     * @param {jQuery.Event} [sourceEvent]
     *  The original event object that caused the tracking event. Will be used
     *  to pass the state of additional control keys (SHIFT, ALT, CTRL, META)
     *  to the event listeners.
     *
     * @param {Object} [data]
     *  Additional properties to be inserted into the event object passed to
     *  all event listeners.
     */
    function triggerEvent(type, sourceEvent, data) {

        var // the event object passed to all listeners
            event = _.extend({ type: type, startX: startX, startY: startY }, data);

        // extend with states of all control keys
        if (_.isObject(sourceEvent)) {
            _(event).extend({
                shiftKey: sourceEvent.shiftKey,
                altKey: sourceEvent.altKey,
                ctrlKey: sourceEvent.ctrlKey,
                metaKey: sourceEvent.metaKey
            });
        }

        // trigger the event
        trackingNode.trigger(event);
    }

    /**
     * Initializes auto-scrolling mode after tracking has been started.
     */
    function initAutoScrolling(sourceNode, pageX, pageY) {

        var // additional options for auto-scrolling
            trackingOptions = $(sourceNode).data('tracking-options') || {},
            // whether horizontal auto-scrolling is enabled
            horizontal = Utils.getBooleanOption(trackingOptions, 'autoScroll', false) || (Utils.getStringOption(trackingOptions, 'autoScroll') === 'horizontal'),
            // whether vertical auto-scrolling is enabled
            vertical = Utils.getBooleanOption(trackingOptions, 'autoScroll', false) || (Utils.getStringOption(trackingOptions, 'autoScroll') === 'vertical'),
            // the border node for auto-scrolling
            borderNode = ('borderNode' in trackingOptions) ? $(trackingOptions.borderNode).first() : $(sourceNode),
            // the minimum increment for auto-scrolling
            minIncrement = Utils.getIntegerOption(trackingOptions, 'minIncrement', 10, 1),
            // the maximum increment for auto-scrolling
            maxIncrement = Utils.getIntegerOption(trackingOptions, 'maxIncrement', Math.max(100, minIncrement), minIncrement),
            // the maximum increment for auto-scrolling
            acceleration = Utils.getNumberOption(trackingOptions, 'acceleration', 1.2, 1.05),
            // the inner padding in the scroll node where auto-scrolling is active
            innerPadding = Utils.getIntegerOption(trackingOptions, 'innerPadding', 0, 0),
            // the time in milliseconds between auto-scrolling events
            scrollInterval = Utils.getIntegerOption(trackingOptions, 'scrollInterval', 100, 100),
            // the last increment for auto-scrolling, in horizontal and vertical direction
            scrollX = 0, scrollY = 0;

        if (horizontal || vertical) {

            scrollTimer = window.setInterval(function () {

                var // the current screen position of the scroll node
                    scrollBorder = Utils.getNodePositionInWindow(borderNode);

                // calculate new horizontal increment
                if (horizontal) {
                    if (lastX < scrollBorder.left + innerPadding) {
                        scrollX = (scrollX > -minIncrement) ? -minIncrement : Math.max(-maxIncrement, scrollX * acceleration);
                    } else if (lastX >= scrollBorder.left + scrollBorder.width - innerPadding) {
                        scrollX = (scrollX < minIncrement) ? minIncrement : Math.min(maxIncrement, scrollX * acceleration);
                    } else {
                        scrollX = 0;
                    }
                }

                // calculate new vertical increment
                if (vertical) {
                    if (lastY < scrollBorder.top + innerPadding) {
                        scrollY = (scrollY > -minIncrement) ? -minIncrement : Math.max(-maxIncrement, scrollY * acceleration);
                    } else if (lastY >= scrollBorder.top + scrollBorder.height - innerPadding) {
                        scrollY = (scrollY < minIncrement) ? minIncrement : Math.min(maxIncrement, scrollY * acceleration);
                    } else {
                        scrollY = 0;
                    }
                }

                // notify listeners
                if ((Math.round(scrollX) !== 0) || (Math.round(scrollY) !== 0)) {
                    triggerEvent('tracking:scroll', undefined, { pageX: lastX, pageY: lastY, scrollX: Math.round(scrollX), scrollY: Math.round(scrollY) });
                }

            }, scrollInterval);
        }
    }

    /**
     * Deinitializes auto-scrolling mode after tracking has been finished or
     * canceled.
     */
    function deinitAutoScrolling() {
        window.clearTimeout(scrollTimer);
        scrollTimer = null;
    }

    /**
     * Initializes tracking mode after tracking has been started.
     */
    function initTracking(sourceNode, targetNode, pageX, pageY) {

        // store the current tracing node
        trackingNode = $(sourceNode);
        startX = lastX = pageX;
        startY = lastY = pageY;

        // insert the overlay node for mouse pointer
        $('body').append(overlayNode.css('cursor', $(targetNode).css('cursor')));

        // register event listeners
        $(document).on(DOCUMENT_EVENT_MAP);
        // attach deferred events that would otherwise interfere with tracking
        // start event (e.g. another 'mousedown' event or a 'focusout' event
        // that causes canceling tracking otherwise). Check that tracking is
        // still active, a 'mouseup' event may be triggered before the deferred
        // code actually runs.
        _.defer(function () {
            if (trackingNode) {
                // fail-save: prevent double registration of the handlers
                $(document).off(DEFERRED_EVENT_MAP).on(DEFERRED_EVENT_MAP);
            }
        });

        // initialize auto scrolling
        initAutoScrolling(sourceNode, pageX, pageY);
    }

    /**
     * Deinitializes tracking mode after is has been finished or canceled.
     */
    function deinitTracking() {
        $(document).off(DOCUMENT_EVENT_MAP).off(DEFERRED_EVENT_MAP);
        trackingNode = null;
        overlayNode.remove();
        deinitAutoScrolling();
    }

    /**
     * Immediately stops tracking if it is currently active. Triggers a
     * 'tracking:cancel' event at the current tracking node.
     */
    function cancelTracking() {
        if (trackingNode) {
            triggerEvent('tracking:cancel');
            deinitTracking();
        }
    }

    /**
     * Starts tracking the passed source node. Triggers a 'tracking:start'
     * event at the current tracking node.
     */
    function trackingStart(event, sourceNode, pageX, pageY) {
        cancelTracking();
        initTracking(sourceNode, event.target, pageX, pageY);
        triggerEvent('tracking:start', event, { target: event.target, pageX: pageX, pageY: pageY });
    }

    /**
     * Triggers a 'tracking:move' event at the current tracking node, if the
     * tracking position has been changed since the last call of this method.
     */
    function trackingMove(event, pageX, pageY) {
        var moveX = pageX - lastX, moveY = pageY - lastY;
        if (trackingNode && (moveX !== 0) || (moveY !== 0)) {
            triggerEvent('tracking:move', event, { pageX: pageX, pageY: pageY, moveX: moveX, moveY: moveY, offsetX: pageX - startX, offsetY: pageY - startY });
            lastX = pageX;
            lastY = pageY;
        }
    }

    /**
     * Stops tracking the current tracking node normally. Triggers a
     * 'tracking:end' event at the current tracking node.
     */
    function trackingEnd(event, pageX, pageY) {
        if (trackingNode) {
            trackingMove(event, pageX, pageY);
            triggerEvent('tracking:end', event, { pageX: pageX, pageY: pageY, endX: pageX, endY: pageY, offsetX: pageX - startX, offsetY: pageY - startY });
            deinitTracking();
        }
    }

    /**
     * Event handler for 'mousedown' browser events.
     */
    function mouseDownHandler(event) {
        if (event.button === 0) {
            trackingStart(event, this, event.pageX, event.pageY);
        } else {
            cancelTracking();
        }
    }

    /**
     * Event handler for 'mousemove' browser events.
     */
    function mouseMoveHandler(event) {
        trackingMove(event, event.pageX, event.pageY);
    }

    /**
     * Event handler for 'mouseup' browser events.
     */
    function mouseUpHandler(event) {
        trackingEnd(event, event.pageX, event.pageY);
    }

    /**
     * Event handler for 'touchstart' browser events.
     */
    function touchStartHandler(event) {
        var touches = event.originalEvent.touches,
            changed = event.originalEvent.changedTouches;
        if ((touches.length === 1) && (changed.length === 1)) {
            trackingStart(event, this, changed[0].pageX, changed[0].pageY);
        } else {
            cancelTracking();
        }
    }

    /**
     * Event handler for 'touchmove' browser events.
     */
    function touchMoveHandler(event) {
        var touches = event.originalEvent.touches,
            changed = event.originalEvent.changedTouches;
        if ((touches.length === 1) && (changed.length === 1)) {
            trackingMove(event, changed[0].pageX, changed[0].pageY);
        } else {
            cancelTracking();
        }
    }

    /**
     * Event handler for 'touchend' browser events.
     */
    function touchEndHandler(event) {
        var touches = event.originalEvent.touches,
            changed = event.originalEvent.changedTouches;
        if ((touches.length === 0) && (changed.length === 1)) {
            trackingEnd(event, changed[0].pageX, changed[0].pageY);
        } else {
            cancelTracking();
        }
    }

    /**
     * Event handler for 'keydown' browser events.
     */
    function keyDownHandler(event) {
        if (event.keyCode === KeyCodes.ESCAPE) {
            cancelTracking();
        }
    }

    // static initialization ==================================================

    /**
     * Enables tracking events for all nodes contained in the current
     * collection. If one of the nodes is clicked or tapped, and dragged
     * around while holding the mouse button or keeping the device touched, it
     * will trigger specific tracking events ('tracking:start',
     * 'tracking:move', 'tracking:end', and 'tracking:cancel') that can be used
     * to implement the desired behavior, similar to the browser system mouse
     * or touch events (for example: moving a DOM node around, resizing a DOM
     * node, all other kinds of selection behavior, drawing in a canvas).
     * Additionally, while tracking is active, automatic scrolling of a
     * scrollable node can be implemented by listening to the tracking event
     * 'tracking:scroll'.
     *
     * The following events will be triggered by every tracked node:
     *
     * - 'tracking:start'
     *      Directly after tracking has been started with a mouse click or by
     *      tapping the node. The event object contains the following
     *      properties:
     *      (1) {Number} pageX, {Number} pageY
     *          The page position of the initial click/tap, as received from
     *          the corresponding browser event.
     *      (2) {Number} startX, {Number} startY
     *          The start position that will also be passed to all subsequent
     *          'tracking:move', 'tracking:end', and 'tracking:cancel' events.
     *          Here, will be equal to the 'pageX' and 'pageY' properties.
     *      (3) {HTMLElement} target
     *          The target node, as received from the corresponding browser
     *          event.
     *
     * - 'tracking:move'
     *      While dragging the mouse or touch point around. The event object
     *      contains the following properties:
     *      (1) {Number} pageX, {Number} pageY
     *          The page position, as received from the corresponding browser
     *          event.
     *      (2) {Number} startX, {Number} startY
     *          The start position of this tracking sequence, as passed to the
     *          initial 'tracking:start' event.
     *      (3) {Number} moveX, {Number} moveY
     *          The difference between the position of the previous
     *          'tracking:move' event (or the initial 'tracking:start' event,
     *          if this is the first 'tracking:move' event) and the current
     *          tracking position.
     *      (4) {Number} offsetX, {Number} offsetY
     *          The difference between the position of the initial
     *          'tracking:start' event and the current tracking position.
     *
     * - 'tracking:end'
     *      After releasing the mouse or touch point. The event object contains
     *      the following properties:
     *      (1) {Number} pageX, {Number} pageY
     *          The page position, as received from the corresponding browser
     *          event.
     *      (2) {Number} startX, {Number} startY
     *          The start position of this tracking sequence, as passed to the
     *          initial 'tracking:start' event.
     *      (3) {Number} endX, {Number} endY
     *          The final position of this tracking sequence. Will be equal to
     *          the 'pageX' and 'pageY' properties.
     *      (4) {Number} offsetX, {Number} offsetY
     *          The difference between the position of the initial
     *          'tracking:start' event and the final tracking position.
     *
     * - 'tracking:cancel'
     *      When tracking has been cancelled. This may happen by pressing the
     *      ESCAPE key, by using several touch points on a touch device, by
     *      canceling the current touch sequence somehow depending on the touch
     *      device, or by calling the static method jQuery.cancelTracking()
     *      directly. The event object contains the following properties:
     *      (1) {Number} startX, {Number} startY
     *          The start position of this tracking sequence, as passed to the
     *          initial 'tracking:start' event.
     *
     * - 'tracking:scroll'
     *      While dragging the mouse or touch point around with auto-scrolling
     *      enabled (see below for the 'options' parameter of this method), and
     *      the border of the scroll border node has been reached or left. The
     *      event object contains the following properties:
     *      (1) {Number} pageX, {Number} pageY
     *          The page position, as passed to the previous 'tracking:move'
     *          event (or the initial 'tracking:start' event, if no
     *          'tracking:move' event has been triggered yet).
     *      (2) {Number} startX, {Number} startY
     *          The start position of this tracking sequence, as passed to the
     *          initial 'tracking:start' event.
     *      (3) {Number} scrollX, {Number} scrollY
     *          The suggested horizontal and vertical scrolling distance. These
     *          values will start at the minimum distance, and will increase
     *          over time to the maximum distance configured in the 'options'
     *          parameter of this method.
     *
     * Additionally, the event objects of all events but the 'tracking:cancel'
     * and 'tracking:scroll' event will contain the properties 'shiftKey',
     * 'altKey', 'ctrlKey', and 'metaKey' with the values copied from the
     * originating GUI events (mouse events or touch events).
     *
     * @param {Object} [options]
     *  Additional options controlling the behavior of the tracking nodes. The
     *  following options are supported:
     *  @param {Boolean|String} [options.autoScroll=false]
     *      If set to true, auto-scrolling will be activated for horizontal and
     *      vertical direction. If set to either 'horizontal' or 'vertical',
     *      auto-scrolling will be enabled only for the specified direction.
     *      The active tracking node will trigger 'tracking:scroll' events
     *      repeatedly as long as the mouse or touch point hovers or leaves the
     *      borders of a certain rectangle (of either the tracking node itself,
     *      or another custom node in the DOM, see the 'borderNode' option).
     *  @param {jQuery|HTMLElement|String} [options.borderNode]
     *      If specified, the node that will be used to decide whether to
     *      enable auto-scrolling mode. If the mouse or touch point reaches or
     *      leaves the borders of this node, 'tracking:scroll' events will be
     *      triggered. If omitted, the border of the active tracking node will
     *      be used instead. Has no effect, if the option 'autoScroll' has not
     *      been set to true.
     *  @param {Integer} [options.minIncrement=10]
     *      The minimum amount of pixels (absolute value) passed to listeners
     *      of the 'tracking:scroll' event while auto-scrolling mode is active.
     *      Has no effect, if the option 'autoScroll' has not been set to true.
     *  @param {Integer} [options.maxIncrement=100]
     *      The maximum amount of pixels (absolute value) passed to listeners
     *      of the 'tracking:scroll' event while auto-scrolling mode is active.
     *      Has no effect, if the option 'autoScroll' has not been set to true.
     *  @param {Integer} [options.innerPadding=0]
     *      The inner distance from the borders of the scroll node where
     *      auto-scrolling will be active. Has no effect, if the option
     *      'autoScroll' has not been set to true.
     *  @param {Integer} [options.scrollInterval=100]
     *      The minimum time in milliseconds between two 'tracking:scroll'
     *      events. Has no effect, if the option 'autoScroll' has not been set
     *      to true.
     *
     * @returns {jQuery}
     *  A reference to this collection.
     */
    $.fn.enableTracking = function (options) {
        // prevent multiple registration of the event handlers
        return this.off(NODE_EVENT_MAP).on(NODE_EVENT_MAP).data('tracking-options', options);
    };

    /**
     * Disables tracking events for all nodes contained in the current
     * collection. If one of the nodes is currently tracked, tracking will be
     * cancelled.
     *
     * @returns {jQuery}
     *  A reference to this collection.
     */
    $.fn.disableTracking = function () {
        // stop tracking if current tracking node is contained in passed nodes
        if (trackingNode && (this.filter(trackingNode).length > 0)) {
            cancelTracking();
        }
        return this.off(NODE_EVENT_MAP);
    };

    /**
     * Cancels tracking the current tracking node. The tracking node will
     * trigger a 'tracking:cancel' event.
     */
    $.cancelTracking = cancelTracking;

});
