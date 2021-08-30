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

define('io.ox/backbone/mini-views/copy-to-clipboard', [
    'io.ox/backbone/mini-views/abstract',
    'gettext!io.ox/core'
], function (Abstract, gt) {

    'use strict';

    return Abstract.extend({

        tagName: 'button',

        className: 'btn btn-default',

        events: {
            'click': 'onClick'
        },

        setup: function () {
            if (!this.options.targetId && !this.options.input && !_.has(this.options, 'content')) throw Error('Copy to clipboard needs an id, content or an input to operate correctly');
        },

        render: function () {
            var self = this, target, content;
            var label = this.options.label ? this.options.label : gt('Copy to clipboard');
            var iconClass = this.options.iconClass ? this.options.iconClass : 'fa fa-clipboard clippy';

            if (this.options.targetId) {
                target = this.options.targetId;
            } else if (_.has(this.options, 'content')) {
                content = this.options.content;
            } else {
                target = this.options.input.attr('id');
                if (!target) {
                    target = _.uniqueId('input-');
                    this.options.input.attr('id', target);
                    target = '#' + target;
                }
            }

            var icon = null;
            if (this.options.buttonStyle !== 'link') {
                icon = $('<i aria-hidden="true">');
                icon.addClass(iconClass);
            } else {
                icon = $('<span></span>').text(this.options.buttonLabel);
                this.$el.removeClass('btn-default');
                this.$el.addClass('btn-link');
            }

            this.$el.empty().append(icon).attr({
                'data-clipboard-target': target,
                'data-toggle': 'tooltip',
                'data-placement': 'bottom',
                'data-original-title': label,
                'aria-label': label,
                'data-container': 'body',
                'data-clipboard-text': content
            }).prop('disabled', true).tooltip();

            require(['static/3rd.party/clipboard.min.js']).then(function (ClipBoard) {
                new ClipBoard(self.$el.get(0));
                self.$el.prop('disabled', false);
            });

            return this;
        },

        onClick: function () {
            var originalTitle = this.$el.attr('data-original-title');
            this.$el
                .attr('data-original-title', gt('Copied')).tooltip('show')
                .attr('data-original-title', originalTitle);
        },

        dispose: function () {
            // remove tooltip if copy to clipboard is disposed
            this.$el.tooltip('destroy');
            Abstract.prototype.dispose.call(this, arguments);
        },

        /**
         * Change the attribute 'data-clipboard-text' to change the clipboard content.
         */
        changeClipboardText: function (text) {
            this.$el.attr('data-clipboard-text', text);
        }

    });

});
