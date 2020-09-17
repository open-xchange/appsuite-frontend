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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
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
            if (!this.options.targetId && !this.options.input && !this.options.content) throw Error('Copy to clipboard needs an id, content or an input to operate correctly');
        },

        render: function () {
            var self = this, target, content;
            var label = this.options.label ? this.options.label : gt('Copy to clipboard');
            var iconClass = this.options.iconClass ? this.options.iconClass : 'fa fa-clipboard clippy';

            if (this.options.targetId) {
                target = this.options.targetId;
            } else if (this.options.content) {
                content = this.options.content;
            } else {
                target = this.options.input.attr('id');
                if (!target) {
                    target = _.uniqueId('input-');
                    this.options.input.attr('id', target);
                    target = '#' + target;
                }
            }

            var icon = $('<i aria-hidden="true">');
            icon.addClass(iconClass);

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
        }

    });

});
