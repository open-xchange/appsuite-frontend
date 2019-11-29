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

define('io.ox/core/count/lifetime', [
    'io.ox/core/count/api',
    'io.ox/core/uuids',
    ''
], function (api, uuids) {

    'use strict';
    var uuid = uuids.randomUUID();
    function send() {
        api.add('lt', { u: uuid, t0: ox.t0 });
    }

    setInterval(send, 60000);
});
