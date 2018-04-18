define('io.ox/core/main/apps', [
    'io.ox/core/api/apps',
    'io.ox/core/main/icons',
    'gettext!io.ox/core'
], function (apps, icons, gt) {
    'use strict';

    apps.add([
        new ox.ui.App({
            id: 'io.ox/mail',
            name: 'io.ox/mail',
            title: gt.pgettext('app', 'Mail'),
            svg: icons['io.ox/mail']
        }),
        new ox.ui.App({
            id: 'io.ox/calendar',
            name: 'io.ox/calendar',
            title: gt.pgettext('app', 'Calendar'),
            svg: icons['io.ox/calendar']
        }),
        new ox.ui.App({
            id: 'io.ox/contacts',
            name: 'io.ox/contacts',
            title: gt.pgettext('app', 'Address Book'),
            svg: icons['io.ox/contacts']
        }),
        new ox.ui.App({
            id: 'io.ox/portal',
            name: 'io.ox/portal',
            title: gt.pgettext('app', 'Portal'),
            svg: icons['io.ox/portal']
        }),
        new ox.ui.App({
            id: 'io.ox/files',
            name: 'io.ox/files',
            title: gt.pgettext('app', 'Drive'),
            svg: icons['io.ox/files']
        }),
        new ox.ui.App({
            id: 'io.ox/tasks',
            name: 'io.ox/tasks',
            title: gt.pgettext('app', 'Tasks'),
            svg: icons['io.ox/tasks']
        })
    ]);
});
