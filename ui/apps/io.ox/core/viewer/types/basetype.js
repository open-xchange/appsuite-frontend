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
    'gettext!io.ox/core'
], function (gt) {

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
        }

    };

    return baseType;

});
