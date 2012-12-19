/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('plugins/halo/view-detail',
    ['plugins/halo/api', 'less!plugins/halo/style.css'], function (api) {

    'use strict';

    return {

        draw: function (data) {

            var container = $('<div>').addClass('io-ox-halo');

            _(api.halo.investigate(data)).each(function (promise, providerName) {

                var node = $('<div>')
                    .css('minHeight', '100px')
                    .addClass('ray').busy().appendTo(container);

                promise.done(function (response) {
                    api.viewer.draw(node, providerName, response);
                })
                .always(function () {
                    node.idle().css('minHeight', '');
                    node = null;
                });
            });

            return container;
        }
    };
});