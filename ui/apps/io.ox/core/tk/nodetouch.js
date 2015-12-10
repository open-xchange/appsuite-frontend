/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Sven Jacobi <sven.jacobi@open-xchange.com>
 */

define('io.ox/core/tk/nodetouch', [
], function () {

    'use strict';

    /**
     * Registers all touch event handlers at the specified nodes.
     */
    function registerTouchHandlers(nodes, _options) {

        var defaults =
            {
                // determines the distance that decides between tap and swipe event
                threshold: 3,

                // determines the maximum finger down time in milliseconds to detect a tap event
                tapTime: 250,

                // determines the maximum time in milliseconds between taps to detect a multi tap
                tapInterval: 300,

                // determines the maximum number of taps that are recognized
                maxTapCount: 2,

                // determines the horizontal distance a swipe is detected
                horSwipeThreshold: 100,

                // determines if horStripe in between events are generated ('move' phase) or if only the 'end' phase is fired
                horSwipeStrict: true,

                // ...
                horSwipePreventDefault: true
            },
            options = $.extend({}, defaults, _options),

            selector = _options && _options.selector;

        options.taps = 0;

        options.horSwipeDetected = false;

        options.horSwipePossible = true;

        nodes .on('touchstart', selector, options, touchStartHandler)
              .on('touchend', selector, options, touchEndHandler)
              .on('touchmove', selector, options, touchMoveHandler)
              .on('touchcancel', selector, options, touchCancelHandler);
    }

    /**
     * Unregisters all touch handlers at the specified nodes.
     */

    function unregisterTouchHandlers(nodes) {

        nodes.off('touchstart touchend touchmove touchcancel');
    }

    function _distance(p1x, p1y, p2x, p2y) {

        var dx = 0;
        var dy = 0;

        dx = p2x - p1x;
        dx = dx * dx;

        dy = p2y - p1y;
        dy = dy * dy;

        return Math.sqrt(dx + dy);
    }

    function abortDelayedTapEvent(event) {
        if (event.data.delayedTapId) {
            clearTimeout(event.data.delayedTapId);
            event.data.delayedTapId = null;
        }
    }

    function executeDelayedTapEvent(event) {
        event.data.delayedTapId = null;
        event.data.tapHandler(event, event.data.taps);
    }

    function cancelTap(event) {
        abortDelayedTapEvent(event);
        event.data.tapTimeStart = event.data.tapTimeLast = null;
        event.data.taps = 0;
    }

    function cancelPinch(event) {
        if (event.data.pinchHandler) {
            event.data.pinchHandler('cancel');
        }
    }

    function cancelSwipe(event) {
        event.data.horSwipeDetected = false;
        event.data.horSwipePossible = false;
        if (event.data.horSwipeHandler && event.data.horSwipeStrict === false) {
            event.data.horSwipeHandler('cancel');
        }
    }

    /**
     * Triggers specified events at given touch handlers (tap, pinch and swipe)
     *
     * @param {String} phase
     *  The event phase 'cancel', 'start', 'move' or 'end'
     *
     * @param {jQuery.Event} [sourceEvent]
     *  The original event object that caused the touch event. Will be used
     *  to pass the state of current touch states (within the data member).
     *
     */
    function triggerEvent(phase, event) {

        if (phase === 'cancel') {
            cancelTap(event);
            cancelPinch(event);
            cancelSwipe(event);

        } else if (event) {

            var fingers = event.originalEvent.touches.length;

            if (event.data.tapHandler) {
                if (phase === 'start') {
                    abortDelayedTapEvent(event);
                }
                if (fingers === 0) {
                    if (phase === 'end') {
                        // check for the allowed press time
                        var tapTimeEnd = Date.now();
                        if ((tapTimeEnd - event.data.tapTimeStart <= event.data.tapTime) && (Math.abs(_distance(event.data.tapPosX1, event.data.tapPosY1, event.data.tapPosX2, event.data.tapPosY2)) <= event.data.threshold)) {
                            event.data.taps++;
                            if (event.data.taps !== 1) {
                                // check if the tap interval is valid
                                if (event.data.tapTimeStart - event.data.tapTimeLast > event.data.tapInterval) {
                                    // previous taps do not count
                                    event.data.taps = 1;
                                }
                            }
                            // the time and threshold value is valid
                            if (event.data.maxTapCount === event.data.taps) {
                                // and no further taps needs to be recognized, so we can fire the event without delay
                                event.data.tapHandler(event, event.data.taps);
                                event.data.taps = 0;

                            } else {
                                event.data.delayedTapId = setTimeout(function () { executeDelayedTapEvent(event); }, event.data.tapInterval);
                            }
                            event.data.tapTimeLast = tapTimeEnd;

                        } else {
                            cancelTap(event);
                        }
                    }

                } else if (fingers === 1) {
                    if (phase === 'start') {
                        event.data.tapTimeStart = Date.now();
                        event.data.tapPosX2 = event.data.tapPosX1 = event.originalEvent.touches[0].pageX;
                        event.data.tapPosY2 = event.data.tapPosY1 = event.originalEvent.touches[0].pageY;

                    } else if (phase === 'move') {
                        event.data.tapPosX2 = event.originalEvent.touches[0].pageX;
                        event.data.tapPosY2 = event.originalEvent.touches[0].pageY;
                    }
                }
            }

            if (event.data.horSwipeHandler) {
                if (fingers === 0) {
                    if (phase === 'end') {
                        if (event.data.horSwipeDetected && event.data.horSwipePossible) {
                            event.data.horSwipeHandler(phase, event, event.data.lastHorDistance);
                            if (event.data.horSwipePreventDefault) {
                                event.preventDefault();
                            }
                        }
                    } else {
                        cancelSwipe(event);
                    }

                } else if (fingers === 1) {
                    if (phase === 'start') {
                        event.data.swipeX = event.originalEvent.touches[0].pageX;
                        event.data.swipeY = event.originalEvent.touches[0].pageY;
                        event.data.lastHorDistance = 0;
                        event.data.horSwipeDetected = false;
                        event.data.horSwipePossible = true;

                    } else if (phase === 'move') {
                        if (event.data.horSwipePossible) {
                            var horDistance = event.originalEvent.touches[0].pageX - event.data.swipeX,
                                absHorDistance = Math.abs(horDistance);
                            if (!event.data.horSwipeDetected) {
                                event.data.horSwipeDetected = absHorDistance >= event.data.horSwipeThreshold;
                            }
                            if (event.data.horSwipeDetected) {
                                if (event.data.horSwipeStrict) {
                                    // only increasing distances allowed in strict mode
                                    if ((event.data.lastHorDistance < 0 && event.data.lastHorDistance < horDistance) || (event.data.lastHorDistance > 0 && event.data.lastHorDistance > horDistance)) {
                                        event.data.horSwipePossible = event.data.horSwipeDetected = false;
                                    }

                                } else {
                                    event.data.horSwipeHandler(phase, event, horDistance);
                                    if (event.data.horSwipePreventDefault) {
                                        event.preventDefault();
                                    }
                                }
                                event.data.lastHorDistance = horDistance;
                            }
                        }
                    } else {
                        cancelSwipe(event);
                    }

                } else {
                    cancelSwipe(event);
                }
            }

            if (event.data.pinchHandler) {
                if (fingers === 2 && (phase === 'start' || phase === 'move')) {
                    event.data.pinchHandler(phase, event,
                            _distance(event.originalEvent.touches[0].pageX,
                                      event.originalEvent.touches[0].pageY,
                                      event.originalEvent.touches[1].pageX,
                                      event.originalEvent.touches[1].pageY),
                            { x: (event.originalEvent.touches[0].pageX + event.originalEvent.touches[1].pageX) / 2,
                            y: (event.originalEvent.touches[0].pageY + event.originalEvent.touches[1].pageY) / 2 }
                    );
                    event.preventDefault();

                } else if (fingers === 1 && phase === 'end') {
                    event.data.pinchHandler(phase, event);

                } else {
                    event.data.pinchHandler('cancel', event);
                }
            }
        }
    }

    function touchStartHandler(event) {
        triggerEvent('start', event);
    }
    function touchCancelHandler(event) {
        triggerEvent('cancel', event);
    }
    function touchMoveHandler(event) {
        triggerEvent('move', event);
    }
    function touchEndHandler(event) {
        triggerEvent('end', event);
    }

    // methods ================================================================

    /**
     * Enables touch events for all nodes contained in the current collection.
     *
     * tap, horizontal swipe and pinch events are supported. To be called for one ore
     * more of these events following parameters can be given within the options:
     *
     * - 'pinchHandler'
     *    to activate pinch events, the pinchHandler requires a function that
     *    is called for pinch events:
     *
     *    function pinchHandler(phase, event, distance, midPoint) {};
     *
     *    the pinchHandler is then called with following parameters:
     *    - phase: can be 'start', 'cancel', 'move' and 'end'
     *    - event: the original event data
     *    - distance: the distance between two fingers (only available in 'move' and 'start' phase)
     *    - midPoint: the center point between the actual touching fingers (only available in 'move' and 'start' phase)
     *
     * - 'tapHandler'
     *    to activate tap events, the tapHandler requires a function that
     *    is called for tap events:
     *
     *    function tapHandler(event, taps) {};
     *
     *    the tapHandler is then called with following parameters:
     *    - event: the original event data
     *    - taps: the number of taps (1 for single tap, 2 four double tap ..) the
     *            maxTapCount option specifies the maximum number of taps that are possible.
     *
     * - 'horSwipeHandler'
     *    to activate horSwipe events, the horSwipeHandler requires a function that
     *    is called for horSwipe events:
     *
     *    function horSwipeHandler(phase, event, distance) {}
     *
     *  the horSwipeHandler is then called with following parameters:
     *    - phase: only 'end' except the horSwipeStrict option is set to false then
     *             also in between phases 'move' and 'cancel' are fired
     *    - event: the original event data
     *    - distance: the distance that has been done
     *
     *
     * additional options that can be provided in the options parameter:
     *
     * - 'threshold' : it determines the distance that decides between tap and swipe event, the default is '3'
     *
     * - 'tapTime' : determines the maximum finger down time in milliseconds to detect a tap event, the default is 250ms
     *
     * - 'tapInterval' : determines the maximum time in milliseconds between taps to detect a multi tap, the default is 300ms
     *
     * - 'maxTapCount' : determines the maximum number of taps that are recognized, if the max number of taps is reached, the last tap
     *                   will get his tap event instantly without waiting the complete tapInterval, the default is 2
     *
     * - 'horSwipeThreshold' : it determines the horizontal distance a swipe is detected, the default is 100px
     *
     * - 'horSwipeStrict:' : determines if horStripe in between events are generated ('move' phase) or if only the 'end' phase is fired,
     *                       the default is true, so only end phase event is fired
     *
     **/
    $.fn.enableTouch = function (options) {
        // prevent multiple registration of the event handlers
        unregisterTouchHandlers(this);
        // register supported events that initiate tracking
        registerTouchHandlers(this, options);
        // store options for later usage
        return this;
    };

    /**
     * Disables touch events for all nodes contained in the current
     * collection.
     *
     * @returns {jQuery}
     *  A reference to this collection.
     */
    $.fn.disableTouch = function () {
        unregisterTouchHandlers(this);
        return this;
    };
});
