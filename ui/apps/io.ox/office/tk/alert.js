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
     *  @param {jQuery | Object} node the dom node to add the alert to
     *  @return {jQuery} the created alert
     */
    function createAlert(title, message, node) {

        var // the new alert
            alert = $.alert(title, message).addClass('hide in io-ox-office-alert');

        // remove old alert
        $(node).find('.alert').remove();

        // insert new alert
        $(node).prepend(alert);

        return alert;
    }

    /**
     * Creates a button, places it into the alert and attaches the the given event.
     *
     * @param {jQuery} alert
     * @param {Object} buttonSpec with the following the attributes:
     *                  {Object} controller the controller that handles the event defined by key
     *                  {String} key the event key
     *                  {String} label the button label
     */
    function createButton(alert, buttonSpec) {
        var controller = buttonSpec.controller,
            button = $.button({
                label: buttonSpec.label || '',
                data: { action: 'ok' },
                click: function (e) {
                    alert.slideUp();
                    controller.change(buttonSpec.key);
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
     *  @param {jQuery | Object} node the dom node to add the alert to
     *  @param {Number} duration the duration the alert is shown
     *  @param {Object} [buttonSpec] options for an additional button
     */
    Alert.showError = function (title, message, node, duration, buttonSpec) {

        var alert = createAlert(title, message, node);

        if (_.isObject(buttonSpec) && buttonSpec.controller && buttonSpec.key) {
            createButton(alert, buttonSpec).addClass('btn-error');
        }

        $(node).prepend(alert);
        alert.slideDown();

        if (_.isNumber(duration) && duration >= 0) {
            _.delay(function () {
                alert.slideUp();
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
     *  @param {jQuery | Object} node the dom node to add the alert to
     *  @param {Number} duration the duration the alert is shown
     *  @param {Object} [buttonSpec] options for an additional button
     */
    Alert.showWarning = function (title, message, node, duration, buttonSpec) {

        var alert = createAlert(title, message, node)
            .removeClass('alert-error').addClass('alert-warning');

        if (_.isObject(buttonSpec) && buttonSpec.controller && buttonSpec.key) {
            createButton(alert, buttonSpec).addClass('btn-warning');
        }

        $(node).prepend(alert);
        alert.slideDown();

        if (_.isNumber(duration) && duration >= 0) {
            _.delay(function () {
                alert.slideUp();
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
     *  @param {jQuery | Object} node the dom node to add the alert to
     *  @param {Number} duration the duration the alert is shown
     *  @param {Object} [buttonSpec] options for an additional button
     */
    Alert.showSuccess = function (title, message, node, duration, buttonSpec) {

        var alert = createAlert(title, message, node)
            .removeClass('alert-error').addClass('alert-success');

        if (_.isObject(buttonSpec) && buttonSpec.controller && buttonSpec.key) {
            createButton(alert, buttonSpec).addClass('btn-success');
        }

        $(node).prepend(alert);
        alert.slideDown();

        if (_.isNumber(duration) && duration >= 0) {
            _.delay(function () {
                alert.slideUp();
            }, duration);
        }
    };

    // exports ================================================================

    return Alert;
});
