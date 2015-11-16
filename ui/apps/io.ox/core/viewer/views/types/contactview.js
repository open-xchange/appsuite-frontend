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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/viewer/views/types/contactview', [
    'io.ox/core/extensions',
    'io.ox/core/viewer/views/types/baseview',
    'io.ox/contacts/view-detail'
], function (ext, BaseView, detail) {

    'use strict';

    var ContactView = BaseView.extend({

        initialize: function () {
            this.isPrefetched = false;
        },

        render: function () {
            // quick hack to get rid of flex box
            this.$el.empty().css('display', 'block');
            return this;
        },

        prefetch: function () {
            this.isPrefetched = true;
            return this;
        },

        show: function () {

            var baton = new ext.Baton({
                data: this.model.toJSON()
            });

            baton.disable('io.ox/contacts/detail', 'inline-actions');
            this.$el.append(
                $('<div class="white-page">').append(
                    detail.draw(baton)
                )
            );

            return this;
        },

        unload: function () {
            this.isPrefetched = false;
            return this;
        }
    });

    return ContactView;
});
