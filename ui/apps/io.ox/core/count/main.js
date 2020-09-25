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

define('io.ox/core/count/main', [
    'io.ox/core/count/api',
    'io.ox/core/count/timing',
    'io.ox/core/count/errors',
    'io.ox/core/count/eyeballtime',
    'io.ox/core/count/lifetime',
    'io.ox/core/count/nps',
    'io.ox/core/count/sendmail',
    'io.ox/core/count/appointments'
], function (api) {

    'use strict';

    if (api.disabled) return;

    // track browser and unique visit once on setup
    api.add('browser');
    api.add('device', { platform: api.platform, device: api.device });
    api.add('unique', { id: ox.context_id + '/' + ox.user_id });
});
