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
    'io.ox/core/viewer/util',
    'gettext!io.ox/core'
], function (FilesAPI, MailAPI, AttachmentAPI, DisposableView, Util,  gt) {

    'use strict';

    /**
     * The base class for filetype views.
     */
    var BaseView =  DisposableView.extend({

        // create slide root node
        // <div class="swiper-slide" tabindex="-1" role="option" aria-selected="false">
        className: 'swiper-slide',
        attributes: { tabindex: -1, role: 'option', 'aria-selected': 'false' },

        initialize: function () {
            //console.warn('BaseView.initialize()');
        },

        /**
         * Creates a slide caption element,
         * indicating current slide index and the total count of slides.
         *
         * @returns {jQuery}
         *  the caption node
         */
        createCaption: function () {
            var slideCount = this.collection.length,
                slideIndex = this.collection.indexOf(this.model),
                slideCaption = $('<div class="viewer-displayer-caption">');

            slideCaption.text(
                //#. text of a viewer slide caption
                //#. Example result: "1 of 10"
                //#. %1$d is the slide index of the current
                //#. %2$d is the total slide count
                gt('%1$d of %2$d', (slideIndex + 1), slideCount)
            );
            // set device type
            Util.setDeviceClass(slideCaption);
            return slideCaption;
        },

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
            var previewUrl = null;
            switch (this.model.get('source')) {
                case 'drive':
                    previewUrl = FilesAPI.getUrl(this.model.attributes, 'thumbnail', null);
                    break;
                case 'mail':
                    previewUrl = MailAPI.getUrl(this.get('origData'), 'view');
                    break;
                case 'pim':
                    previewUrl = AttachmentAPI.getUrl(this.get('origData'), 'view');
                    break;
                default:
                    break;
            }
            return previewUrl;
        }

    });

    // returns an object which inherits BaseType
    return BaseView;
});
