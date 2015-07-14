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

define('io.ox/metrics/adapters/console', [
    'settings!io.ox/core',
    'io.ox/core/extensions'
], function (settings, ext) {

    'use strict';

    if (!settings.get('tracking/console/enabled')) return;

    var point = ext.point('io.ox/metrics/adapter');

    point.extend({
        id: 'console',
        setup: function () {
            console.log('%c' + 'setup', 'color: white; background-color: green');
        },
        trackEvent: function (baton) {
            console.log('trackEvent');
            console.log(baton.data);
        },
        trackVisit: function () {
            console.log('%c' + 'trackVisit', 'color: white; background-color: green');
        },
        trackPage: function (baton) {
            console.log('trackPage', baton.data.id || baton.data.name || baton.data.title );
        }
    });

});
