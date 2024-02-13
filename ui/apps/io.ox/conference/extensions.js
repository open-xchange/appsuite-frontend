/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/conference/extensions', [
    'io.ox/core/extensions',
    'io.ox/conference/api',
    'io.ox/conference/views/conference-select',
    'io.ox/core/capabilities',
    'settings!io.ox/core',
    'gettext!io.ox/conference',
    'less!io.ox/switchboard/style'
], function (ext, api, ConferenceSelectView, capabilities, settings, gt) {

    'use strict';

    // add to contact detail view
    ext.point('io.ox/calendar/detail').extend({
        after: 'location',
        id: 'join',
        draw: function (baton) {
            // TODO: Split this for compability with pure location and real conference
            // conference field should also be printed in the view
            var match = [], conference = api.getConference(baton.data.conferences), title;
            if (conference) {
                match.push(conference.joinURL);
                title = getTitle(conference);
            } else {
                match = String(baton.data.location).match(/(https:\/\/.*?\.zoom\.us\S+)/i);
                title = gt('Join Zoom meeting');
            }
            if (!match) return;
            this.append(
                $('<div class="action-button-rounded horizontal">').append(
                    // Call
                    $('<button type="button" class="btn btn-link" data-action="join">')
                        .append(
                            $('<div class="icon-container">').append($.icon('fa-phone')),
                            $('<div>').text(title)
                        )
                        .on('click', function () {
                            window.open(match[0]);
                        })
                )
            );
            // avoid actions
            baton.disable('io.ox/calendar/detail', 'actions');

            function getTitle(conference) {
                var service = api.get(conference.type);
                if (!service) return gt('Join conference call');
                return service.joinLinkTitle;
            }
        }
    });

    // edit appointment
    ext.point('io.ox/calendar/edit/section').extend({
        id: 'conference',
        before: 'location',
        draw: function (baton) {
            var point = ext.point('io.ox/calendar/conference-solutions');
            if (point.list().length <= 1) return;
            new ConferenceSelectView({ el: this, appointment: baton.model, point: point }).render();
        }
    });

    var solutions = ext.point('io.ox/calendar/conference-solutions')
        .extend({ id: 'none', index: 100, value: 'none', label: gt('None') });

    var supportsZoom = api.supports('zoom'),
        supportsJitsi = api.supports('jitsi');

    if (supportsZoom || supportsJitsi) {

        if (supportsZoom) {
            require(['io.ox/conference/views/zoom-meeting'], function (ZoomMeetingView) {
                solutions.extend({
                    id: 'zoom',
                    index: 200,
                    value: 'zoom',
                    label: gt('Zoom Meeting'),
                    render: function (view) {
                        this.append(
                            new ZoomMeetingView({ appointment: view.appointment }).render().$el
                        );
                    }
                });
            });
        }

        if (supportsJitsi) {
            require(['io.ox/conference/views/jitsi-meeting'], function (JitsiMeetingView) {
                solutions.extend({
                    id: 'jitsi',
                    index: 300,
                    value: 'jitsi',
                    label: gt('Jitsi Meeting'),
                    render: function (view) {
                        this.append(
                            new JitsiMeetingView({ appointment: view.appointment }).render().$el
                        );
                    }
                });
            });
        }

        // move location to later position
        ext.point('io.ox/calendar/edit/section').replace({ id: 'location', index: 750 });
    }

});
