/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/main/apps', [
    'io.ox/core/api/apps',
    'io.ox/core/capabilities',
    'io.ox/core/desktop',
    'io.ox/core/main/icons',
    'gettext!io.ox/core'
], function (apps, capabilities, ui, icons, gt) {
    'use strict';

    // Mail
    ui.createApp({
        id: 'io.ox/mail',
        name: 'io.ox/mail',
        title: gt.pgettext('app', 'Mail'),
        requires: 'webmail',
        refreshable: true,
        searchable: true,
        settings: true,
        icon: icons['io.ox/mail']
    });
    ui.createApp({
        name: 'io.ox/mail/detail',
        requires: 'webmail',
        refreshable: true
    });

    // Calendar
    ui.createApp({
        id: 'io.ox/calendar',
        name: 'io.ox/calendar',
        title: gt.pgettext('app', 'Calendar'),
        searchable: true,
        settings: true,
        requires: 'calendar',
        refreshable: true,
        icon: icons['io.ox/calendar']
    });
    ui.createApp({
        name: 'io.ox/calendar/detail',
        requires: 'calendar',
        refreshable: true
    });

    // Contacts
    ui.createApp({
        id: 'io.ox/contacts',
        name: 'io.ox/contacts',
        title: gt.pgettext('app', 'Address Book'),
        refreshable: true,
        requires: 'contacts',
        searchable: true,
        settings: true,
        icon: icons['io.ox/contacts']
    });
    ui.createApp({
        name: 'io.ox/contacts/detail',
        requires: 'contacts',
        refreshable: true
    });

    // Portal
    ui.createApp({
        id: 'io.ox/portal',
        name: 'io.ox/portal',
        title: gt.pgettext('app', 'Portal'),
        requires: 'portal',
        refreshable: true,
        settings: true,
        icon: icons['io.ox/portal']
    });

    // Files
    ui.createApp({
        id: 'io.ox/files',
        name: 'io.ox/files',
        title: gt.pgettext('app', 'Drive'),
        requires: 'infostore',
        refreshable: true,
        searchable: true,
        settings: capabilities.has('!guest'),
        icon: icons['io.ox/files']
    });
    ui.createApp({
        name: 'io.ox/files/detail',
        requires: 'infostore',
        refreshable: true
    });

    // Tasks
    ui.createApp({
        id: 'io.ox/tasks',
        name: 'io.ox/tasks',
        title: gt.pgettext('app', 'Tasks'),
        requires: 'tasks',
        refreshable: true,
        searchable: true,
        settings: capabilities.has('delegate_tasks'),
        icon: icons['io.ox/tasks']
    });
    ui.createApp({
        name: 'io.ox/tasks/detail',
        requires: 'tasks',
        refreshable: true
    });

    // Chat
    ui.createApp({
        id: 'io.ox/chat',
        name: 'io.ox/chat',
        title:  gt.pgettext('app', 'Chat'),
        requires: 'chat',
        device: '!smartphone',
        settings: true,
        toggle: true,
        icon: icons['io.ox/chat']
    });

    // remove debug switch, once it is out of prototype state
    if (ox.debug) {
        // Notes
        ui.createApp({
            id: 'io.ox/notes',
            name: 'io.ox/notes',
            title: gt.pgettext('app', 'Notes'),
            requires: 'notes && infostore',
            device: '!smartphone',
            refreshable: true,
            searchable: true
        });
    }

    // Editor
    ui.createApp({
        id: 'io.ox/editor',
        name: 'io.ox/editor',
        title: gt('Editor'),
        settings: false,
        requires: 'infostore',
        visible: false,
        deeplink: true
    });

    // Search
    ui.createApp({
        id: 'io.ox/search',
        name: 'io.ox/search',
        title: gt('Search'),
        requires: 'search',
        device: 'smartphone',
        settings: false,
        icon: icons['io.ox/search']
    });

    // Settings
    ui.createApp({
        id: 'io.ox/settings',
        name: 'io.ox/settings',
        title: gt('Settings'),
        refreshable: true
    });
});
