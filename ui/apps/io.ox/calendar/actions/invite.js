/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/calendar/actions/invite', [
    'io.ox/calendar/edit/main',
    'settings!io.ox/core'
], function (m, coreSettings) {

    'use strict';

    return function (baton) {

        m.getApp().launch().done(function () {
            // include external organizer
            var data = baton.data,
                participants = data.participants.slice();
            if (!data.organizerId && _.isString(data.organizer)) {
                participants.unshift({
                    display_name: data.organizer,
                    email1: data.organizer,
                    mail: data.organizer,
                    type: 5
                });
            }
            // open create dialog with same participants
            data = {
                folder_id: coreSettings.get('folder/calendar'),
                participants: participants
            };
            this.create(data);
            this.model.toSync = data;
        });

    };

});
