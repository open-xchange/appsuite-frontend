/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/viewer/views/types/descriptionview', [
    'io.ox/core/viewer/views/types/baseview',
    'io.ox/files/api'
], function (BaseView, api) {

    'use strict';

    // used for item without a file

    var DescriptionView = BaseView.extend({

        initialize: function (options) {
            _.extend(this, options);
            this.isPrefetched = true;
            this.$el.on('scroll', _.throttle(this.onScrollHandler.bind(this), 500));
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
            // make sure we have the description
            this.$el.busy();
            api.get(this.model.pick('folder_id', 'id')).done(function (data) {
                if (this.disposed) return;
                this.$el.idle().append($('<div class="white-page letter plain-text">').text(data.description));
            }.bind(this));
            return this;
        },

        unload: function () {
            this.$el.find('.white-page').remove();
            this.isPrefetched = false;
            return this;
        },

        // the "why" or "what for" would be interesting
        onScrollHandler: function () {
            this.viewerEvents.trigger('viewer:blendnavigation');
        }

    });

    return DescriptionView;
});
