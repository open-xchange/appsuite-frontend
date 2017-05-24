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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/calendar/actions/change-confirmation', [
    'io.ox/calendar/api'
], function (calApi) {

    'use strict';

    return function (data, options) {
        options = options || {};
        var api = options.api || calApi;

        return api.checkConflicts(data).then(function (conflicts) {

            var def = new $.Deferred();

            if (conflicts.length === 0) return def.resolve();

            ox.load(['io.ox/calendar/conflicts/conflictList']).done(function (conflictView) {
                conflictView.dialog(conflicts)
                    .on('cancel', function () { def.reject(); })
                    .on('ignore', function () { def.resolve(); });
            });

            return def;
        });
    };

});
