/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/mini-views/upsell', [
    'io.ox/core/upsell',
    'settings!io.ox/core'
], function (upsell, settings) {

    'use strict';

    var UpsellView = Backbone.View.extend({

        tagName: 'div',

        className: 'io-ox-upsell-link',

        events: {
            'click a': 'onClick'
        },

        onClick: function (e) {
            e.preventDefault();

            upsell.trigger({
                type: 'custom',
                id: this.opt.id,
                missing: upsell.missing(this.opt.requires)
            });
        },

        initialize: function (opt) {
            this.opt = _.extend({
                icon: settings.get('upsell/defaultIcon', 'fa-lock'),
                enabled: true
            }, opt, settings.get('features/upsell/' + opt.id), settings.get('features/upsell/' + opt.id + '/i18n/' + ox.language));

            this.customize = this.opt.customize;
            this.icon = this.opt.icon;
        },

        render: function () {
            if (this.opt.enabled && !upsell.has(this.opt.requires) && upsell.enabled(this.opt.requires)) {
                this.$el.append(
                    $('<a href="#">').text(this.opt.title)
                );
                if (this.customize && _.isFunction(this.customize)) this.customize();
            } else {
                this.$el.addClass('hidden');
            }

            return this;
        }

    });

    return UpsellView;
});
