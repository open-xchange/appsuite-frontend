/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/viewer/views/types/baseview', [
    'io.ox/files/api',
    'io.ox/mail/api',
    'io.ox/core/api/attachment',
    'io.ox/backbone/views/disposable',
    'io.ox/core/viewer/util',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/extensions',
    'gettext!io.ox/core'
], function (FilesAPI, MailAPI, AttachmentAPI, DisposableView, Util, actionsUtil, ext, gt) {

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
        // <div class="swiper-slide" role="option" aria-selected="false">
        className: 'swiper-slide scrollable focusable',
        attributes: { role: 'option', 'aria-selected': 'false' },

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
                $('<i class="fa" aria-hidden="true">').addClass(iconClass),
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
            return notificationNode;
        },

        /**
         * Gives the user a notification message with a download button to download the
         * file.
         * @param {String} notification The notification message, when empty no text is displayed at all
         * @param {String} [iconClass] A CSS class name to be applied on the file icon.
          * @param {String} [buttonDescription] The optional buttonDescription message string to override the default buttonDescription.
         */
        displayDownloadNotification: function (notification, iconClass, buttonDescription) {

            buttonDescription = buttonDescription ? buttonDescription : gt('\n Please download the file using the button below.');
            notification = notification === '' ? '' : notification + buttonDescription;

            var notificationNode = this.displayNotification(notification, iconClass);
            notificationNode.css('white-space', 'pre');
            var fileSize = Util.renderItemSize(this.model);
            fileSize = fileSize.indexOf('-') === 0 ? '' : ' (' + fileSize + ')';
            //#. %1$s is the file size "Download 2mb" for example
            var downloadButton = $('<button type="button" class="btn btn-primary btn-file">').text(gt('Download %1$s', fileSize)).attr('aria-label', gt('Downlad')).attr('id', 'downloadviewerfile');
            notificationNode.append(downloadButton);
            downloadButton.on('click', { model: this.model }, function (e) {
                var model = e.data.model,
                    data = model.isFile() ? model.toJSON() : model.get('origData');
                // Tested: No
                actionsUtil.invoke(Util.getRefByModelSource(model.get('source')), ext.Baton({ model: model, data: data }));
            });
        },

        /**
         * Gets preview URLs of file types from their respective APIs.
         *
         * @returns {String} previewURL
         */
        getPreviewUrl: function (options) {
            var prevUrl = this.model.get('url') || (this.model.get('origData') ? this.model.get('origData').url : false);
            if (prevUrl) return prevUrl;

            // turn off sharding #53731
            options = _.extend(options || {}, { noSharding: true });

            if (this.model.get('file_options')) {
                options = _.extend(options, this.model.get('file_options'));
            }

            if (this.model.isFile()) {
                var modelJSON = this.model.toJSON();
                if (options && !_.isEmpty(options.version)) {
                    modelJSON.version = options.version;
                }
                return FilesAPI.getUrl(modelJSON, 'thumbnail', options);

            } else if (this.model.isMailAttachment() || this.model.isComposeAttachment()) {
                return MailAPI.getUrl(this.model.get('origData'), 'view', options);

            } else if (this.model.isPIMAttachment()) {
                return AttachmentAPI.getUrl(this.model.get('origData'), 'view', options);

            } else if (this.model.isEncrypted()) {
                // Guard
                return (this.model.get('guardUrl')); // Will eventually be removed
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
