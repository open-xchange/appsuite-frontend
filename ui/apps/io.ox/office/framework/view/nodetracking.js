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
        lastX = 0, lastY = 0;

    // private global functions ===============================================

    /**
     * Triggers the specified event at the current tracking node. Always
     * inserts the properties 'startX' and 'startY' into the event object.
     *
     * @param {String} type
     *  The name of the event.
     *
     * @param {Object} [data]
     *  Additional properties to be inserted into the event object passed to
     *  all event listeners.
     */
    function triggerEvent(type, data) {
        trackingNode.trigger(_.extend({ type: type, startX: startX, startY: startY }, data));
    }

    /**
     * Initializes tracking mode after tracking has been started.
     */
    function initTracking(sourceNode) {
        trackingNode = $(sourceNode);
        $('body').append(overlayNode.css('cursor', trackingNode.css('cursor')));
        $(document).on(DOCUMENT_EVENT_MAP);
        _.defer(function () { $(document).on(DEFERRED_EVENT_MAP); });
    }

    /**
     * Deinitializes tracking mode after is has been finished or canceled.
     */
    function deinitTracking() {
        $(document).off(DOCUMENT_EVENT_MAP).off(DEFERRED_EVENT_MAP);
        trackingNode = null;
        overlayNode.remove();
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
    function trackingStart(sourceNode, pageX, pageY) {
        cancelTracking();
        initTracking(sourceNode);
        startX = lastX = pageX;
        startY = lastY = pageY;
        triggerEvent('tracking:start', { pageX: pageX, pageY: pageY });
    }

    /**
     * Triggers a 'tracking:move' event at the current tracking node, if the
     * tracking position has been changed since the last call of this method.
     */
    function trackingMove(pageX, pageY) {
        var moveX = pageX - lastX, moveY = pageY - lastY;
        if (trackingNode && (moveX !== 0) || (moveY !== 0)) {
            triggerEvent('tracking:move', { pageX: pageX, pageY: pageY, moveX: moveX, moveY: moveY, offsetX: pageX - startX, offsetY: pageY - startY });
            lastX = pageX;
            lastY = pageY;
        }
    }

    /**
     * Stops tracking the current tracking node normally. Triggers a
     * 'tracking:end' event at the current tracking node.
     */
    function trackingEnd(pageX, pageY) {
        if (trackingNode) {
            trackingMove(pageX, pageY);
            triggerEvent('tracking:end', { pageX: pageX, pageY: pageY, endX: pageX, endY: pageY, offsetX: pageX - startX, offsetY: pageY - startY });
            deinitTracking();
        }
    }

    /**
     * Event handler for 'mousedown' browser events.
     */
    function mouseDownHandler(event) {
        if (event.button === 0) {
            trackingStart(this, event.pageX, event.pageY);
            event.preventDefault();
        } else {
            cancelTracking();
        }
    }

    /**
     * Event handler for 'mousemove' browser events.
     */
    function mouseMoveHandler(event) {
        trackingMove(event.pageX, event.pageY);
    }

    /**
     * Event handler for 'mouseup' browser events.
     */
    function mouseUpHandler(event) {
        trackingEnd(event.pageX, event.pageY);
    }

    /**
     * Event handler for 'touchstart' browser events.
     */
    function touchStartHandler(event) {
        var touches = event.originalEvent.touches,
            changed = event.originalEvent.changedTouches;
        if ((touches.length === 1) && (changed.length === 1)) {
            trackingStart(this, changed[0].pageX, changed[0].pageY);
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
            trackingMove(changed[0].pageX, changed[0].pageY);
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
            trackingEnd(changed[0].pageX, changed[0].pageY);
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
     * will trigger the following events:
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
     * @returns {jQuery}
     *  A reference to this collection.
     */
    $.fn.enableTracking = function () {
        // prevent multiple registration of the event handlers
        return this.off(NODE_EVENT_MAP).on(NODE_EVENT_MAP);
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
