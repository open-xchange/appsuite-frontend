/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/calendar/print-compact', [
    'io.ox/core/print',
    'io.ox/calendar/api',
    'io.ox/calendar/util',
    'io.ox/core/api/group',
    'gettext!io.ox/calendar'
], function (print, api, util, groupAPI, gt) {

    'use strict';

    // used to get participants in groups
    function load(data) {
        var list = data.participants,
            groups = [],
            participants = [];

        // split user groups and participants, remove resources
        _(list).each(function (item) {
            if (item.type === 1 || item.type === 5) {
                participants.push(item.id);
            }
            if (item.type === 2) {
                groups.push(item.id);
            }
        });

        return groupAPI.getList(groups)
            .pipe(function (groupList) {
                var usersInGroups = _.chain(groupList).pluck('members').flatten().uniq().value(),
                    all = _.chain().union(usersInGroups, participants).uniq().value();
                // if the current user is the only participant we don't show the number
                if (all.length === 1 && all[0] === ox.user_id) {
                    all = [];
                }
                return all.length;
            });
    }

    function process(data) {
        return load(data).pipe(function (participants) {
            return {
                original: data,
                subject: data.title,
                location: $.trim(data.location),
                start: moment(data.start_time).format('l LT'),
                end: moment(data.end_time).format('l LT'),
                participants: participants
            };
        });
    }

    return {

        open: function (selection, win) {

            print.smart({

                get: function (obj) {
                    return api.get(obj);
                },

                i18n: {
                    //#. used as a label for the start time of an appointment, try to keep short because it's used in a compact printing view
                    start: gt('Start'),
                    //#. used as a label for the end time of an appointment, try to keep short because it's used in a compact printing view
                    end: gt('End'),
                    location: gt('Location'),
                    participants: gt('Participants')
                },

                title: selection.length === 1 ? selection[0].title : undefined,

                process: process,
                selection: selection,
                selector: '.appointment-compact',
                window: win
            });
        }
    };
});
