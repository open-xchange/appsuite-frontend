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

define('io.ox/switchboard/jitsi', [
    'io.ox/core/capabilities',
    'io.ox/core/extensions',
    'io.ox/switchboard/standalone/api',
    'io.ox/switchboard/standalone/extensions',
    'io.ox/switchboard/views/jitsi-meeting',
    'settings!io.ox/switchboard',
    'gettext!io.ox/switchboard'
], function (capabilities, ext, api, extensions, JitsiMeetingView, settings, gt) {

    'use strict';

    if (!settings.get('jitsi/enabled')) return;
    if (!settings.get('jitsi/host')) return;

    api.addSolution('jitsi');

    ext.point('io.ox/calendar/conference-solutions').extend({
        id: 'jitsi',
        index: 300,
        value: 'jitsi',
        label: gt('Jitsi Meeting'),
        joinLabel: gt('Join Jitsi meeting'),
        render: function (view) {
            this.append(
                new JitsiMeetingView({ appointment: view.appointment }).render().$el
            );
        }
    });

    // Switchboard-specific features
    if (!capabilities.has('switchboard')) return;

    // UI extensions are not enabled on mobile
    if (!extensions) return;

    ext.point('io.ox/contacts/detail/actions/call').extend({
        id: 'jitsi',
        index: 200,
        draw: function (baton) {
            if (!api.online) return;
            if (!api.isGAB(baton)) return;
            this.append(extensions.createConferenceItem('jitsi', gt('Call via Jitsi'), baton));
        }
    });

});
