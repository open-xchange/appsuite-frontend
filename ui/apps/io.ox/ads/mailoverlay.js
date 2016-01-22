/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 *
 */
define('io.ox/ads/mailoverlay', [
    'io.ox/core/extensions'
], function (ext) {
    'use strict';

    return function (options) {
        options = _.extend({
        }, options || {});

        var close, open,
            closer = $('<div class="io-ox-ad-close">').append(
                    $('<a href="#" class="close" data-action="close" role="button" tabindex="1">').append(
                        $('<i class="fa fa-times">')
                    )
                ),
            overlay = $('<div class="io-ox-ad abs">'),
            pane = overlay.append(closer);

        ext.point('io.ox/ads/mailoverlay').invoke('draw', overlay, options.baton);

        closer.find('.close')
            .on('click', function (e) {
                // route click to 'pane' since closer is above pane
                pane.trigger('click');
                // close side popup
                close(e);
                return false;
            })
            .on('keydown', function (e) {
                // enter
                if ((e.keyCode || e.which) === 13) {
                    $(this).trigger('click');
                }
            });

        close = function () {
            pane.detach();
        };

        open = function () {
            options.target.append(
                pane
            );
        };

        pane.on('close', close);

        this.show = function () {
            open.call();
            return this;
        };

    };

});
