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

    /**
     * The base class for filetype views.
     */
    var BaseView =  DisposableView.extend({

        // create slide root node
        // <div class="swiper-slide" tabindex="-1" role="option" aria-selected="false">
        className: 'swiper-slide',
        attributes: { tabindex: -1, role: 'option', 'aria-selected': 'false' },

        /**
         * Creates a file notification node with file name, icon and the notification text.
         *
         * @param {String} [notification='']
         *  the notification String, if omitted no notification text will be added.
         */
        createNotificationNode: function (notification) {
            var node = $('<div class="viewer-displayer-notification">'),
                filename = this.model.get('filename') || '';

            node.append(
                $('<i class="fa">').addClass(Util.getIconClass(this.model)),
                $('<p>').text(filename),
                $('<p class="apology">').text(notification || '')
            );
            return node;
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
            }
            return null;
        },

        /**
         * Wether this slide is currently visible to the user or not.
         */
        isVisible: function () {
            return this.$el.hasClass('swiper-slide-active');
        }

    });

    return BaseView;
});
