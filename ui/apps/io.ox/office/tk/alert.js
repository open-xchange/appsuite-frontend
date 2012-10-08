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

    // static functions ---------------------------------------------------------

    /**
     * Creates an error alert, inserts it at the beginning of the given dom node
     * and closes it again after given milliseconds (-1 means don't close).
     * Removes a present alert before adding the new one.
     *
     *  @param {String} title the alert title
     *  @param {String} message the alert message
     *  @param {jQuery | Object} node the dom node to add the alert to
     *  @param {Number=} duration the duration the alert is shown
     */
    Alert.showError = function (title, message, node, duration) {

        var alert = createAlert(title, message, node);

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
     *  @param {Number=} duration the duration the alert is shown
     */
    Alert.showWarning = function (title, message, node, duration) {

        var alert = createAlert(title, message, node)
            .removeClass('alert-error').addClass('alert-warning');

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
     *  @param {Number=} duration the duration the alert is shown
     */
    Alert.showSuccess = function (title, message, node, duration) {

        var alert = createAlert(title, message, node)
            .removeClass('alert-error').addClass('alert-success');

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
