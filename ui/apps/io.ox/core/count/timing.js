/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/core/count/timing', [
    'io.ox/core/count/api',
    'settings!io.ox/core'
], function (api, settings) {

    'use strict';

    if (api.disabled) return;

    if (settings.get('autoStart') === 'io.ox/mail/main') {
        // mail ready and content showing
        ox.once('timing:mail:ready', function (duration) {
            api.add('t/m/ready', { d: duration });
        });
    }

    ox.on('timing:mail:load', function (duration) {
        api.add('t/m/load', { d: duration });
    });

    ox.on('timing:mail:sanitize', function (duration) {
        api.add('t/m/sanitize', { d: duration });
    });
});
