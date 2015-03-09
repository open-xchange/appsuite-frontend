/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/core/viewer/types/basetype',  [
    'io.ox/core/viewer/util',
    'gettext!io.ox/core'
], function (Util, gt) {

    /**
     * Base object for Viewer file types.
     * Generic methods that are valid for all file types are implemented here.
     */
    var baseType = {

        /**
         * Creates a slide caption element.
         *
         * @param index
         *  index of the slide this caption is in
         *
         * @param slidesCount
         *  total count of slides
         *
         * @returns {jQuery}
         */
        createCaption: function (index, slidesCount) {
            var caption = $('<div class="viewer-displayer-caption">');
            caption.text(index + 1 + ' ' + gt('of') + ' ' + slidesCount);
            return caption;
        },

        /**
         * Creates the root node for a Swiper slide.
         *
         * @returns {jQuery}
         */
        createSlideNode: function () {
            return $('<div class="swiper-slide" tabindex="-1" role="option" aria-selected="false">');
        },

        /**
         * Creates a file notification node with file name, icon and the notification text.
         */
        createNotificationNode: function (model, notification) {
            var node = $('<div class="viewer-displayer-notification">'),
                filename = model && model.get('filename') || '';

            node.append(
                $('<i class="fa">').addClass(Util.getIconClass(model)),
                $('<p>').text(filename),
                $('<p class="apology">').text(notification || '')
            );
            return node;
        },

        /**
         * Default implementation of unloading a slide.
         *
         * @param {jQuery} slideElement
         *  slide jQuery element to unload.
         */
        unloadSlide: function (slideElement) {
            //console.warn('BaseType.unloadSlide()', $(slideElement).data('swiper-slide-index'));
            slideElement.removeClass('cached');
        }

    };

    return baseType;

});
