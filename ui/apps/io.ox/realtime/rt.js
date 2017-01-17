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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define.async('io.ox/realtime/rt', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities'
], function (ext, caps) {

    'use strict';

    var POINT = ext.point('io.ox/realtime/transport'),
        def = null;

    POINT.extend({
        id: 'polling',
        index: 100,
        enabled: true,
        getModule: function () {
            return require(['io.ox/realtime/polling_transport']);
        }
    });

    POINT.extend({
        id: 'noop',
        // before 'last'
        index: 0,
        enabled: !caps.has('rt'),
        getModule: function () {
            console.error('Backend does not support realtime communication.');
            return require(['io.ox/realtime/noop_transport']);
        }
    });

    ext.point('io.ox/realtime/transport').each(function (transport) {
        if (def || !POINT.isEnabled(transport.id)) return;
        def = transport.getModule();
    });

    return def;
});
