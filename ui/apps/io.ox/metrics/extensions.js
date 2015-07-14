/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/metrics/extensions', [
    'io.ox/core/extensions'
], function (ext) {

    var point = ext.point('io.ox/metrics/extensions');

    debugger;
    point.extend({
        id: 'upsell',
        register: function () {
            var metrics = this;
            ox.on('upsell:upgrade', function (data) {
                metrics.trackEvent({
                    category: 'upsell',
                    action: data.type,
                    name: data.id,
                    value: data.missing
                });
            });
        }
    });

    point.extend({
        id: 'app',
        register: function () {
            debugger;
            var metrics = this;
            ox.on('app:start app:resume', function (app) {
                debugger;
                metrics.trackPage({
                    name: app.get('name'),
                    id: app.get('id'),
                    title: app.get('title')
                });
            });
        }
    });

});
