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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define.async('io.ox/realtime/rt',
    [
        'io.ox/core/extensions',
        'io.ox/core/capabilities'
    ],
function (ext, caps) {
    'use strict';
    ext.point('io.ox/realtime/transport').extend({
        id: 'polling',
        index: 100,
        enabled: function () {
            return true; // Always works
        },
        getModule: function () {
            return require(['io.ox/realtime/polling_transport']);
        }
    });

    ext.point('io.ox/realtime/transport').extend({
        id: 'noop',
        index: 0,
        enabled: function () {
            return !caps.has('rt');
        },
        getModule: function () {
            console.error('Backend does not support realtime communication.');
            return require(['io.ox/realtime/noop_transport']);
        }
    });

    var def = null;

    ext.point('io.ox/realtime/transport').each(function (transport) {
        if (!def && transport.enabled()) {
            def = transport.getModule();
        }
    });

    return def;

});
