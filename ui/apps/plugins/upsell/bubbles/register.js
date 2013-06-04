/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/upsell/bubbles/register',
    ['io.ox/core/extensions',
     'io.ox/core/upsell',
     'io.ox/core/config',
     'settings!plugins/upsell/simple-wizard',
     'gettext!plugins/upsell/simple-wizard'], function (ext, upsell, config, settings, gt) {

    'use strict';

    function Bubble(options) {

        this.options = _.extend({
            container: 'body',
            content: 'Sed posuere consectetur est at lobortis. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.\n\nSed posuere consectetur est at lobortis. Aenean eu leo quam.\n\nPellentesque ornare sem lacinia quam venenatis vestibulum.',
            placement: 'top',
            title: 'Upsell',
            width: 440
        }, options || {});

        this.$el = $('<div class="popover">');

        this.render();
    }

    Bubble.prototype.place = function () {

        var o = this.options;

        this.$el.css({ left: '50%', marginLeft: -Math.round(o.width / 2) + 'px', width: o.width + 'px' });

        if (o.placement === 'top') {
            this.$el.addClass('bottom').css({ top: '5px' });
            return;
        }

        if (o.placement === 'bottom') {
            this.$el.addClass('top').css({ bottom: '15px', top: 'auto' });
            return;
        }

        console.warn('Bubble: Invalid placement "' + o.placement + '". Valid placements: top, bottom.');
    };

    function getLine(str, i, lines) {
        return [$.txt(str), (i < lines.length - 1) && $('<br>')];
    }

    Bubble.prototype.render = function () {

        var o = this.options, node,

            // split at \n to replace by <br>
            lines = String(o.content || '').split('\n');

        this.$el.append(
            $('<div class="arrow">'),
            $('<h3 class="popover-title">').text(o.title),
            $('<div class="popover-content">').append(
                _(lines).chain().map(getLine).flatten().compact().value()
            )
        );

        this.place();
        $(o.container).append(this.$el.show());

        return this;
    };

    return {
        create: function (options) {
            return new Bubble(options);
        }
    };
});
