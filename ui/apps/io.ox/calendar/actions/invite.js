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

define('io.ox/calendar/actions/invite', ['settings!io.ox/core'], function (settings) {

    'use strict';

    return function (baton) {

        // use ox.launch to have an indicator for slow connections
        ox.launch('io.ox/calendar/edit/main').done(function () {

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
                folder_id: settings.get('folder/calendar'),
                participants: participants
            };
            this.create(data);
            this.model.toSync = data;
        });
    };
});
