/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
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
                // language; not locale
            }, opt, settings.get('features/upsell/' + opt.id), settings.get('features/upsell/' + opt.id + '/i18n/' + ox.language));

            // A11y: Links in foldertree need to be nested in li with role presentation
            if (/^folderview\//.test(opt.id)) {
                this.setElement('<li role="presentation">');
                this.$el.addClass(this.className);
            }

            // ensure io-ox-upsell-link class
            this.$el.addClass('io-ox-upsell-link');

            this.customize = this.opt.customize;
            this.icon = this.opt.icon;
            this.visible = this.opt.enabled && !upsell.has(this.opt.requires) && upsell.enabled(this.opt.requires);
        },

        render: function () {
            if (this.visible) {
                var self = this,
                    node = $('<a href="#">').css('color', this.opt.color).text(this.opt.title).append(
                        _(this.icon.split(/ /)).map(function (icon, index) {
                            if (icon === '') return;

                            return $('<i class="fa" aria-hidden="true">').addClass(icon)
                                .css({
                                    'margin-left': (index === 0 && self.opt.title && self.opt.title.length > 0) ? '0.5em' : '',
                                    'color': self.opt.color
                                });
                        })
                    );
                // A11y: Links in foldertree need to be role treeitem
                if (/^folderview\//.test(this.opt.id)) node.attr('role', 'treeitem');

                this.$el.append(node);

                if (this.customize && _.isFunction(this.customize)) this.customize();
            } else {
                this.$el.hide();
            }
            return this;
        }
    });

    return UpsellView;
});
