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
                icon: settings.get('upsell/defaultIcon', 'fa-star'),
                enabled: true
            }, opt, settings.get('features/upsell/' + opt.id), settings.get('features/upsell/' + opt.id + '/i18n/' + ox.language));

            this.customize = this.opt.customize;
            this.icon = this.opt.icon;
            this.visible = this.opt.enabled && !upsell.has(this.opt.requires) && upsell.enabled(this.opt.requires);
        },

        render: function () {
            if (this.visible) {
                var self = this;

                this.$el.append(
                    $('<a href="#">').css('color', this.opt.color).append(
                        this.opt.title,
                        _(this.icon.split(/ /)).map(function (icon, index) {
                            return $('<i class="fa">')
                                .addClass(icon)
                                .css({
                                    'margin-left': (index === 0 && self.opt.title && self.opt.title.length > 0) ? '0.5em' : '',
                                    'color': self.opt.color
                                });
                        })
                    )
                );

                if (this.customize && _.isFunction(this.customize)) this.customize();
            } else {
                this.$el.hide();
            }

            return this;
        }

    });

    return UpsellView;
});
