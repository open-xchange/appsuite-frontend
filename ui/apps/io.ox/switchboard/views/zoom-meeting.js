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
    'io.ox/switchboard/api',
    'settings!io.ox/switchboard',
    'gettext!io.ox/switchboard'
], function (zoom, api, settings, gt) {

    'use strict';

    var preferredCountry = settings.get('zoom/dialin/preferredCountry', 'DE');
    var filterCountry = settings.get('zoom/dialin/filterCountry', 'DE');

    var ZoomMeetingView = zoom.View.extend({

        className: 'conference-view zoom',

        events: {
            'click [data-action="copy-to-location"]': 'copyToLocation',
            'click [data-action="copy-to-description"]': 'copyToDescription',
            'click [data-action="recreate"]': 'recreateMeeting'
        },

        initialize: function (options) {
            this.appointment = options.appointment;
            var conference = api.getConference(this.appointment.get('conferences'));
            this.model.set('joinURL', conference && conference.type === 'zoom' ? conference.joinURL : '');
            this.listenTo(this.appointment, 'change:rrule', this.onChangeRecurrence);
            this.listenTo(this.appointment, 'create update', this.changeMeeting);
            this.listenTo(this.appointment, 'discard', this.discardMeeting);
            this.on('dispose', this.discardMeeting);
            window.zoomMeeting = this;
        },

        getExtendedProps: function () {
            return this.appointment.get('extendedProperties') || {};
        },

        renderDone: function () {
            // show meeting
            var url = this.getJoinURL() || 'https://...';
            this.$el.append(
                $('<i class="fa fa-video-camera conference-logo" aria-hidden="true">'),
                $('<div class="ellipsis">').append(
                    $('<b>').text(gt('Link:')),
                    $.txt(' '),
                    $('<a target="_blank" rel="noopener">').attr('href', url).text(gt.noI18n(url))
                ),
                this.createDialinNumbers(),
                $('<div>').append(
                    $('<a href="#" class="secondary-action" data-action="copy-to-location">')
                        .text(gt('Copy link to location')),
                    $('<a href="#" class="secondary-action">')
                        .text(gt('Copy link to clipboard'))
                        .attr('data-clipboard-text', url)
                        .on('click', false),
                    $('<a href="#" class="secondary-action" data-action="copy-to-description">')
                        .text(gt('Copy dial-in numbers to description'))
                ),
                $('<div class="alert alert-info hidden recurrence-warning">').text(
                    gt('Zoom meetings expire after 365 days. We recommend to limit the series to one year. Alternatively, you can update the series before the Zoom meeting expires.')
                )
            );
            this.onChangeRecurrence();
            var el = this.$('[data-clipboard-text]').get(0);
            require(['static/3rd.party/clipboard.min.js'], function (Clipboard) {
                new Clipboard(el);
            });
        },

        renderError: function () {
            var url = this.getJoinURL();
            if (url) {
                this.model.set('error', gt('A problem occured while loading the Zoom meeting. Maybe the Zoom meeting has expired.'));
                zoom.View.prototype.renderError.call(this);
                this.$el.append(
                    $('<button type="button" class="btn btn-default" data-action="recreate">')
                        .text(gt('Create new Zoom meeting'))
                );
            } else {
                zoom.View.prototype.renderError.call(this);
            }
        },

        createDialinNumbers: function () {
            var meeting = this.model.get('meeting');
            if (!preferredCountry || !meeting || !meeting.settings) return $();
            var dialin = _(meeting.settings.global_dial_in_numbers).find(function (dialin) {
                return dialin.country === preferredCountry;
            });
            if (!dialin) return $();
            return $('<div class="ellipsis">').append(
                $('<b>').text(gt('Dial-in number:')),
                $.txt(' '),
                $('<a target="_blank" rel="noopener">').attr('callto', dialin.number).text(gt.noI18n(dialin.number)),
                $.txt(' '),
                $('<span>').text(gt.noI18n(' (' + dialin.country + ')'))
            );
        },

        copyToLocation: function (e) {
            e.preventDefault();
            //#. %1$s contains the URL to join the meeting
            this.appointment.set('location', gt('Zoom Meeting: %1$s', this.getJoinURL()));
        },

        copyToDescription: function (e) {
            e.preventDefault();
            var meeting = this.model.get('meeting');
            if (!meeting || !meeting.settings) return;
            var dialinNumbers = _(meeting.settings.global_dial_in_numbers)
                .filter(function (dialin) {
                    if (filterCountry === undefined) return true;
                    return filterCountry === dialin.country;
                })
                .map(function (dialin) {
                    return dialin.country_name + ' (' + (dialin.city || dialin.country) + '): ' + dialin.number;
                });
            var description = this.appointment.get('description') || '';
            this.appointment.set('description', gt('Dial-in numbers') + ':\n' + dialinNumbers.join('\n') + '\n\n' + description);
        },

        isDone: function () {
            return this.getJoinURL() && this.model.get('meeting');
        },

        createMeeting: function () {
            // load or create meeting?
            if (this.getJoinURL()) return this.getMeeting();
            var data = this.appointment.toJSON();
            return zoom.createMeeting(translateMeetingData(data)).then(
                function success(result) {
                    if (ox.debug) console.debug('createMeeting', result);
                    this.appointment.set('conferences', [{
                        uri: result.join_url,
                        features: ['AUDIO', 'VIDEO'],
                        label: gt('Zoom Meeting'),
                        extendedParameters: {
                            'X-OX-TYPE': 'zoom',
                            'X-OX-ID': result.id,
                            'X-OX-OWNER': api.userId
                        }
                    }]);
                    this.model.set({ joinURL: result.join_url, meeting: result, state: 'done', created: true });
                }.bind(this),
                this.createMeetingFailed.bind(this)
            );
        },

        recreateMeeting: function () {
            this.model.set('joinURL', '');
            this.createMeeting();
        },

        getMeeting: function () {
            var url = this.getJoinURL(),
                id = String(url).replace(/^.+\/j\/(\w+).+$/, '$1');
            zoom.getMeeting(id).then(
                function success(result) {
                    if (ox.debug) console.debug('getMeeting', result);
                    this.model.set({ meeting: result, state: 'done' });
                }.bind(this),
                this.createMeetingFailed.bind(this)
            );
        },

        changeMeeting: function () {
            var meeting = this.model.get('meeting');
            if (!meeting) return;
            var data = this.appointment.toJSON();
            // This appointment is an exception of a series - do not change the zoom meeting
            if (data.seriesId && (data.seriesId !== data.id)) return;
            // This appointment changed to an exception of a series - do not change the zoom meeting
            if (data.seriesId && (data.seriesId === data.id) && !data.rrule) return;
            var changes = translateMeetingData(data);
            zoom.changeMeeting(meeting.id, changes);
            this.off('dispose', this.discardMeeting);
        },

        discardMeeting: function () {
            if (!this.model.get('created')) return;
            var meeting = this.model.get('meeting');
            zoom.deleteMeeting(meeting.id);
            this.off('dispose', this.discardMeeting);
        },

        onChangeRecurrence: function () {
            if (!this.isDone()) return;
            var rrule = this.appointment.get('rrule');
            this.$('.recurrence-warning').toggleClass('hidden', !longerThanOneYear(rrule));
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

    function longerThanOneYear(rrule) {
        if (!rrule) return false;
        // patterns to support
        // "FREQ=DAILY;COUNT=2"
        // "FREQ=WEEKLY;BYDAY=TH"
        // "FREQ=WEEKLY;BYDAY=TH;UNTIL=20200709T215959Z"
        // "FREQ=WEEKLY;BYDAY=TH;COUNT=2"
        // "FREQ=MONTHLY;BYMONTHDAY=2;COUNT=2"
        // "FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=2;COUNT=2"
        var until = (rrule.match(/until=(\w+)/i) || [])[1];
        if (until) return moment(until).diff(moment(), 'days') >= 365;
        var count = (rrule.match(/count=(\w+)/i) || [])[1];
        if (!count) return true;
        if (/freq=daily/i.test(rrule) && count >= 365) return true;
        if (/freq=weekly/i.test(rrule) && count >= 52) return true;
        if (/freq=monthly/i.test(rrule) && count >= 12) return true;
        if (/freq=yearly/i.test(rrule)) return true;
        return false;
    }

    return ZoomMeetingView;
});
