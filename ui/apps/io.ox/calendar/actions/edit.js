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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/calendar/actions/edit', [
    'io.ox/calendar/edit/main',
    'io.ox/calendar/util'
], function (m, util) {

    'use strict';

    return function (data) {
        // allow editing the series on last occurrence. This allows people to prolong the series by changing the rrule
        util.showRecurrenceDialog(data, { allowEditOnLastOccurence: true }).done(function (action) {
            if (action === 'cancel') return;

            if (m.reuse('edit', data, { action: action })) return;
            m.getApp().launch().done(function () {
                this.edit(data, { action: action });
            });
        });
    };
});
