/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/views/window', ['io.ox/backbone/views/disposable'], function (DisposableView) {

    'use strict';

    var WindowView = DisposableView.extend({

        className: 'floating-window',

        constructor: function (options) {
            this.options = options || {};
            DisposableView.prototype.constructor.apply(this, arguments);
        },

        render: function () {
            var title_id = _.uniqueId('title');
            this.$el.attr({ tabindex: -1, role: 'dialog', 'aria-labelledby': title_id }).append(
                $('<div class="abs" role="document">').append(
                    this.$header = $('<div class="floating-header abs">').append(
                        $('<h1>').attr('id', title_id).text(this.options.title || '\u00A0')
                    ),
                    this.$body = $('<div class="floating-body abs">')
                )
            );
            return this;
        },

        open: function () {
            $('#io-ox-screens').append(this.render().$el);
            return this;
        },

        close: function () {
            this.$el.remove();
            return this;
        },

        setTitle: function (title) {
            this.$header.find('h1').text(title || '\u00A0');
            return this;
        }
    });

    return WindowView;

});
