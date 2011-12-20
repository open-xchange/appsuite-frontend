
define(function () {

    return {

        installed: [
            "io.ox/portal", "io.ox/mail", "io.ox/contacts", "io.ox/calendar",
            "io.ox/files", "io.ox/conversations",
            "io.ox/dev/ajaxDebug", "io.ox/dev/testing", "io.ox/dev/theme-maker"
        ],

        favorites: [
            "io.ox/portal", "io.ox/mail", "io.ox/contacts", "io.ox/calendar",
            "io.ox/files", "io.ox/conversations"
        ],

        categories: ["Basic", "Productivity", "Dev"],

        apps: {

            "io.ox/portal": {
                title: "Portal",
                company: "Open-Xchange",
                icon: "default.png",
                category: "Productivity"
            },

            "io.ox/mail": {
                title: "E-Mail",
                company: "Open-Xchange",
                icon: "mail.png",
                category: "Basic"
            },

            "io.ox/contacts": {
                title: "Address Book",
                company: "Open-Xchange",
                icon: "addressbook.png",
                category: "Basic"
            },

            "io.ox/calendar": {
                title: "Calendar",
                company: "Open-Xchange",
                icon: "calendar.png",
                category: "Productivity"
            },

            "io.ox/files": {
                title: "Files",
                company: "Open-Xchange",
                icon: "files.png",
                category: "Productivity"
            },

            "io.ox/conversations": {
                title: "Conversations",
                company: "Open-Xchange",
                icon: "default.png",
                category: "Productivity"
            },

            "io.ox/dev/ajaxDebug": {
                title: "Ajax Debugger",
                company: "CompuGlobalHyperMegaNet",
                icon: "default.png",
                category: "Dev"
            },

            "io.ox/dev/testing": {
                title: "UI Test Suite",
                company: "CompuGlobalHyperMegaNet",
                icon: "default.png",
                category: "Dev"
            },

            "io.ox/dev/theme-maker": {
                title: "Theme Maker",
                company: "Mattes Inc.",
                icon: "default.png",
                category: "Dev"
            }
        }
    };
});