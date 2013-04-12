/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/calendar/settings/defaults',
       [],

function () {

    'use strict';

    var settingsDefaults = {
        interval: 30,
        startTime: 8,
        endTime: 18,
        defaultReminder: 15,
        viewView: 'week:workweek',
        showDeclinedAppointments: true,
        markFulltimeAppointmentsAsFree: false,
        notifyNewModifiedDeleted: true,
        notifyAcceptedDeclinedAsCreator: false,
        notifyAcceptedDeclinedAsParticipant: false,
        showAllPrivateAppointments: false,
        deleteInvitationMailAfterAction: true
    };

    return settingsDefaults;
});
