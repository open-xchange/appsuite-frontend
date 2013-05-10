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
            mousedown: mouseDownHandler
        },

        // the map of all events to be bound to the document while tracking
        DOCUMENT_EVENT_MAP = {
            mousemove: mouseMoveHandler,
            mouseup: mouseUpHandler,
            keydown: keyHandler
        },

        // the node that is tracked currently
        trackingNode = null,

        // the initial tracking position
        startX = 0, startY = 0,

        // the last tracking position
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
     * Immediately stops tracking if it is currently active. Triggers a
     * 'tracking:cancel' event at the current tracking node.
     */
    function cancelTracking() {
        if (trackingNode) {
            $(document).off(DOCUMENT_EVENT_MAP);
            triggerEvent('tracking:cancel');
            trackingNode = null;
        }
    }

    /**
     * Starts tracking the passed source node. Triggers a 'tracking:start'
     * event at the current tracking node.
     */
    function trackingStart(sourceNode, pageX, pageY) {
        cancelTracking();
        trackingNode = $(sourceNode);
        startX = lastX = pageX;
        startY = lastY = pageY;
        $(document).on(DOCUMENT_EVENT_MAP);
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
            $(document).off(DOCUMENT_EVENT_MAP);
            trackingMove(pageX, pageY);
            triggerEvent('tracking:end', { pageX: pageX, pageY: pageY, endX: pageX, endY: pageY, offsetX: pageX - startX, offsetY: pageY - startY });
            trackingNode = false;
        }
    }

    function mouseDownHandler(event) {
        trackingStart(this, event.pageX, event.pageY);
    }

    function mouseMoveHandler(event) {
        trackingMove(event.pageX, event.pageY);
    }

    function mouseUpHandler(event) {
        trackingEnd(event.pageX, event.pageY);
    }

    function keyHandler(event) {
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
     *      (1) {Number} pageX
     *          The horizontal page offset of the click/tap, as received from
     *          the corresponding browser event.
     *      (2) {Number} pageY
     *          The vertical page offset of the click/tap, as received from the
     *          corresponding browser event.
     *      (3) {Number} startX
     *          Will be equal to the 'pageX' property.
     *      (4) {Number} startY
     *          Will be equal to the 'pageY' property.
     *
     * - 'tracking:move'
     *      While dragging the tracking node around. The event object contains
     *      the following properties:
     *      (1) {Number} pageX
     *          The horizontal page offset, as received from the corresponding
     *          browser event.
     *      (2) {Number} pageY
     *          The vertical page offset, as received from the corresponding
     *          browser event.
     *      (3) {Number} startX
     *          The horizontal start position, as passed to the initial
     *          'tracking:start' event.
     *      (4) {Number} startY
     *          The vertical start position, as passed to the initial
     *          'tracking:start' event.
     *      (5) {Number} moveX
     *          The difference between the previous and current horizontal
     *          tracking position.
     *      (6) {Number} moveY
     *          The difference between the previous and current vertical
     *          tracking position.
     *      (7) {Number} offsetX
     *          The horizontal difference between the start and current
     *          tracking position (equals pageX-startX).
     *      (8) {Number} offsetY
     *          The vertical difference between the initial and current
     *          tracking position (equals pageY-startY)..
     *
     * - 'tracking:end'
     *      After releasing the current tracking node. The event object
     *      contains the following properties:
     *      (1) {Number} pageX
     *          The horizontal page offset, as received from the corresponding
     *          browser event.
     *      (2) {Number} pageY
     *          The vertical page offset, as received from the corresponding
     *          browser event.
     *      (3) {Number} startX
     *          The horizontal start position, as passed to the initial
     *          'tracking:start' event.
     *      (4) {Number} startY
     *          The vertical start position, as passed to the initial
     *          'tracking:start' event.
     *      (5) {Number} endX
     *          Will be equal to the 'pageX' property.
     *      (6) {Number} endY
     *          Will be equal to the 'pageY' property.
     *      (7) {Number} offsetX
     *          The horizontal difference between the start and end tracking
     *          position (equals endX-startX).
     *      (8) {Number} offsetY
     *          The vertical difference between the start and end tracking
     *          position (equals endY-startY).
     *
     * - 'tracking:cancel'
     *      When tracking the current tracking node has been cancelled. This
     *      may happen by pressing the ESCAPE key, by using several touch
     *      points on a touch device, by canceling the current touch somehow
     *      depending on the device, or by calling the static method
     *      jQuery.cancelTracking() directly. The event object contains the
     *      following properties:
     *      (1) {Number} startX
     *          The horizontal start position, as passed to the initial
     *          'tracking:start' event.
     *      (2) {Number} startY
     *          The vertical start position, as passed to the initial
     *          'tracking:start' event.
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
