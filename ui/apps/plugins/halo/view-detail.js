/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('plugins/halo/view-detail', [
    'plugins/halo/api',
    'io.ox/core/extensions',
    'less!plugins/halo/style'
], function (api, ext) {

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
