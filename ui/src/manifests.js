define(function () {
    return [
        {
            namespace: ['core'],
            path: 'plugins/upsell/simple-wizard/register'
        },
        // {
        //     namespace: ['io.ox/settings/main'],
        //     path: 'io.ox/mail/vacationnotice/settings/register'
        // },
        // {
        //     namespace: ['io.ox/settings/main'],
        //     path: 'io.ox/mail/autoforward/settings/register'
        // },
        // {
        //     namespace: ['io.ox/settings/main'],
        //     path: 'io.ox/core/pubsub/settings/register'
        // },
        {
            namespace: ['io.ox/portal/widgets'],
            path: 'plugins/owm/portal'
        },
        {
            path: 'io.ox/mail/main',
            title: "Mail",
            company: "Open-Xchange",
            icon: "mail.png",
            category: "Basic",
            settings: true,
            requires: "webmail",
            index: 200
        },
        {
            path: 'io.ox/tasks/main',
            title: "Tasks",
            company: "Open-Xchange",
            icon: "tasks.png",
            category: "Productivity",
            settings: true,
            requires: "tasks",
            index: 1000
        },
        {
            path: 'io.ox/contacts/main',
            title: "Address Book",
            company: "Open-Xchange",
            icon: "addressbook.png",
            category: "Basic",
            settings: true,
            requires: "contacts",
            index: 700
        },
        {
            path: 'io.ox/calendar/main',
            title: "Calendar",
            company: "Open-Xchange",
            icon: "calendar.png",
            category: "Productivity",
            settings: true,
            requires: "calendar",
            index: 800
        },
        {
            path: 'io.ox/files/main',
            title: "Files",
            company: "Open-Xchange",
            icon: "files.png",
            category: "Productivity",
            settings: true,
            requires: "infostore",
            index: 900
        },
        {
            path: 'io.ox/portal/main',
            title: "Portal",
            company: "Open-Xchange",
            icon: "portal.png",
            category: "Productivity",
            settings: true,
            requires: "!deniedPortal",
            index: 100
        }
    ];
});
