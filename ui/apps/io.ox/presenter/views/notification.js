/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/presenter/views/notification', [
    'io.ox/core/notifications',
    'io.ox/core/extPatterns/actions',
    'io.ox/presenter/errormessages',
    'gettext!io.ox/presenter'
], function (Notifications, ActionsPattern, ErrorMessages, gt) {

    'use strict';

    /**
     * A utility class that handles generic presenter notifications.
     */

    var Notification = {

        /**
         * Creates a message node from the given message text and icon.
         *
         * @param {String} [message='']
         *  the notification String, if omitted no notification text will be added.
         *
         * @param {String} [iconClass='fa-exclamation-triangle']
         *  a CSS class name to be applied on the notification icon.
         *
         * @returns {jQuery.node}
         *  The notification node.
         */
        createMessageNode: function (message, iconClass) {

            return $('<div class="presenter-notification">').append(
                $('<i class="fa">').addClass(iconClass || 'fa-exclamation-triangle'),
                $('<p class="apology">').text(message || '')
            );
        },

        /**
         * Creates an error node from the given error object.
         * Supported origins for the error object are Realtime, Drive and document conversion.
         * An unknown error code will be translated to a general error message.
         *
         * @param {Object} error
         *  The error object to create the error node for.
         *
         * @param {Object} [options]
         *  @param {String} options.category
         *      The error category to provide more specific messages for unknown error codes.
         *      Supported are 'rt', 'drive' and 'conversion'.
         *
         * @returns {jQuery.node}
         *  The notification node.
         */
        createErrorNode: function (error, options) {

            var iconClass = 'fa-exclamation-triangle';
            var message = ErrorMessages.getErrorMessage(error, options);

            if (error && error.cause === 'passwordProtected') {
                iconClass = 'fa-lock';
            }

            return this.createMessageNode(message, iconClass);
        },

        /**
         * Shows an alert banner.
         *
         * @param {Object} yellOptions
         *  The settings for the alert banner:
         *  @param {String} [yellOptions.type='info']
         *      The type of the alert banner. Supported types are 'success',
         *      'info', 'warning', and 'error'.
         *  @param {String} [yellOptions.headline]
         *      An optional headline shown above the message text.
         *  @param {String} yellOptions.message
         *      The message text shown in the alert banner.
         *  @param {Number} [yellOptions.duration]
         *      The time to show the alert banner, in milliseconds; or -1 to
         *      show a permanent alert.
         *  @param {Object} [yellOptions.action]
         *      An arbitrary action button that will be shown below the
         *      message text, with the following properties:
         *      @param {String} yellOptions.action.label
         *          The display text for the button.
         *      @param {String} yellOptions.action.ref
         *          The action reference id.
         *      @param {Baton} [yellOptions.action.baton=null]
         *          The baton to hand over to the action.
         */
        showNotification: function (yellOptions) {
            var // the notification DOM element
                yellNode = null;

            function onNotificationAppear() {
                // add action button to the message
                var // the button label
                    label = yellOptions.action.label,
                    // the action ref the button invokes
                    ref = yellOptions.action.ref,
                    // the baton to hand over to the action
                    baton = yellOptions.action.baton || null,
                    // the message node as target for additional contents
                    messageNode = yellNode.find('.message'),
                    // the button node to add to the message
                    button = $('<a role="button" class="presenter-notification-btn" tabindex="1">').attr('title', label).text(label);

                button.on('click', function () {
                    ActionsPattern.invoke(ref, null, baton);
                    Notifications.yell.close();
                });

                messageNode.append($('<div>').append(button));
            }

            // add default options
            yellOptions = _.extend({ type: 'info' }, yellOptions);
            // create and show the notification DOM node
            yellNode = Notifications.yell(yellOptions);
            // register event handlers

            if (_.isObject(yellOptions.action)) {
                yellNode.one('notification:appear', onNotificationAppear);
            }
        },

        /**
         * Shows a notification for the participants when the presenter starts the presentation.
         *
         * @param {RTModel} rtModel
         *  The real time model.
         *
         * @param {RTConnection} rtConnection
         *  The real time connection.
         *
         * @param {Object} baton
         *  The baton for the join presentation action.
         */
        notifyPresentationStart: function (rtModel, rtConnection, baton) {
            var userId = rtConnection.getRTUuid();

            if (rtModel.isPresenter(userId) || rtModel.isJoined(userId)) { return; }

            var yellOptions = {
                //#. headline of a presentation start alert
                headline: gt('Presentation start'),
                //#. message text of of a presentation start alert
                //#. %1$d is the presenter name
                message: gt('%1$s has started the presentation.', rtModel.get('presenterName')),
                duration: -1,
                focus: true,
                action: {
                    //#. link button to join the currently running presentation
                    label: gt('Join Presentation'),
                    ref: 'io.ox/presenter/actions/join',
                    baton: baton
                }
            };

            this.showNotification(yellOptions);
        },

        /**
         * Shows a notification to all participants when the presenter ends the presentation.
         *
         * @param {RTModel} rtModel
         *  The real time model.
         *
         * @param {RTConnection} rtConnection
         *  The real time connection.
         */
        notifyPresentationEnd: function (rtModel, rtConnection) {
            var userId = rtConnection.getRTUuid();
            var presenterId;
            var presenterName;

            if (_.isEmpty(rtModel.get('presenterId'))) {
                // the presenter has already been reset, look for previous data
                presenterId = rtModel.previous('presenterId');
                presenterName = rtModel.previous('presenterName');

            } else {
                // use current presenter
                presenterId = rtModel.get('presenterId');
                presenterName = rtModel.get('presenterName');
            }

            if (userId === presenterId) { return; }

            this.showNotification({
                //#. headline of a presentation end alert
                headline: gt('Presentation end'),
                //#. message text of a presentation end alert
                //#. %1$d is the presenter name
                message: gt('%1$s has ended the presentation.', presenterName),
                duration: 6000
            });
        },

        /**
         * Shows a notification to the participant who joined the presentation.
         *
         * @param {RTModel} rtModel
         *  The real time model.
         *
         * @param {RTConnection} rtConnection
         *  The real time connection.
         */
        notifyPresentationJoin: function (rtModel, rtConnection) {
            var userId = rtConnection.getRTUuid();
            var presenterName = rtModel.get('presenterName');

            if (rtModel.isPresenter(userId) || rtModel.isJoined(userId)) { return; }

            this.showNotification({
                //#. headline of a presentation join alert
                headline: gt('Presentation join'),
                //#. message text of a presentation join alert
                //#. %1$d is the presenter name
                message: gt('Joining the presentation of %1$s.', presenterName),
                duration: 6000
            });
        },

        /**
         * Shows a notification to the participant if joining the presentation
         * fails because the maximum of allowed participants is reached.
         *
         * @param {String} presenterName
         *  The presenter name.
         */
        notifyMaxParticipantsReached: function (presenterName) {
            this.showNotification({
                type: 'error',
                //#. message text of an alert box if joining a presentation fails
                //#. %1$d is the name of the user who started the presentation
                //#, c-format
                message: gt('The limit of participants has been reached. Please contact the presenter %1$s.', presenterName),
                focus: true
            });
        },

        /**
         * Shows a notification when the file that is currently used for the presentation is deleted.
         *
         * @param {String} filename
         *  The file name.
         */
        notifyFileDelete: function (filename) {
            this.showNotification({
                type: 'error',
                //#. message text of an alert indicating that the presentation file was deleted while presenting it
                //#. %1$d is the file name
                //message: gt('%1$s has ended the presentation.', filename),
                message: gt('The presentation document %1$s was deleted.', filename),
                duration: -1
            });
        },

        /**
         * Shows a Realtime error notification.
         *
         * @param {String} errorType
         *  The error type String provided by the RT error event.
         */
        notifyRealtimeError: function (errorType) {

            var message = ErrorMessages.getRealtimeErrorMessage({ code: errorType, error: errorType });

            this.showNotification({
                type: 'error',
                message: message,
                duration: -1,
                focus: true
            });
        },

        /**
         * Shows a Realtime online notification.
         */
        notifyRealtimeOnline: function () {
            this.showNotification({
                type: 'info',
                //#. message text of a Realtime connection online info
                message: gt('The realtime connection is established.'),
                duration: 10000
            });
        },

        /**
         * Shows a Realtime offline notification.
         */
        notifyRealtimeOffline: function () {
            this.showNotification({
                type: 'warning',
                //#. message text of a Realtime connection offline alert.
                message: gt('The realtime connection is lost.'),
                duration: -1
            });
        }
    };

    return Notification;
});
