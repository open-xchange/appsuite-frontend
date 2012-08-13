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
 * @author Markus Bode <markus.bode@open-xchange.com>
 */

define("io.ox/portal/pulltorefresh",
    ['gettext!io.ox/portal/pulltorefresh', 'less!io.ox/portal/pulltorefresh.css'], function (gt) {

    'use strict';

    // ScrollTop of the page must be smaller than activiationThreshold to activate "pullToRefresh"
    var activiationThreshold = 50;

    // Use this element for main scrolling
    var $scrollableObj = null;

    // Object which receives the onPullToRefresh trigger
    var $targetObj = null;

    // Object where the indicator is prepended to
    var $pulledObj = null;

    var $pullToRefresh = $('<div>').text(''),
        mouseY = -1,
        doTheRefresh = false,
        mouseButtonPressed = false;

    var eventDown = function (e) {
        if ($scrollableObj.scrollTop() < activiationThreshold) {
            mouseButtonPressed = true;
            mouseY = -1;
            doTheRefresh = false;
            $pullToRefresh.css({'height': '0px', 'padding-top': '0px'}).removeClass('pulltorefresh').text('').prependTo($pulledObj);
            $targetObj.trigger('onPullToRefreshDown');
        }
    };

    var eventUp = function (e) {
        if (mouseButtonPressed) {
            mouseButtonPressed = false;
            $pullToRefresh.detach();
            $targetObj.trigger('onPullToRefreshUp');
            $pullToRefresh.animate({'height': 0}, 100, function () {
                if (doTheRefresh && $targetObj !== null) {
                    $targetObj.trigger('onPullToRefresh');
                }
            });
        }
    };

    var touchMove = function (e) {
        if (mouseButtonPressed) {
            e.preventDefault();
            eventMove(e, e.originalEvent.touches[0].pageY);
        }
    };

    var mouseMove = function (e) {
        if (mouseButtonPressed) {
            eventMove(e, e.pageY);
        }
    };

    var eventMove = function (e, pageY) {
        if (mouseY !== -1) {
            var distance = mouseY - pageY;

            if (distance < 0 && distance > -50) {
                $pullToRefresh.css('height', (-1 * distance) + 'px');
            } else if (distance < -50) {
                mouseY = pageY - 50;
            }

            if (distance < -20 && distance >= -40) {
                $pullToRefresh.text('').addClass('pulltorefresh');
                doTheRefresh = false;
            } else if (distance < -40) {
                $pullToRefresh.css('padding-top', '20px').text(gt('Pull To Refresh')).addClass('pulltorefresh');
                doTheRefresh = true;
            } else {
                $pullToRefresh.css('padding-top', '0px').text('').removeClass('pulltorefresh');
                doTheRefresh = false;
            }
        } else {
            mouseY = pageY;
        }
    };

    var attachEvents = function ($s, $t, $p) {
        $scrollableObj = $s;
        $targetObj = $t;
        $pulledObj = $p;

        $t.on('mousedown', eventDown);
        $t.on('touchstart', eventDown);
        $t.on('mouseup', eventUp);
        $t.on('touchend', eventUp);
        $t.on('touchmove', touchMove);
        $t.on('mousemove', mouseMove);
    };

    var detachEvents = function () {
        $targetObj.off('mousedown', eventDown);
        $targetObj.off('touchstart', eventDown);
        $targetObj.off('mouseup', eventUp);
        $targetObj.off('touchend', eventUp);
        $targetObj.off('touchmove', touchMove);
        $targetObj.off('mousemove', mouseMove);
    };

    return {
        attachEvents: attachEvents,
        detachEvents: detachEvents
    };
});