/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/types/baseview', [
    'io.ox/files/api',
    'io.ox/mail/api',
    'io.ox/core/api/attachment',
    'io.ox/backbone/disposable',
    'io.ox/core/viewer/util'
], function (FilesAPI, MailAPI, AttachmentAPI, DisposableView, Util) {

    'use strict';

    var // hash map of document zoom levels
        zoomLevelMap = {},
        // hash map of document scroll positions
        scrollPositionMap = {};

    /**
     * The base class for filetype views.
     */
    var BaseView =  DisposableView.extend({

        // create slide root node
        // <div class="swiper-slide" tabindex="-1" role="option" aria-selected="false">
        className: 'swiper-slide scrollable',
        attributes: { tabindex: -1, role: 'option', 'aria-selected': 'false' },

        /**
         * Creates a file notification node with file name, icon and the notification text.
         *
         * @param {String} [notification='']
         *  the notification String, if omitted no notification text will be added.
         *
         * @param {String} [iconClass]
         *  a CSS class name to be applied on the file icon.
         */
        createNotificationNode: function (notification, iconClass) {

            iconClass = iconClass || Util.getIconClass(this.model);

            return $('<div class="viewer-displayer-notification">').append(
                $('<i class="fa">').addClass(iconClass),
                $('<p class="apology">').text(notification || '')
            );
        },

        /**
         * Gives user a good notification message if something went awry.
         *
         * @param {String} notification
         *  a notification string to be displayed.
         * @param {String} [iconClass]
         *  a CSS class name to be applied on the file icon.
         */
        displayNotification: function (notification, iconClass) {
            var notificationNode = this.createNotificationNode(notification, iconClass);
            this.$el.idle().empty().append(notificationNode);
        },

        /**
         * Gets preview URLs of file types from their respective APIs.
         *
         * @returns {String} previewURL
         */
        getPreviewUrl: function () {
            if (this.model.isFile()) {
                return FilesAPI.getUrl(this.model.toJSON(), 'thumbnail', null);

            } else if (this.model.isMailAttachment()) {
                return MailAPI.getUrl(this.model.get('origData'), 'view');

            } else if (this.model.isPIMAttachment()) {
                return AttachmentAPI.getUrl(this.model.get('origData'), 'view');

            } else if (this.model.isEncrypted()) {
                return (this.model.get('guardUrl'));
            }
            return null;
        },

        /**
         * Wether this slide is currently visible to the user or not.
         */
        isVisible: function () {
            return this.$el.hasClass('swiper-slide-active');
        },

        /**
         * Returns a previously stored zoom level for the given Drive model file id.
         *
         * @param {String} fileId
         *  The file model id.
         *
         * @returns {Number}
         *  the zoom level.
         */
        getInitialZoomLevel: function (fileId) {
            return zoomLevelMap[fileId];
        },

        /**
         * Stores the zoom level for the given Drive model file id.
         *
         * @param {String} fileId
         *  The file model id.
         *
         * @param {Number} zoomLevel
         *  the zoom level.
         */
        setInitialZoomLevel: function (fileId, zoomLevel) {
            if (_.isNumber(zoomLevel)) {
                zoomLevelMap[fileId] = zoomLevel;
            }
        },

        /**
         * Removes the zoom level specified by the the Drive model file id.
         *
         * @param {String} fileId
         *  The file model id.
         */
        removeInitialZoomLevel: function (fileId) {
            if (fileId in zoomLevelMap) {
                delete zoomLevelMap[fileId];
            }
        },

        /**
         * Returns a previously stored scroll position for the given Drive model file id.
         *
         * @param {String} fileId
         *  The file model id.
         *
         * @returns {Number}
         *  the scroll position.
         */
        getInitialScrollPosition: function (fileId) {
            return scrollPositionMap[fileId];
        },

        /**
         * Stores the scroll position for the given Drive model file id.
         *
         * @param {String} fileId
         *  The file model id.
         *
         * @param {Number} scrollPosition
         *  the scroll position.
         */
        setInitialScrollPosition: function (fileId, scrollPosition) {
            if (_.isNumber(scrollPosition)) {
                scrollPositionMap[fileId] = scrollPosition;
            }
        },

        /**
         * Removes the scroll position specified by the the Drive model file id.
         *
         * @param {String} fileId
         *  The file model id.
         */
        removeInitialScrollPosition: function (fileId) {
            if (fileId in scrollPositionMap) {
                delete scrollPositionMap[fileId];
            }
        }

    });

    return BaseView;
});
