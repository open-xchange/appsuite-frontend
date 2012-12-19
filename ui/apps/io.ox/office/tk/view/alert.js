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
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */

define('io.ox/office/tk/view/alert',
    ['io.ox/office/tk/utils',
     'gettext!io.ox/office/main'
    ], function (Utils, gt) {

    'use strict';

    // static private functions ===============================================

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
    function createAlert(title, message, closeable, node, controller, classes) {

        var // the new alert
            alert = $.alert(title, message).removeClass('alert-error').addClass((_.isString(classes) ? classes : 'alert-error') + ' hide in');

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
     * @param {String} classes
     *  Additional CSS classes that will be added to the button element.
     */
    function createButton(key, label, controller, alert, classes) {
        var button = $.button({
                label: label || '',
                data: { action: 'ok' },
                click: function (e) {
                    alert.slideUp();
                    controller.change(key);
                }
            });
        button.addClass((_.isString(classes) ? (classes + ' ') : '') + 'btn-mini');
        alert.append(button);
        return button;
    }

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
    function showAlert(title, message, closeable, node, controller, duration, buttonSpec, alertClasses, buttonClasses) {

        var alert = createAlert(title, message, closeable, node, controller, alertClasses);

        if (_.isObject(buttonSpec) && controller && buttonSpec.key) {
            createButton(buttonSpec.key, buttonSpec.label, controller, alert, buttonClasses);
        }

        $(node).prepend(alert);
        alert.slideDown();

        if (_.isNumber(duration) && duration >= 0) {
            _.delay(function () {
                // application may already be dead...
                if (Utils.containsNode(document, alert)) {
                    alert.slideUp();
                    if (controller) {
                        controller.done();
                    }
                }
            }, duration);
        }
    }

    // static class Alert =====================================================

    var Alert = {};

    // static public methods --------------------------------------------------

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
        showAlert(title, message, closeable, node, controller, duration, buttonSpec, 'alert-error', 'btn-error');
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
        showAlert(title, message, closeable, node, controller, duration, buttonSpec, 'alert-warning', 'btn-warning');
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
        showAlert(title, message, closeable, node, controller, duration, buttonSpec, 'alert-success', 'btn-success');
    };

    // special alerts ---------------------------------------------------------

    /**
     * Creates a write protected alert and inserts it at the beginning of the
     * given dom node.
     * Removes a present alert before adding the new one.
     *
     *  @param {jQuery | Object} node the dom node to add the alert to
     *  @param {Object} controller the controller for event handling
     *  @param {String} message to message be displayed in alert
     *  @param {Number} duration the duration the alert is shown
     */
    Alert.showWriteProtectedWarning = function (node, controller, message, duration) {

        Alert.showWarning(
            gt('Read-only mode'),
            message,
            true,
            node,
            controller,
            duration);
    };

    /**
     * Creates a read only mode alert including the 'Acquire Edit Rights' button
     * and inserts it at the beginning of the given dom node.
     * Removes a present alert before adding the new one.
     *
     *  @param {jQuery | Object} node the dom node to add the alert to
     *  @param {Object} controller the controller for event handling
     *  @param {String} [editUser] the user name who currently has edit rights
     */
    Alert.showReadOnlyWarning = function (node, controller, editUser) {

        Alert.showWarning(
                gt('Read Only Mode'),
                (editUser || gt('Another user')) + gt(' is currently editing this document.'),
                false,
                node,
                controller,
                -1,
                {label: gt('Acquire Edit Rights'), key: 'file/editrights'}
        );
    };

    /**
     * Creates a successfully acquired edit rights alert,
     * inserts it at the beginning of the given dom node and closes it again after 5 seconds.
     * Removes a present alert before adding the new one.
     *
     *  @param {jQuery | Object} node the dom node to add the alert to
     *  @param {Object} controller the controller for event handling
     */
    Alert.showEditModeSuccess = function (node, controller) {

        Alert.showSuccess(
                gt('Edit Mode'),
                gt('You have edit rights.'),
                true,
                node,
                controller,
                5000);
    };

    /**
     * Creates a close-able, generic error alert and inserts it at the beginning of the given dom node.
     * Removes a present alert before adding the new one.
     *
     *  @param {jQuery | Object} node
     *      The DOM node to add the alert to.
     *  @param {String} message
     *      The alert message.
     *  @param {String} [title='Error']
     *      The alert title
     */
    Alert.showGenericError = function (node, message, title) {
        Alert.showError(title || gt('Error'), message, true, node, undefined, -1);
    };

    /**
     * Creates a close-able ajax error alert and inserts it at the beginning of the given dom node.
     * Removes a present alert before adding the new one.
     *
     *  @param {jQuery | Object} node
     *      The DOM node to add the alert to.
     *  @param {Object} response
     *      Response object returned by the failed AJAX call.
     */
    Alert.showAjaxError = function (node, response) {
        Alert.showError(gt('AJAX Error'), response.responseText, true, node, undefined, -1);
    };

    /**
     * Creates a close-able error alert for an unhandled exception
     * and inserts it at the beginning of the given dom node.
     *
     * Removes a present alert before adding the new one.
     *
     *  @param {jQuery | Object} node
     *      The DOM node to add the alert to.
     *  @param exception
     *      The exception to be reported.
     */
    Alert.showExceptionError = function (node, exception) {
        Alert.showError(gt('Internal Error'), gt('Exception caught: ') + exception, true, node, undefined, -1);
    };

    /**
     * Returns true if the node contains an Alert
     *
     * @param {jQuery | Object} node the dom node to look for the node in.
     * @returns
     */
    Alert.isShowing = function (node) {
        return $(node).find('.alert').length > 0;
    };

    // exports ================================================================

    return Alert;

});
