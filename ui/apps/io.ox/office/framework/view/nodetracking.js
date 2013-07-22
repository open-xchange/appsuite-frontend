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

define('io.ox/office/framework/view/nodetracking',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/keycodes'
    ], function (Utils, KeyCodes) {

    'use strict';

    var // the map of all mouse events to be bound to a node to start tracking
        MOUSE_START_EVENT_MAP = {
            mousedown: mouseDownHandler
        },

        // the map of all touch events to be bound to a node to start tracking
        TOUCH_START_EVENT_MAP = {
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
            touchstart: cancelTracking
        },

        // the node that is currently tracked
        trackingNode = null,

        // the overlay node to preserve the mouse pointer while tracking
        overlayNode = $('<div>').addClass('abs').css('z-index', 10000),

        // the initial tracking position
        startX = 0, startY = 0,

        // the tracking position passed to the last event
        lastX = 0, lastY = 0,

        // whether the mouse or touch point has been moved after tracking has started
        moved = false,

        // the browser timer used for initial auto-repetition
        repeatDelayTimer = null,

        // the browser interval timer used for auto-repetition
        repeatIntervalTimer = null,

        // the browser timer used for auto-scrolling
        scrollIntervalTimer = null;

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
     *  to pass the state of additional modifier keys (SHIFT, ALT, CTRL, META)
     *  to the event listeners.
     *
     * @param {Object} [data]
     *  Additional properties to be inserted into the event object passed to
     *  all event listeners.
     */
    function triggerEvent(type, sourceEvent, data) {

        var // the event object passed to all listeners
            event = _.extend({ type: type, startX: startX, startY: startY }, data);

        // extend with states of all modifier keys
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
     * Initializes auto-repetition and auto-scrolling mode after tracking has
     * been started.
     */
    function initAutoMode() {

        var // additional options for auto-repetition and auto-scrolling
            trackingOptions = trackingNode.data('tracking-options') || {},

            // whether auto-repetition is enabled
            autoRepeat = Utils.getBooleanOption(trackingOptions, 'autoRepeat', false),
            // the time in milliseconds for first 'tracking:repeat' event
            repeatDelay = Utils.getIntegerOption(trackingOptions, 'repeatDelay', 700, 10),
            // the time in milliseconds between 'tracking:repeat' events
            repeatInterval = Utils.getIntegerOption(trackingOptions, 'repeatInterval', 100, 10),

            // whether horizontal auto-scrolling is enabled
            scrollHorizontal = Utils.getBooleanOption(trackingOptions, 'autoScroll', false) || (Utils.getStringOption(trackingOptions, 'autoScroll') === 'horizontal'),
            // whether vertical auto-scrolling is enabled
            scrollVertical = Utils.getBooleanOption(trackingOptions, 'autoScroll', false) || (Utils.getStringOption(trackingOptions, 'autoScroll') === 'vertical'),
            // the time in milliseconds between 'tracking:scroll' events
            scrollInterval = Utils.getIntegerOption(trackingOptions, 'scrollInterval', 100, 100),

            // the border node for auto-scrolling
            borderNode = ('borderNode' in trackingOptions) ? $(trackingOptions.borderNode).first() : trackingNode,
            // the margin around the border box where auto-scrolling becomes active
            borderMargin = Utils.getIntegerOption(trackingOptions, 'borderMargin', 0),
            // the size of the border around the scrolling border box for acceleration
            borderSize = Utils.getIntegerOption(trackingOptions, 'borderSize', 30, 0),

            // the minimum scrolling speed
            minSpeed = Utils.getIntegerOption(trackingOptions, 'minSpeed', 10, 1),
            // the maximum scrolling speed
            maxSpeed = Utils.getIntegerOption(trackingOptions, 'maxSpeed', Math.max(100, minSpeed), minSpeed),
            // the speed acceleration between two 'tracking:scroll' events
            acceleration = Utils.getNumberOption(trackingOptions, 'acceleration', 1.2, 1.05),

            // the last scroll increment, in horizontal and vertical direction
            scrollX = 0, scrollY = 0;

        // returns the current outer border box
        function getBorderBox() {

            var // the current screen position of the border node
                borderBox = Utils.getNodePositionInWindow(borderNode);

            // add border margin
            borderBox.left -= borderMargin;
            borderBox.right -= borderMargin;
            borderBox.width += 2 * borderMargin;
            borderBox.top -= borderMargin;
            borderBox.bottom -= borderMargin;
            borderBox.height += 2 * borderMargin;
            return borderBox;
        }

        // callback for the auto-repetition timers
        function autoRepeatHandler() {

            var // the current screen position of the border node
                borderBox = getBorderBox();

            // trigger event if tracking position hovers border box
            if ((borderBox.left <= lastX) && (lastX < borderBox.left + borderBox.width) && (borderBox.top <= lastY) && (lastY < borderBox.top + borderBox.height)) {
                triggerEvent('tracking:repeat', undefined, { pageX: lastX, pageY: lastY });
            }
        }

        // returns the maximum speed for the passed distance to the border box
        function getMaxSpeed(distance) {
            return (borderSize === 0) ? maxSpeed : (Math.min(1, (distance - 1) / borderSize) * (maxSpeed - minSpeed) + minSpeed);
        }

        // callback for the auto-scrolling interval timer
        function autoScrollHandler() {

            var // the current screen position of the border node
                borderBox = getBorderBox(),
                // the distances from border box to tracking position
                leftDist = scrollHorizontal ? (borderBox.left - lastX) : 0,
                rightDist = scrollHorizontal ? (lastX - (borderBox.left + borderBox.width)) : 0,
                topDist = scrollVertical ? (borderBox.top - lastY) : 0,
                bottomDist = scrollVertical ? (lastY - (borderBox.top + borderBox.height)) : 0;

            // start auto-scrolling after the first 'tracking:move' event
            if (!moved) { return; }

            // calculate new horizontal increment
            if (leftDist > 0) {
                scrollX = (scrollX > -minSpeed) ? -minSpeed : Math.max(scrollX * acceleration, -getMaxSpeed(leftDist));
            } else if (rightDist > 0) {
                scrollX = (scrollX < minSpeed) ? minSpeed : Math.min(scrollX * acceleration, getMaxSpeed(rightDist));
            } else {
                scrollX = 0;
            }

            // calculate new vertical increment
            if (topDist > 0) {
                scrollY = (scrollY > -minSpeed) ? -minSpeed : Math.max(scrollY * acceleration, -getMaxSpeed(topDist));
            } else if (bottomDist > 0) {
                scrollY = (scrollY < minSpeed) ? minSpeed : Math.min(scrollY * acceleration, getMaxSpeed(bottomDist));
            } else {
                scrollY = 0;
            }

            // notify listeners
            if ((Math.round(scrollX) !== 0) || (Math.round(scrollY) !== 0)) {
                triggerEvent('tracking:scroll', undefined, { pageX: lastX, pageY: lastY, scrollX: Math.round(scrollX), scrollY: Math.round(scrollY) });
            }
        }

        if (autoRepeat) {
            repeatDelayTimer = window.setTimeout(function () {
                repeatDelayTimer = null;
                autoRepeatHandler();
                repeatIntervalTimer = window.setInterval(autoRepeatHandler, repeatInterval);
            }, repeatDelay);
        }

        if (scrollHorizontal || scrollVertical) {
            scrollIntervalTimer = window.setInterval(autoScrollHandler, scrollInterval);
        }
    }

    /**
     * Deinitializes auto-scrolling mode after tracking has been finished or
     * canceled.
     */
    function deinitAutoMode() {
        window.clearTimeout(repeatDelayTimer);
        window.clearInterval(repeatIntervalTimer);
        window.clearInterval(scrollIntervalTimer);
        repeatDelayTimer = repeatIntervalTimer = scrollIntervalTimer = null;
    }

    /**
     * Initializes tracking mode after tracking has been started.
     */
    function initTracking(event, pageX, pageY) {

        // store the current tracking node
        trackingNode = $(event.delegateTarget);
        startX = lastX = pageX;
        startY = lastY = pageY;
        moved = false;

        // set the mouse pointer of the target node at the overlay node
        overlayNode.css('cursor', $(event.target).css('cursor'));

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

        // initialize auto-repetition and auto-scrolling
        initAutoMode();
    }

    /**
     * Deinitializes tracking mode after is has been finished or canceled.
     */
    function deinitTracking() {
        $(document).off(DOCUMENT_EVENT_MAP).off(DEFERRED_EVENT_MAP);
        trackingNode = null;
        overlayNode.detach();
        deinitAutoMode();
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
    function trackingStart(event, pageX, pageY) {
        cancelTracking();
        initTracking(event, pageX, pageY);
        triggerEvent('tracking:start', event, { target: event.target, pageX: pageX, pageY: pageY });
    }

    /**
     * Triggers a 'tracking:move' event at the current tracking node, if the
     * tracking position has been changed since the last call of this method.
     */
    function trackingMove(event, pageX, pageY) {
        var moveX = pageX - lastX, moveY = pageY - lastY;
        if (trackingNode && (moveX !== 0) || (moveY !== 0)) {
            // insert overlay node on first move event
            if (overlayNode.parent().length === 0) { $('body').append(overlayNode); }
            triggerEvent('tracking:move', event, { pageX: pageX, pageY: pageY, moveX: moveX, moveY: moveY, offsetX: pageX - startX, offsetY: pageY - startY });
            lastX = pageX;
            lastY = pageY;
            moved = true;
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
            trackingStart(event, event.pageX, event.pageY);
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
            trackingStart(event, changed[0].pageX, changed[0].pageY);
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
        Utils.log('tracking keydown: keyCode=' + event.keyCode);
        if (event.keyCode === KeyCodes.ESCAPE) {
            cancelTracking();
        }
    }

    // methods ================================================================

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
     * - 'tracking:repeat'
     *      While holding mouse or touch point above the border node with
     *      auto-repetition enabled (see below for the 'options' parameter of
     *      this method). The event object contains the following properties:
     *      (1) {Number} pageX, {Number} pageY
     *          The page position, as passed to the previous 'tracking:move'
     *          event (or the initial 'tracking:start' event, if no
     *          'tracking:move' event has been triggered yet).
     *      (2) {Number} startX, {Number} startY
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
     *  @param {String} [options.selector]
     *      If specified, tracking will only be initiated for descendant nodes
     *      that match this jQuery selector.
     *  @param {String} [options.sourceEvents='all']
     *      If set to 'mouse', only mouse events will be processed, and touch
     *      events will be ignored. If set to 'touch', only touch events will
     *      be processed, and mouse events will be ignored. If set to 'all' or
     *      omitted, mouse and touch events will be processed.
     *  @param {Boolean} [options.autoRepeat=false]
     *      If set to true, auto-repetition will be activated. The active
     *      tracking node will trigger 'tracking:repeat' events repeatedly as
     *      long as tracking is active.
     *  @param {Integer} [options.repeatDelay=700]
     *      The delay between the initial 'tracking:start' event and the first
     *      'tracking:repeat' event, while auto-repetition mode is active.
     *  @param {Integer} [options.repeatInterval=100]
     *      The delay between subsequent 'tracking:repeat' events, while
     *      auto-repetition mode is active.
     *  @param {Boolean|String} [options.autoScroll=false]
     *      If set to true, auto-scrolling will be activated for horizontal and
     *      vertical direction. If set to either 'horizontal' or 'vertical',
     *      auto-scrolling will be enabled only for the specified direction.
     *      The active tracking node will trigger 'tracking:scroll' events
     *      repeatedly as long as the mouse or touch point hovers or leaves the
     *      borders of a certain rectangle (of either the tracking node itself,
     *      or another custom node in the DOM, see the 'borderNode' option).
     *  @param {Integer} [options.scrollInterval=100]
     *      The minimum time in milliseconds between two 'tracking:scroll'
     *      events while auto-scrolling mode is active.
     *  @param {Integer} [options.minSpeed=10]
     *      The minimum amount of pixels (absolute value) passed to listeners
     *      of the 'tracking:scroll' event while auto-scrolling mode is active.
     *  @param {Integer} [options.maxSpeed=100]
     *      The maximum amount of pixels (absolute value) passed to listeners
     *      of the 'tracking:scroll' event while auto-scrolling mode is active.
     *  @param {jQuery|HTMLElement|String} [options.borderNode]
     *      If specified, the node whose border box will be used to decide
     *      whether to enable auto-repetition and auto-scrolling mode. In
     *      auto-repetition mode, the tracking point must hover the border node
     *      in order to trigger 'tracking:repeat' events. In auto-scrolling
     *      mode, if the mouse or touch point reaches or leaves the border box
     *      of this node, 'tracking:scroll' events will be triggered. If
     *      omitted, the border box of the active tracking node will be used
     *      instead. The size of the border box can be modified with the option
     *      'borderMargin'.
     *  @param {Integer} [options.borderMargin=0]
     *      The distance from the physical border box of the scroll node (see
     *      option 'borderNode') where auto-repetition or auto-scrolling mode
     *      becomes active. Positive values increase the size of the border
     *      box, negative values decrease its size.
     *  @param {Integer} [options.borderSize=30]
     *      The size of the acceleration area outside the border box (defined
     *      by the options 'borderNode' and 'borderMargin') for auto-scrolling
     *      mode. Will be used to determine the maximum scroll distance that
     *      can be reached while accelerating. If the tracking position hovers
     *      the inner edge of the acceleration area, the scroll distance will
     *      stick to the minimum scroll distance defined by the option
     *      'minSpeed'. At the outer edge, and outside the acceleration area,
     *      the scroll distance will accelerate from the minimum distance to
     *      the maximum distance defined by the option 'maxSpeed' over time.
     *      Inside the area, the maximum available scroll distance will be
     *      between the defined limits, according to the current tracking
     *      position.
     *  @param {Number} [options.acceleration=1.2]
     *      Acceleration factor while increasing the (absolute value of the)
     *      scrolling distance between two 'tracking:scroll' events from the
     *      minimum to the maximum value (see options 'minSpeed' and
     *      'maxSpeed').
     *
     * @returns {jQuery}
     *  A reference to this collection.
     */
    $.fn.enableTracking = function (options) {

        var // jQuery selector to filter for descendant nodes
            selector = Utils.getStringOption(options, 'selector'),
            // which source events are supported
            sourceEvents = Utils.getStringOption(options, 'sourceEvents', 'all');

        // prevent multiple registration of the event handlers
        this.off(MOUSE_START_EVENT_MAP).off(TOUCH_START_EVENT_MAP);

        // register supported events
        if ((sourceEvents === 'mouse') || (sourceEvents === 'all')) {
            this.on(MOUSE_START_EVENT_MAP, selector);
        }
        if ((sourceEvents === 'touch') || (sourceEvents === 'all')) {
            this.on(TOUCH_START_EVENT_MAP, selector);
        }
        return this.data('tracking-options', options);
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
        return this.off(MOUSE_START_EVENT_MAP).off(TOUCH_START_EVENT_MAP);
    };

    /**
     * Cancels tracking the current tracking node. The tracking node will
     * trigger a 'tracking:cancel' event.
     */
    $.cancelTracking = cancelTracking;

    // static initialization ==================================================

    // add global focus handler that cancels tracking when focus leaves the page
    (function () {

        var // the DOM node currently focused
            focusNode = null,
            // the last received 'focusout' event
            lastEvent = null;

        function focusInHandler(event) {
            if ($.contains(document.body, event.target)) {
                focusNode = event.target;
            }
        }

        function focusOutHandler(event) {
            // always process last 'focusout' event only, defer execution, to
            // process one or more 'focusin' events directly following before
            lastEvent = event;
            _.defer(function () {
                if (lastEvent && (focusNode === lastEvent.target)) {
                    focusNode = null;
                    cancelTracking();
                }
                focusNode = lastEvent = null;
            });
        }

        $(document).on({ focusin: focusInHandler, focusout: focusOutHandler });
    }());

});
