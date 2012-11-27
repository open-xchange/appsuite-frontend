define(function () { 
    return [
    {
        "title": "Plaxo Address Book",
        "company": "Plaxo Inc.",
        "icon": "addressbook.png",
        "category": "Productivity",
        "description": "The only address book that works for you. Plaxo keeps your contact info updated & your communication devices in sync.",
        "requires": "plaxo.addressbook",
        "path": "3rd.party/addr/main"
    },
    {
        "title": "Application Manager",
        "company": "Open-Xchange",
        "icon": "apps.png",
        "category": "Basic",
        "settings": false,
        "visible": false,
        "path": "io.ox/applications/main"
    },
    {
        "namespace": "tests",
        "path": "io.ox/backbone/tests/test"
    },
    {
        "title": "Calendar",
        "company": "Open-Xchange",
        "icon": "calendar.png",
        "category": "Productivity",
        "settings": true,
        "requires": "calendar",
        "path": "io.ox/calendar/main"
    },
    {
        "title": "Address Book",
        "company": "Open-Xchange",
        "icon": "addressbook.png", 
        "category": "Basic",
        "settings": false,
        "requires": "contacts",
        "path": "io.ox/contacts/main"
    },
    {
        "namespace": "tests",
        "path": "io.ox/contacts/test",
        "requires": "contacts"
    },
    {
        "namespace": "tests",
        "requires": "contacts",
        "path": "io.ox/contacts/distrib/test"
    },
    {
        "namespace": "tests",
        "requires": "contacts",
        "path": "io.ox/contacts/edit/test"
    },
    {
        "title": "Conversations",
        "company": "Open-Xchange",
        "icon": "conversations.png",
        "category": "Productivity",
        "settings": false,
        "requires": "conversations",
        "path": "io.ox/conversations/main"
    },
    {
        "namespace": "tests",
        "path": "io.ox/core/test"
    },
    {
        "title": "Ajax Debugger",
        "company": "CompuGlobalHyperMegaNet",
        "icon": "default.png",
        "category": "Dev",
        "settings": false,
        "requires": "dev",
        "path": "io.ox/dev/ajaxDebug/main"
    },
    {
        "title": "UI Test Suite",
        "company": "CompuGlobalHyperMegaNet",
        "icon": "default.png",
        "category": "Dev",
        "settings": false,
        "path": "io.ox/dev/testing/main"
    },
    {
        "title": "Theme Maker",
        "company": "Mattes Inc.",
        "icon": "theme-maker.png",
        "category": "Dev",
        "settings": false,
        "requires": "dev",
        "path": "io.ox/dev/theme-maker/main"
    },
    {
        "title": "SimplePad",
        "company": "Open-Xchange",
        "icon": "default.png",
        "category": "Productivity",
        "settings": false,
        "requires": "infostore",
        "path": "io.ox/editor/main"
    },
    {
        "title": "Files",
        "company": "Open-Xchange",
        "icon": "files.png",
        "category": "Productivity",
        "settings": true,
        "requires": "infostore",
        "path": "io.ox/files/main"
    },
    {
        "namespace": "tests",
        "path": "io.ox/files/tests/interface/test"
    },
    {
        "namespace": "tests",
        "path": "io.ox/files/tests/unit/test"
    },
    {
        "title": "Lessons",
        "company": "Open-Xchange Inc.",
        "icon": "default.png",
        "category": "Dev",
        "settings": false,
        "requires": "dev",
        "path": "io.ox/lessons/main"
    },
    {
        "title": "Mail",
        "company": "Open-Xchange",
        "icon": "mail.png",
        "category": "Basic",
        "settings": true,
        "requires": "webmail",
        "path": "io.ox/mail/main"
    },
    {
        "path": "io.ox/mail/accounts/keychain",
        "namespace": "io.ox/keychain/api",
        "requires": [
            "webmail",
            "multiple_mail_accounts"
        ]
    },
    {
        "path": "io.ox/mail/accounts/settings",
        "namespace": "io.ox/settings/accounts/settings/pane",
        "requires": [
            "webmail",
            "multiple_mail_accounts"
        ]
    },
    {
        "title": "Compose email",
        "company": "Open-Xchange",
        "icon": "mail-write.png",
        "category": "Basic",
        "settings": false,
        "visible": false,
        "requires": "webmail",
        "path": "io.ox/mail/write/main"
    },
    {
        "namespace": "tests",
        "path": "io.ox/mail/write/test",
        "requires": "webmail"
    },
    {
        "path": "io.ox/oauth/keychain",
        "namespace": "io.ox/keychain/api"
    },
    {
        "path": "io.ox/oauth/settings",
        "namespace": "io.ox/settings/accounts/settings/pane"
    },
    {
        "title": "Documents",
        "company": "Open-Xchange Inc.",
        "icon": "documents.png",
        "category": "Dev",
        "settings": false,
        "createArguments": {
            "file": "new"
        },
        "requires": "text",
        "path": "io.ox/office/editor/main"
    },
    {
        "title": "Portal",
        "company": "Open-Xchange",
        "icon": "portal.png",
        "category": "Productivity",
        "settings": true,
        "requires": "!deniedPortal",
        "path": "io.ox/portal/main"
    },
    {
        "title": "Settings",
        "company": "Open-Xchange",
        "icon": "files.png",
        "category": "Basic",
        "settings": false,
        "path": "io.ox/settings/main"
    },
    {
        "namespace": "tests",
        "path": "io.ox/settings/test"
    },
    {
        "namespace": "tests",
        "path": "io.ox/settings/accounts/email/test"
    },
    {
        "title": "Tasks",
        "company": "Open-Xchange",
        "icon": "default.png",
        "category": "Productivity",
        "settings": true,
        "requires": "tasks",
        "path": "io.ox/tasks/main"
    },
    {
        "title": "Edit task",
        "company": "Open-Xchange",
        "icon": "default.png",
        "category": "Productivity",
        "settings": false,
        "visible": false,
        "requires": "tasks",
        "path": "io.ox/tasks/edit/main"
    },
    {
        "namespace": "core",
        "path": "plugins/halo/register"
    },
    {
        "namespace": "test",
        "path": "plugins/halo/test"
    },
    {
        "namespace": "plugins/halo/register",
        "requires": "calendar",
        "path": "plugins/halo/appointments/register"
    },
    {
        "namespace": "plugins/halo/register",
        "requires": "contacts",
        "path": "plugins/halo/contacts/register"
    },
    {
        "namespace": "plugins/halo/register",
        "path": "plugins/halo/linkedIn/register"
    },
    {
        "namespace": "plugins/halo/register",
        "requires": "webmail",
        "path": "plugins/halo/mail/register"
    },
    {
        "namespace": "io.ox/core/notifications",
        "requires": "calendar",
        "path": "plugins/notifications/calendar/register"
    },
    {
        "namespace": "io.ox/core/notifications",
        "requires": "webmail",
        "path": "plugins/notifications/mail/register"
    },
    {
        "namespace": "io.ox/core/notifications",
        "requires": "tasks",
        "path": "plugins/notifications/tasks/register"
    },
    {
        "namespace": "portal",
        "requires": "calendar",
        "path": "plugins/portal/appointments/register"
    },
    {
        "namespace": "portal",
        "requires": "contacts",
        "path": "plugins/portal/birthdays/register"
    },
    {
        "namespace": "portal",
        "path": "plugins/portal/dummy/register"
    },
    {
        "namespace": "portal",
        "requires": "oauth",
        "path": "plugins/portal/facebook/register"
    },
    {
        "namespace": "portal",
        "path": "plugins/portal/flickr/register"
    },
    {
        "namespace": "portal",
        "requires": "oauth",
        "path": "plugins/portal/linkedIn/register"
    },
    {
        "namespace": "portal",
        "requires": "webmail",
        "path": "plugins/portal/mail/register"
    },
    {
        "namespace": "portal",
        "path": "plugins/portal/quota/register"
    },
    {
        "namespace": "portal",
        "path": "plugins/portal/reddit/register"
    },
    {
        "namespace": "portal",
        "path": "plugins/portal/rss/register"
    },
    {
        "namespace": "portal",
        "requires": "tasks",
        "path": "plugins/portal/tasks/register"
    },
    {
        "namespace": "portal",
        "path": "plugins/portal/tumblr/register"
    },
    {
        "namespace": "portal",
        "requires": "oauth",
        "path": "plugins/portal/twitter/register"
    }
]});