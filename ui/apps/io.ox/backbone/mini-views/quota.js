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

define('io.ox/backbone/mini-views/quota', [
    'gettext!io.ox/core',
    'io.ox/core/api/quota',
    'io.ox/core/strings',
    'io.ox/backbone/mini-views/upsell',
    'io.ox/core/capabilities',
    'settings!io.ox/mail'
], function (gt, quotaAPI, strings, UpsellView, capabilities, settings) {

    'use strict';

    var QuotaView = Backbone.View.extend({

        tagName: 'div',

        initialize: function (options) {

            this.options = _.extend({
                module: 'mail',
                quotaField: 'quota',
                usageField: 'use',
                renderUnlimited: true,
                sizeFunction: function (size) {
                    return strings.fileSize(size, 'smart');
                },
                upsellLimit: -1
            }, options);

            // ensure classname
            this.$el.addClass('io-ox-quota-view');
            // react to update events
            quotaAPI.mailQuota.on('change', this.updateQuota.bind(this));
            quotaAPI.fileQuota.on('change', this.updateQuota.bind(this));
            // hide element until data has been loaded
            this.$el.hide();
        },

        close: function () {
            quotaAPI.mailQuota.off('change', this.updateQuota);
            quotaAPI.fileQuota.off('change', this.updateQuota);
        },

        getQuota: function (forceReload) {

            var o = this.options,
                module = o.module,
                quotaField = o.quotaField,
                usageField = o.usageField;

            // use forceReload to prevent using the cashed data
            // quotaAPI.get will trigger an automated redraw
            if (!forceReload && o.quota && o.usage) {
                return $.when({
                    quota: o.quota,
                    usage: o.usage
                });
            }
            if (forceReload) {
                if (o.module === 'file') quotaAPI.requestFileQuotaUpdates();
                quotaAPI.reload();
            }

            return quotaAPI.load().then(function (result) {
                return {
                    quota: result[module][quotaField],
                    usage: result[module][usageField]
                };
            });
        },

        updateQuota: function () {
            var o = this.options;
            var data = quotaAPI.getModel(o.module).toJSON();
            if (data[o.quotaField] === undefined || data[o.usageField] === undefined) return;
            o.quota = data[o.quotaField];
            o.usage = data[o.usageField];
            this.render();
        },

        renderTitle: function (opt) {
            var label;
            this.$el.append(
                $('<div class="quota-description">').append(
                    $('<div class="title">').text(this.options.title),
                    label = $('<div class="numbers">')
                )
            );

            if (opt.quota <= 0) {
                label.text(
                    // -1 means unlimited; if mail server is down (no inbox) we say unknown
                    this.options.module !== 'mail' || settings.get('folder/inbox') ? gt('unlimited') : gt('unknown')
                );
            } else {
                label.text(
                    opt.usage < opt.quota ?
                        //#. %1$s is the storagespace in use
                        //#. %2$s is the max storagespace
                        //#, c-format
                        gt('%1$s of %2$s', this.options.sizeFunction(opt.usage), this.options.sizeFunction(opt.quota)) :
                        // yes both times the max value, this handles the case where usage is actually highter than max quota.
                        // we get a proper 100% bar here while still showing how large the quota is. See Bug 29207 and OXUIB-369
                        //#. %1$s is the storagespace in use
                        //#. %2$s is the max storagespace
                        //#, c-format
                        gt('%1$s of %2$s', this.options.sizeFunction(opt.quota), this.options.sizeFunction(opt.quota))
                );
            }
        },

        renderBar: function (opt) {

            // do not render the bar with unlimited quota
            if (opt.quota <= 0) return;

            // max is 100%, of course; visual minimum is 5%
            var width = Math.max(5, Math.min(100, Math.round(opt.usage / opt.quota * 100)));

            if (!opt.quota) width = 100;
            if (!opt.usage) width = 0;

            this.$el.append(
                $('<div class="progress">').append(
                    $('<div class="progress-bar">')
                        .css('width', width + '%')
                        .addClass(width < 90 ? 'default' : 'bar-danger')
                )
            );
        },

        renderUpsell: function (opt) {

            // only draw when upsell is activated
            if (!this.options.upsell) return;

            var view = new UpsellView(this.options.upsell),
                upsellLimit = view.opt.upsellLimit || this.options.upsellLimit;

            // unlimited quota?
            if (upsellLimit <= 0) return;
            // quota already enlarged?
            if (opt.quota >= upsellLimit) return;

            this.$el.append(
                view.render().$el
            );
        },

        render: function () {

            // do not render for guests
            if (capabilities.has('guest')) return this;

            this.getQuota().done(function (result) {

                // do not render if quota fields are undefined
                if (_.isUndefined(result.quota) || _.isUndefined(result.usage)) return;
                // do not render when quota is unlimited
                if (!this.options.renderUnlimited && result.quota <= 0) return;

                this.$el.empty();
                this.renderTitle(result);
                this.renderBar(result);
                this.renderUpsell(result);
                // show element after adding data
                this.$el.show();

            }.bind(this));

            return this;
        }
    });

    return QuotaView;
});
