/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/core/count/appointments', ['io.ox/core/count/api'], function (api) {

    'use strict';

    if (api.disabled) return;

    ox.on('appointment:create', function (canEdit) {
        if (!_.isNumber(canEdit)) return;
        // send integers for booleans (0,1)
        api.add('ac', { pce: canEdit });
    });
});
