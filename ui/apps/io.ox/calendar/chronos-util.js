/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 *
 */

define('io.ox/calendar/chronos-util', [

], function () {

    'use strict';
    var attendeeLookupArray = ['', 'INDIVIDUAL', 'GROUP', 'RESOURCE', 'RESOURCE', 'INDIVIDUAL'];

    var util = {
        rangeFilter: function (start, end) {
            return function (obj) {
                var tsStart = moment.tz(obj.startDate.value, obj.startDate.tzid || moment.defaultZone.name),
                    tsEnd = moment.tz(obj.endDate.value, obj.endDate.tzid || moment.defaultZone.name);
                if (tsEnd < start) return false;
                if (tsStart > end) return false;
                return true;
            };
        },
        cid: function (o) {
            if (_.isObject(o)) {
                if (o.attributes) o = o.attributes;
                var cid = o.folder + '.' + o.id;
                if (o.recurrenceId) cid += '.' + o.recurrenceId;
                return cid;
            } else if (_.isString(o)) {
                var s = o.split('.'),
                    r = { folder: s[0], id: s[1] };
                if (s.length === 3) r.recurrenceId = s[2];
                return r;
            }
        },
        ecid: function (o) {
            var cid = typeof o === 'string' ? o : util.cid(o);
            return encodeURIComponent(cid).replace(/\./g, ':');
        },
        // creates an attendee object from a user object or model and contact model or object
        // distribution lists create an array of attendees representing the menmbers of the distribution list
        // used to create default participants and used by addparticipantsview
        // options can contain attendee object fields that should be prefilled (usually partStat: 'ACCEPTED')
        createAttendee: function (user, options) {

            if (!user) return;
            // make it work for models and objects
            user = user instanceof Backbone.Model ? user.attributes : user;

            // distribution lists are split into members
            if (user.mark_as_distributionlist) {
                return _(user.distribution_list).map(this.createAttendee);
            }
            options = options || {};
            var attendee = {
                cuType: attendeeLookupArray[user.type] || 'INDIVIDUAL',
                cn: user.display_name,
                partStat: 'NEEDS-ACTION',
                comment: ''
            };

            if (attendee.cuType !== 'RESOURCE') {
                if (user.user_id && user.type !== 5) attendee.entity = user.user_id;
                attendee.email = user.field ? user[user.field] : (user.email1 || user.mail);
                attendee.uri = 'mailto:' + (user.email1 || user.mail);
            } else {
                attendee.partStat = 'ACCEPTED';
                attendee.comment = user.description;
                attendee.entity = user.id;
            }

            if (attendee.cuType === 'GROUP') {
                attendee.entity = user.id;
                // not really needed. Added just for convenience. Helps if group should be resolved
                attendee.members = user.members;
            }
            // not really needed. Added just for convenience. Helps if distibution list should be created
            if (attendee.cuType === 'INDIVIDUAL') {
                attendee.contactInformation = { folder: user.folder_id, contact_id: user.contact_id || user.id };
            }
            // override with predefined values if given
            return _.extend(attendee, options);
        },

        // all day appointments have no timezone and the start and end dates are in date format not date-time
        // checking the start date is sufficient as the end date must be of the same type, according to the spec
        isAllday: function (app) {
            if (!app) return false;
            app = app instanceof Backbone.Model ? app.attributes : app;
            if (_(app).has('allDay')) return app.allDay;

            var time = app.startDate;
            // there is either no time value or the time value is only 0s
            return this.isLocal(app) && (time.value.indexOf('T') === -1 || time.value.search(/T0*$/) !== -1);
        },

        // appointments may be in local time. This means they do not move when the timezone changes. Do not confuse this with UTC time
        isLocal: function (app) {
            if (!app) return false;
            var time = app instanceof Backbone.Model ? app.get('startDate') : app.startDate;
            return time && time.value && !time.tzid;
        }
    };

    return util;

});
