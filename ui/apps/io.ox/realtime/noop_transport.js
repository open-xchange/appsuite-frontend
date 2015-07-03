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
define('io.ox/realtime/noop_transport', ['io.ox/core/event'], function (Events) {
    'use strict';
    var dummy = {
        send: $.noop,
        sendWithoutSequence: $.noop,
        query: function () { return $.when(); },
        protocol: 'noop'
    };
    Events.extend(dummy);
    return dummy;
});
