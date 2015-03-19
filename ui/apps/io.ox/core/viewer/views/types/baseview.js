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
    'io.ox/backbone/disposable',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core'
], function (DisposableView, Util,  gt) {

    /**
     * The base class for filetype views.
     */
    var BaseView =  DisposableView.extend({

        className: 'swiper-slide',
        attributes: { tabindex: -1, role: 'option', 'aria-selected': 'false' },

        initialize: function () {
            //console.warn('BaseView.initialize()');
        },

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
        }

    });

    // returns an object which inherits BaseType
    return BaseView;
});
