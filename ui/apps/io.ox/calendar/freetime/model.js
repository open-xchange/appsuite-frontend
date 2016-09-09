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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/calendar/freetime/model', ['settings!io.ox/calendar', 'io.ox/participants/model'], function (settings, participantsModel) {

    'use strict';

    var model = Backbone.Model.extend({
        initialize: function () {
            var now = moment().startOf('week');
            this.set({
                timezone: now.tz(),
                currentWeek: now,
                compact: settings.get('schedulingCompactMode', false),
                zoom: settings.get('schedulingZoomlevel', 100),
                onlyWorkingHours: settings.get('schedulingOnlyWorkingHours', true),
                startHour: Math.max(parseInt(settings.get('startTime', 8), 10) - 1, 0),
                endHour: Math.min(parseInt(settings.get('endTime', 18), 10), 24),
                participants: new participantsModel.Participants([], { splitGroups: true }),
                showFree: settings.get('schedulingShowFree', false),
                showAbsent: settings.get('schedulingShowAbsent', true),
                showReserved: settings.get('schedulingShowReserved', true),
                showTemporary: settings.get('schedulingShowTemporary', false),
                appointments: {}
            });
        }
    });

    return model;
});
