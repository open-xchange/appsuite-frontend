define('io.ox/core/main/apps', [
    'io.ox/core/api/apps',
    'io.ox/core/capabilities',
    'io.ox/core/desktop',
    'io.ox/core/main/icons',
    'gettext!io.ox/core'
], function (apps, capabilities, ui, icons, gt) {
    'use strict';

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
        name: 'io.ox/mail/datail',
        requires: 'webmail',
        refreshable: true
    });

    ui.createApp({
        id: 'io.ox/calendar',
        name: 'io.ox/calendar',
        title: gt.pgettext('app', 'Calendar'),
        searchable: true,
        requires: 'calendar',
        refreshable: true,
        icon: icons['io.ox/calendar']
    });
    ui.createApp({
        name: 'io.ox/calendar/detail',
        requires: 'calendar',
        refreshable: true
    });
    ui.createApp({
        name: 'io.ox/calendar/edit',
        requires: 'calendar',
        refreshable: true
    });

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
        name: 'io.ox/contacts/edit',
        requires: 'contacts',
        refreshable: true
    });
    ui.createApp({
        name: 'io.ox/contacts/detail',
        requires: 'contacts',
        refreshable: true
    });

    ui.createApp({
        id: 'io.ox/portal',
        name: 'io.ox/portal',
        title: gt.pgettext('app', 'Portal'),
        requires: 'portal',
        refreshable: true,
        settings: true,
        icon: icons['io.ox/portal']
    });

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
        name: 'io.ox/tasks/edit',
        requires: 'tasks',
        refreshable: true
    });
    ui.createApp({
        name: 'io.ox/tasks/detail',
        requires: 'tasks',
        refreshable: true
    });

    ui.createApp({
        id: 'io.ox/notes',
        name: 'io.ox/notes',
        title: gt.pgettext('app', 'Notes'),
        requires: 'notes && infostore',
        device: '!smartphone',
        refreshable: true,
        searchable: true
    });

    ui.createApp({
        id: 'io.ox/settings',
        name: 'io.ox/settings',
        refreshable: true
    });
});
