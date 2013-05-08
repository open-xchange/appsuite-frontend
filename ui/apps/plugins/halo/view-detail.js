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
    ['plugins/halo/api',
     'io.ox/core/extensions',
     'less!plugins/halo/style.less'], function (api, ext) {

    'use strict';

    return {

        redraw: function (baton) {
            api.halo.investigate(baton.contact, baton.provider).done(function (response) {
                baton.data = response;
                baton.ray.empty().triggerHandler('dispose');
                api.viewer.draw(baton);
            })
            .always(function () {
                baton = null;
            });
        },

        draw: function (data) {

            var container = $('<div>').addClass('io-ox-halo');

            _(api.halo.investigate(data)).each(function (promise, providerName) {

                var node = $('<div class="ray">')
                    .css('minHeight', '100px')
                    .attr('data-prodiver', providerName)
                    .busy()
                    .appendTo(container);

                promise.done(function (response) {
                    var baton = new ext.Baton({ contact: data, data: response, provider: providerName, ray: node });
                    api.viewer.draw(baton);
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
