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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/metrics/adapters/console', [
    'settings!io.ox/core',
    'io.ox/core/extensions'
], function (settings, ext) {

    'use strict';

    if (!settings.get('tracking/console/enabled', false)) return;

    // localstorage event 'database'
    var point = ext.point('io.ox/metrics/adapter');

    function log(type, baton) {
        baton = baton || {};
        var id = baton.id || type,
            data = baton.data, entry,
            level = settings.get('tracking/console/verbosity', 'DEBUG').toLowerCase();
        // verbosity level
        switch (level) {
            case 'debug':
                entry = [type, id, JSON.stringify(data)];
                break;
            case 'info':
            default:
                entry = type + ': ' + id;
        }
        // output
        return _.isString(entry) ? console.log('%c' + entry, 'color: white; background-color: grey') : console.log(entry);
    }

    point.extend({
        id: 'console',
        setup: function () {
            log('setup');
        },
        trackEvent: function (baton) {
            log('trackEvent', baton);
        },
        trackVisit: function (baton) {
            log('trackVisit', baton);
        },
        trackPage: function (baton) {
            log('trackPage', baton);
        }
    });

});
