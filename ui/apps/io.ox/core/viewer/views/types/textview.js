/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/viewer/views/types/textview', [
    'io.ox/core/viewer/views/types/baseview'
], function (BaseView) {

    'use strict';

    var TextView = BaseView.extend({

        render: function () {
            // quick hack to get rid of flex box
            this.$el.css('display', 'block').append(this.createCaption());
            return this;
        },

        prefetch: function () {
            //console.warn('TextView.prefetch()', this.model.get('filename'));
            // this only works for files
            // TODO preview plain text files in Mail and PIM apps
            if (this.model.get('source') !== 'drive') {
                return this;
            }
            // simply load the document content via $.ajax
            var $el = this.$el.busy();
            $.ajax({ url: this.model.getUrl('view'), dataType: 'text' }).done(function (text) {
                $el.idle().append($('<div class="plain-text-page">').text(text));
                $el = null;
            });
            return this;
        },

        show: function () {
            return this;
        },

        /**
         * Unloads the text file
         *
         * @returns {ImageView}
         *  the ImageView instance.
         */
        unload: function () {
            //console.warn('TextView.unload()', this.model.get('filename'));
            this.$el.find('.plain-text-page').remove();
        }

    });

    return TextView;
});
