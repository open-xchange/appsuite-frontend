/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/switchboard/views/jitsi-meeting', [
    'io.ox/backbone/views/disposable',
    'io.ox/switchboard/api',
    'settings!io.ox/switchboard',
    'gettext!io.ox/switchboard'
], function (DisposableView, api, settings, gt) {

    'use strict';

    var MeetingView = DisposableView.extend({

        className: 'conference-view zoom',

        events: {
            'click [data-action="copy-to-location"]': 'copyToLocation'
        },

        initialize: function (options) {
            this.model = new Backbone.Model({ type: 'jitsi', state: 'done', joinURL: '' });
            this.appointment = options.appointment;
            var conference = api.getConference(this.appointment.get('conferences'));
            this.model.set('joinURL', conference && conference.type === 'jitsi' ? conference.joinURL : '');
            window.jitsiMeeting = this;
        },

        getExtendedProps: function () {
            return this.appointment.get('extendedProperties') || {};
        },

        getJoinURL: function () {
            return this.model && this.model.get('joinURL');
        },

        render: function () {
            this.createMeeting();
            this.renderDone();
            return this;
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
                $('<div>').append(
                    $('<a href="#" class="secondary-action" data-action="copy-to-location">')
                        .text(gt('Copy to location field')),
                    $('<a href="#" class="secondary-action">')
                        .text(gt('Copy to clipboard'))
                        .attr('data-clipboard-text', url)
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
            //#. %1$s contains the URL to join the meeting
            this.appointment.set('location', gt('Jitsi Meeting: %1$s', this.getJoinURL()));
        },

        createMeeting: function () {
            var meeting = api.createJitsiMeeting();
            this.appointment.set('conferences', [{
                uri: meeting.joinURL,
                feature: 'VIDEO',
                label: gt('Jitsi Meeting'),
                extendedParameters: {
                    'X-OX-TYPE': 'jitsi',
                    'X-OX-ID': meeting.id,
                    'X-OX-OWNER': api.userId
                }
            }]);
            this.model.set({ joinURL: meeting.joinURL, state: 'done' });
        }
    });

    return MeetingView;
});
