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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/switchboard/views/zoom-meeting', [
    'io.ox/switchboard/zoom',
    'gettext!io.ox/switchboard'
], function (zoom, gt) {

    'use strict';

    var ZoomMeetingView = zoom.View.extend({

        className: 'conference-view zoom',

        events: {
            'click [data-action="copy-to-location"]': 'copyToLocation'
        },

        initialize: function (options) {
            this.appointment = options.appointment;
            var props = this.getExtendedProps(),
                conference = props['X-OX-CONFERENCE'];
            this.model.set('joinLink', conference && conference.label === 'zoom' ? conference.value : '');
            this.listenTo(this.appointment, 'create update', this.changeMeeting);
            this.listenTo(this.appointment, 'discard', this.discardMeeting);
            window.zoomMeeting = this;
        },

        getExtendedProps: function () {
            return this.appointment.get('extendedProperties') || {};
        },

        renderDone: function () {
            // show meeting
            var link = this.getJoinLink() || 'https://...';
            this.$el.append(
                $('<i class="fa fa-video-camera conference-logo">'),
                $('<div class="ellipsis">').append(
                    $('<b>').text('Link: '),
                    $('<a target="_blank" rel="noopener">').attr('href', link).text(link)
                ),
                $('<div>').append(
                    $('<a href="#" class="secondary-action" data-action="copy-to-location">')
                        .text('Copy to location field'),
                    $('<a href="#" class="secondary-action">')
                        .text('Copy to clipboard')
                        .attr('data-clipboard-text', link)
                        .on('click', false)
                )
            );
            var el = this.$('[data-clipboard-text]').get(0);
            require(['static/3rd.party/clipboard.min.js'], function (Clipboard) {
                new Clipboard(el);
            });
        },

        copyToLocation: function (e) {
            e.preventDefault();
            this.appointment.set('location', 'Zoom Meeting: ' + this.getJoinLink());
        },

        createMeeting: function () {
            var data = this.appointment.toJSON();
            return zoom.createMeeting(translateMeetingData(data))
            .then(
                function success(result) {
                    if (ox.debug) console.debug('createMeeting', result);
                    var joinLink = result.join_url;
                    var props = this.getExtendedProps();
                    props = _.extend({}, props, { 'X-OX-CONFERENCE': { value: joinLink, label: 'zoom' } });
                    this.appointment.set('extendedProperties', props);
                    this.model.set({ joinLink: joinLink, meeting: result, state: 'done', created: true });
                }.bind(this),
                this.createMeetingFailed.bind(this)
            );
        },

        changeMeeting: function () {
            var meeting = this.model.get('meeting');
            if (!meeting) return;
            var data = this.appointment.toJSON();
            var changes = translateMeetingData(data);
            zoom.changeMeeting(meeting.id, changes);
        },

        discardMeeting: function () {
            if (!this.model.get('created')) return;
            var meeting = this.model.get('meeting');
            zoom.deleteMeeting(meeting.id);
        }
    });

    function translateMeetingData(data) {
        var isRecurring = !!data.rrule;
        var timezone = getTimezone(data.startDate);
        // we always set time (to be safe)
        var start = data.startDate.value;
        if (start.indexOf('T') === -1) start += 'T000000';
        var end = data.endDate.value;
        if (end.indexOf('T') === -1) end += 'T000000';
        return {
            agenda: data.description,
            // get duration in minutes
            duration: moment(end).diff(start, 'minutes'),
            start_time: moment(start).format('YYYY-MM-DD[T]HH:mm:ss'),
            timezone: timezone,
            topic: data.summary || gt('New meeting'),
            // type=2 (scheduled) if no recurrence pattern
            // type=3 (recurring with no fixed time) otherwise
            type: isRecurring ? 3 : 2
        };
    }

    function getTimezone(date) {
        return date.timezone || (moment.defaultZone && moment.defaultZone.name) || 'utc';
    }

    return ZoomMeetingView;
});
