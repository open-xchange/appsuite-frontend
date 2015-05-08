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

define('io.ox/core/viewer/views/types/mailview', [
    'io.ox/core/viewer/views/types/baseview',
    'io.ox/mail/detail/view'
], function (BaseView, detail) {

    'use strict';

    var MailView = BaseView.extend({

        initialize: function () {
        },

        render: function () {
            // quick hack to get rid of flex box
            this.$el.empty().css('display', 'block');
            return this;
        },

        prefetch: function () {
            return this;
        },

        show: function () {

            var data = this.model.get('origData').nested_message,
                view = new detail.View({ data: data, loaded: true });

            this.$el.append(
                $('<div class="white-page">').append(
                    view.render().expand().$el
                )
            );

            return this;
        },

        unload: function () {
            return this;
        }
    });

    return MailView;
});
