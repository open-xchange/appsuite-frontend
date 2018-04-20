define('io.ox/core/main/apps', [
    'io.ox/core/api/apps',
    'io.ox/core/capabilities',
    'io.ox/core/main/icons',
    'gettext!io.ox/core'
], function (apps, capabilities, icons, gt) {
    'use strict';

    if (capabilities.has('webmail')) {
        apps.add([
            new ox.ui.App({
                id: 'io.ox/mail',
                name: 'io.ox/mail',
                title: gt.pgettext('app', 'Mail'),
                refreshable: true,
                searchable: true,
                settings: true,
                svg: icons['io.ox/mail']
            }),
            new ox.ui.App({
                name: 'io.ox/mail/datail',
                refreshable: true
            })
        ]);
    }
    if (capabilities.has('calendar')) {
        apps.add([
            // requires: 'calendar'
            new ox.ui.App({
                id: 'io.ox/calendar',
                name: 'io.ox/calendar',
                title: gt.pgettext('app', 'Calendar'),
                searchable: true,
                refreshable: true,
                svg: icons['io.ox/calendar']
            }),
            new ox.ui.App({
                name: 'io.ox/calendar/detail',
                refreshable: true
            }),
            new ox.ui.App({
                name: 'io.ox/calendar/edit',
                refreshable: true
            })
        ]);
    }
    if (capabilities.has('contacts')) {
        apps.add([
            new ox.ui.App({
                id: 'io.ox/contacts',
                name: 'io.ox/contacts',
                title: gt.pgettext('app', 'Address Book'),
                refreshable: true,
                searchable: true,
                settings: true,
                svg: icons['io.ox/contacts']
            }),
            new ox.ui.App({
                name: 'io.ox/contacts/edit',
                refreshable: true
            }),
            new ox.ui.App({
                name: 'io.ox/contacts/detail',
                refreshable: true
            })
        ]);
    }
    if (capabilities.has('portal')) {
        apps.add([
            new ox.ui.App({
                id: 'io.ox/portal',
                name: 'io.ox/portal',
                title: gt.pgettext('app', 'Portal'),
                refreshable: true,
                settings: true,
                svg: icons['io.ox/portal']
            })
        ]);
    }
    if (capabilities.has('infostore')) {
        apps.add([
            new ox.ui.App({
                id: 'io.ox/files',
                name: 'io.ox/files',
                title: gt.pgettext('app', 'Drive'),
                refreshable: true,
                searchable: true,
                settings: capabilities.has('!guest'),
                svg: icons['io.ox/files']
            }),
            new ox.ui.App({
                name: 'io.ox/files/detail',
                refreshable: true
            })
        ]);
    }
    if (capabilities.has('tasks')) {
        apps.add([
            new ox.ui.App({
                id: 'io.ox/tasks',
                name: 'io.ox/tasks',
                title: gt.pgettext('app', 'Tasks'),
                refreshable: true,
                searchable: true,
                settings: capabilities.has('delegate_tasks'),
                svg: icons['io.ox/tasks']
            }),
            new ox.ui.App({
                name: 'io.ox/tasks/edit',
                refreshable: true
            }),
            new ox.ui.App({
                name: 'io.ox/tasks/detail',
                refreshable: true
            })
        ]);
    }
    if (capabilities.has('notes && infostore') && _.device('!smartphone')) {
        apps.add([
            new ox.ui.App({
                id: 'io.ox/notes',
                name: 'io.ox/notes',
                title: gt.pgettext('app', 'Notes'),
                refreshable: true,
                searchable: true
            })
        ]);
    }
    apps.add([
        new ox.ui.App({
            id: 'io.ox/settings',
            name: 'io.ox/settings',
            refreshable: true
        })
    ]);
});
