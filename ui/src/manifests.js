define(function () {
    return [
        {
            namespace: 'core',
            path: 'plugins/upsell/bubbles/register'
        },

        {
            namespace: ['io.ox/settings/main'],
            path: 'io.ox/mail/mailfilter/settings/register',
            requires: 'mailfilter'
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
            refreshable: true,
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
            refreshable: true,
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
            refreshable: true,
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
            refreshable: true,
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
            refreshable: true,
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
            refreshable: true,
            index: 100
        }
    ];
});
