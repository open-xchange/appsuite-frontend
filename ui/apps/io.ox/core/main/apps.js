define('io.ox/core/main/apps', [
    'io.ox/core/api/apps',
    'io.ox/core/capabilities',
    'io.ox/core/desktop',
    'io.ox/core/main/icons',
    'gettext!io.ox/core'
], function (apps, capabilities, ui, icons, gt) {
    'use strict';

    if (capabilities.has('webmail')) {
        ui.createApp({
            id: 'io.ox/mail',
            name: 'io.ox/mail',
            title: gt.pgettext('app', 'Mail'),
            refreshable: true,
            searchable: true,
            settings: true,
            svg: icons['io.ox/mail']
        });
        ui.createApp({
            name: 'io.ox/mail/datail',
            refreshable: true
        });
    }
    if (capabilities.has('calendar')) {
        ui.createApp({
            id: 'io.ox/calendar',
            name: 'io.ox/calendar',
            title: gt.pgettext('app', 'Calendar'),
            searchable: true,
            refreshable: true,
            svg: icons['io.ox/calendar']
        });
        ui.createApp({
            name: 'io.ox/calendar/detail',
            refreshable: true
        });
        ui.createApp({
            name: 'io.ox/calendar/edit',
            refreshable: true
        });
    }
    if (capabilities.has('contacts')) {
        ui.createApp({
            id: 'io.ox/contacts',
            name: 'io.ox/contacts',
            title: gt.pgettext('app', 'Address Book'),
            refreshable: true,
            searchable: true,
            settings: true,
            svg: icons['io.ox/contacts']
        });
        ui.createApp({
            name: 'io.ox/contacts/edit',
            refreshable: true
        });
        ui.createApp({
            name: 'io.ox/contacts/detail',
            refreshable: true
        });
    }
    if (capabilities.has('portal')) {
        ui.createApp({
            id: 'io.ox/portal',
            name: 'io.ox/portal',
            title: gt.pgettext('app', 'Portal'),
            refreshable: true,
            settings: true,
            svg: icons['io.ox/portal']
        });
    }
    if (capabilities.has('infostore')) {
        ui.createApp({
            id: 'io.ox/files',
            name: 'io.ox/files',
            title: gt.pgettext('app', 'Drive'),
            refreshable: true,
            searchable: true,
            settings: capabilities.has('!guest'),
            svg: icons['io.ox/files']
        });
        ui.createApp({
            name: 'io.ox/files/detail',
            refreshable: true
        });
    }
    if (capabilities.has('tasks')) {
        ui.createApp({
            id: 'io.ox/tasks',
            name: 'io.ox/tasks',
            title: gt.pgettext('app', 'Tasks'),
            refreshable: true,
            searchable: true,
            settings: capabilities.has('delegate_tasks'),
            svg: icons['io.ox/tasks']
        });
        ui.createApp({
            name: 'io.ox/tasks/edit',
            refreshable: true
        });
        ui.createApp({
            name: 'io.ox/tasks/detail',
            refreshable: true
        });
    }
    if (capabilities.has('notes && infostore') && _.device('!smartphone')) {
        ui.createApp({
            id: 'io.ox/notes',
            name: 'io.ox/notes',
            title: gt.pgettext('app', 'Notes'),
            refreshable: true,
            searchable: true
        });
    }
    ui.createApp({
        id: 'io.ox/settings',
        name: 'io.ox/settings',
        refreshable: true
    });
});
