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

define('io.ox/core/viewer/views/types/descriptionview', [
    'io.ox/core/viewer/views/types/baseview'
], function (BaseView) {

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
            var description = this.model.get('description');
            this.$el.append($('<div class="white-page letter plain-text">').text(description));
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
