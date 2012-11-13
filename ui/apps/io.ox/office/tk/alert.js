/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Schröder <mario.schroeder@open-xchange.com>
 */

define('io.ox/office/tk/alert',
    ['gettext!io.ox/office/main'
    ], function (gt) {

    'use strict';

    // static class Alert ==================================================

    var Alert = {};

    // private functions ---------------------------------------------------------

    /**
     * Creates an alert and inserts it at the beginning of the given dom node.
     * Removes a present alert before adding the new one.
     *
     *  @param {String} title the alert title
     *  @param {String} message the alert message
     *  @param {boolean} closeable alert can be closed
     *  @param {jQuery | Object} node the dom node to add the alert to
     *  @param {Object} [controller] the controller for event handling
     *  @return {jQuery} the created alert
     */
    function createAlert(title, message, closeable, node, controller) {

        var // the new alert
            alert = $.alert(title, message).addClass('hide in io-ox-office-alert');

        if (closeable) {
            // alert can be closed by clicking anywhere in the alert
            alert.click(function () {
                alert.slideUp();
            });
        } else {
            // remove closer
            $('a[data-dismiss="alert"]', alert[0]).remove();
        }

        // return focus to editor when clicked and controller given
        if (controller) {
            alert.click(function () {
                controller.done();
            });
        }

        // remove old alert
        $(node).find('.alert').remove();

        // insert new alert
        $(node).prepend(alert);

        return alert;
    }

    /**
     * Creates a button, places it into the alert and attaches the the given event.
     *
     * @param {String} key the event key
     * @param {String} label the button label
     * @param {Object} controller the controller that handles the event defined by key
     * @param {jQuery} alert
     */
    function createButton(key, label, controller, alert) {
        var button = $.button({
                label: label || '',
                data: { action: 'ok' },
                click: function (e) {
                    alert.slideUp();
                    controller.change(key);
                }
            });
        button.addClass('btn-mini');
        alert.append(button);
        return button;
    }

    // static functions ---------------------------------------------------------

    /**
     * Creates an error alert, inserts it at the beginning of the given dom node
     * and closes it again after given milliseconds (-1 means don't close).
     * Removes a present alert before adding the new one.
     *
     *  @param {String} title the alert title
     *  @param {String} message the alert message
     *  @param {boolean} closeable alert can be closed
     *  @param {jQuery | Object} node the dom node to add the alert to
     *  @param {Object} controller the controller for event handling
     *  @param {Number} duration the duration the alert is shown
     *  @param {Object} [buttonSpec] options for an additional button, with the following attributes:
     *          {String} buttonSpec.key the event key
     *          {String} buttonSpec.label the button label
     */
    Alert.showError = function (title, message, closeable, node, controller, duration, buttonSpec) {

        var alert = createAlert(title, message, closeable, node, controller);

        if (_.isObject(buttonSpec) && controller && buttonSpec.key) {
            createButton(buttonSpec.key, buttonSpec.label, controller, alert).addClass('btn-error');
        }

        $(node).prepend(alert);
        alert.slideDown();

        if (_.isNumber(duration) && duration >= 0) {
            _.delay(function () {
                alert.slideUp();
                if (controller) {
                    controller.done();
                }
            }, duration);
        }
    };

    /**
     * Creates a warning alert, inserts it at the beginning of the given dom node
     * and closes it again after given milliseconds (-1 means don't close).
     * Removes a present alert before adding the new one.
     *
     *  @param {String} title the alert title
     *  @param {String} message the alert message
     *  @param {boolean} closeable alert can be closed
     *  @param {jQuery | Object} node the dom node to add the alert to
     *  @param {Object} controller the controller for event handling
     *  @param {Number} duration the duration the alert is shown
     *  @param {Object} [buttonSpec] options for an additional button, with the following attributes:
     *          {String} buttonSpec.key the event key
     *          {String} buttonSpec.label the button label
     */
    Alert.showWarning = function (title, message, closeable, node, controller, duration, buttonSpec) {

        var alert = createAlert(title, message, closeable, node, controller)
            .removeClass('alert-error').addClass('alert-warning');

        if (_.isObject(buttonSpec) && controller && buttonSpec.key) {
            createButton(buttonSpec.key, buttonSpec.label, controller, alert).addClass('btn-warning');
        }

        $(node).prepend(alert);
        alert.slideDown();

        if (_.isNumber(duration) && duration >= 0) {
            _.delay(function () {
                alert.slideUp();
                if (controller) {
                    controller.done();
                }
            }, duration);
        }
    };

    /**
     * Creates a success alert, inserts it at the beginning of the given dom node
     * and closes it again after given milliseconds (-1 means don't close).
     * Removes a present alert before adding the new one.
     *
     *  @param {String} title the alert title
     *  @param {String} message the alert message
     *  @param {boolean} closeable alert can be closed
     *  @param {jQuery | Object} node the dom node to add the alert to
     *  @param {Object} controller the controller for event handling
     *  @param {Number} duration the duration the alert is shown
     *  @param {Object} [buttonSpec] options for an additional button, with the following attributes:
     *          {String} buttonSpec.key the event key
     *          {String} buttonSpec.label the button label
     */
    Alert.showSuccess = function (title, message, closeable, node, controller, duration, buttonSpec) {

        var alert = createAlert(title, message, closeable, node, controller)
            .removeClass('alert-error').addClass('alert-success');

        if (_.isObject(buttonSpec) && controller && buttonSpec.key) {
            createButton(buttonSpec.key, buttonSpec.label, controller, alert).addClass('btn-success');
        }

        $(node).prepend(alert);
        alert.slideDown();

        if (_.isNumber(duration) && duration >= 0) {
            _.delay(function () {
                alert.slideUp();
                if (controller) {
                    controller.done();
                }
            }, duration);
        }
    };

    /**
     * Returns true if the node contains an Alert
     *
     * @param {jQuery | Object} node the dom node to look for the node in.
     * @returns
     */
    Alert.isShowing = function (node) {
        return $(node).find('.io-ox-office-alert').length > 0;
    };

    // exports ================================================================

    return Alert;
});
