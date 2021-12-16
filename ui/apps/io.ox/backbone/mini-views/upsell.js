/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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
