/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/switchboard/views/zoom-meeting', [
    'io.ox/switchboard/zoom',
    'io.ox/switchboard/api',
    'io.ox/core/extensions',
    'settings!io.ox/switchboard',
    'gettext!io.ox/switchboard'
], function (zoom, api, ext, settings, gt) {

    'use strict';

    var filterCountry = settings.get('zoom/dialin/filterCountry', '');

    var ZoomMeetingView = zoom.View.extend({

        className: 'conference-view zoom',

        events: {
            'click [data-action="copy-to-location"]': 'copyToLocationHandler',
            'click [data-action="copy-to-description"]': 'copyToDescriptionHandler',
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
            this.renderPoint('done');
            // auto copy
            this.autoCopyToLocation();
            this.autoCopyToDescription();
            this.onChangeRecurrence();
            var el = this.$('[data-clipboard-text]').get(0);
            require(['static/3rd.party/clipboard.min.js'], function (Clipboard) {
                new Clipboard(el);
            });
        },

        copyToLocationHandler: function (e) {
            e.preventDefault();
            this.copyToLocation();
        },

        autoCopyToLocation: function () {
            if (!settings.get('zoom/autoCopyToLocation')) return;
            if (this.appointment.get('location')) return;
            this.copyToLocation();
        },

        copyToLocation: function () {
            // just add the plain link without a text prefix. Gmail will not
            // recognize the link if there is text prefix on th link
            this.appointment.set('location', this.getJoinURL());
        },

        copyToDescriptionHandler: function (e) {
            e.preventDefault();
            this.copyToDescription();
        },

        autoCopyToDescription: function () {
            if (!settings.get('zoom/autoCopyToDescription')) return;
            if (this.appointment.get('description')) return;
            this.copyToDescription();
        },

        copyToDescription: function () {
            var meeting = this.model.get('meeting'),
                meetingId, passcode, onetap, dialinNumbers, description;
            if (!meeting || !meeting.settings) return;
            dialinNumbers = _(meeting.settings.global_dial_in_numbers).filter(function (dialin) {
                if (!filterCountry) return true;
                return filterCountry === dialin.country;
            });
            description = gt('Join Zoom meeting') + ': ' + this.getJoinURL() + '\n';
            if (meeting.password) {
                //#. %1$s contains a password
                description += gt('Meeting password: %1$s', meeting.password) + '\n';
            }
            if (dialinNumbers.length) {
                meetingId = String(meeting.id).replace(/^(\d{3})(\d{4})(\d+)$/, '$1 $2 $3');
                passcode = meeting.h323_password;
                onetap = dialinNumbers[0].number + ',,' + meeting.id + '#,,,,,,0#' + (passcode ? ',,' + passcode + '#' : '');
                description += '\n' +
                    //#. Zoom offers a special number to automatically provide the meeting ID and passcode
                    //#. German: "Schnelleinwahl mobil"
                    //#. %1$s is the country, %2$s contains the number
                    gt('One tap mobile (%1$s): %2$s', dialinNumbers[0].country_name, onetap) + '\n\n' +
                    //#. %1$s contains a numeric zoom meeting ID
                    gt('Meeting-ID: %1$s', meetingId) + '\n' +
                    //#. %1$s contains a numeric dialin passcode
                    (passcode ? gt('Dial-in passcode: %1$d', passcode) + '\n' : '') +
                    '\n' +
                    gt('Dial by your location') + '\n' +
                    dialinNumbers.map(function (dialin) {
                        return '    ' + dialin.country_name + (dialin.city ? ' (' + dialin.city + ')' : '') + ': ' + dialin.number;
                    })
                    .join('\n') + '\n';
            }
            var existingDescription = this.appointment.get('description');
            if (existingDescription) description = description + '\n' + existingDescription;
            this.appointment.set('description', description);
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
                        feature: 'VIDEO',
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
                // careful here, url can be with or without password, depending on the setting. Make sure this works correctly in both cases
                id = String(url).replace(/^.+\/j\/(\w+).*$/, '$1');
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

    var points = {
        auth: {
            icon: function () {
                this.$el.append(
                    $('<i class="fa fa-exclamation conference-logo" aria-hidden="true">')
                );
            },
            hint: function () {
                this.$el.append(
                    $('<p>').text(
                        gt('You first need to connect %1$s with Zoom. To do so, you need a Zoom Account. If you don\'t have an account yet, it is sufficient to create a free one.', ox.serverConfig.productName)
                    )
                );
            },
            button: function () {
                this.$el.append(
                    $('<p>').append(
                        $('<button type="button" class="btn btn-default" data-action="start-oauth">')
                            .text(gt('Connect with Zoom'))
                    )
                );
            }
        },
        pending: {
            default: function () {
                this.$el.append(
                    $('<div class="pending">').append(
                        $('<i class="fa fa-video-camera conference-logo" aria-hidden="true">'),
                        $.txt(gt('Connecting to Zoom ...')),
                        $('<i class="fa fa-refresh fa-spin" aria-hidden="true">')
                    )
                );
            }
        },
        done: {
            icon: function () {
                this.$el.append(
                    $('<i class="fa fa-video-camera conference-logo" aria-hidden="true">')
                );
            },
            link: function () {
                var url = this.getJoinURL() || 'https://...';
                this.$el.append(
                    $('<div class="ellipsis">').append(
                        $('<b>').text(gt('Link:')),
                        $.txt(' '),
                        $('<a target="_blank" rel="noopener">').attr('href', url).text(gt.noI18n(url))
                    )
                );
            },
            actions: function () {
                this.$el.append(
                    $('<div>').append(
                        $('<a href="#" class="secondary-action" data-action="copy-to-location">')
                        //#. Copy the meeting link into the appointment's location field
                            .text(gt('Copy link to location')),
                        $('<a href="#" class="secondary-action">')
                            .text(gt('Copy link to clipboard'))
                            .attr('data-clipboard-text', this.getJoinURL())
                            .on('click', false),
                        $('<a href="#" class="secondary-action" data-action="copy-to-description">')
                            .text(gt('Copy dial-in information to description'))
                    )
                );
            },
            warning: function () {
                this.$el.append(
                    $('<div class="alert alert-info hidden recurrence-warning">').text(
                        gt('Zoom meetings expire after 365 days. We recommend to limit the series to one year. Alternatively, you can update the series before the Zoom meeting expires.')
                    )
                );
            }
        },
        error: {
            load: function () {
                if (!this.getJoinURL()) return;
                this.model.set('error', gt('A problem occured while loading the Zoom meeting. Maybe the Zoom meeting has expired.'));
            },
            icon: function () {
                this.$el.append(
                    $('<i class="fa fa-exclamation conference-logo" aria-hidden="true">')
                );
            },
            message: function () {
                this.$el.append(
                    $('<p class="alert alert-warning message">').append(
                        $.txt(this.model.get('error') || gt('Something went wrong. Please try again.'))
                    )
                );
            },
            recreate: function () {
                if (!this.getJoinURL()) return;
                this.$el.append(
                    $('<button type="button" class="btn btn-default" data-action="recreate">')
                        .text(gt('Create new Zoom meeting'))
                );
            }
        },
        offline: {
            icon: function () {
                this.$el.append(
                    $('<i class="fa fa-exclamation conference-logo" aria-hidden="true">')
                );
            },
            default: function () {
                this.$el.append(
                    $('<p class="alert alert-warning message">').append(
                        gt('The Zoom integration service is currently unavailable. Please try again later.')
                    )
                );
            }
        }
    };

    _(points).each(function (point, id) {
        var index = 0;
        ext.point(ZoomMeetingView.prototype.POINT + '/' + id).extend(
            _(point).map(function (fn, id) {
                return { id: id, index: (index += 100), render: fn };
            })
        );
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
