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
    'io.ox/calendar/api',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/calendar'
], function (calApi, dialogs, gt) {

    'use strict';

    return function (data, options) {
        options = options || {};
        var api = options.api || calApi;

        return api.checkConflicts(data).then(function (conflicts) {

            var def = new $.Deferred();

            if (conflicts.length === 0) return def.resolve();

            ox.load(['io.ox/calendar/conflicts/conflictList']).done(function (conflictView) {
                new dialogs.ModalDialog()
                    .header(conflictView.drawHeader())
                    .append(conflictView.drawList(conflicts))
                    .addDangerButton('ignore', gt('Ignore conflicts'), 'ignore')
                    .addButton('cancel', gt('Cancel'), 'cancel')
                    .show()
                    .done(function (action) {
                        if (action === 'cancel') return def.reject();
                        if (action === 'ignore') def.resolve();
                    });
            });

            return def;
        });
    };

});
