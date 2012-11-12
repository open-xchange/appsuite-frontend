
define(function () {

    return {

        installed: [
            "io.ox/portal", "io.ox/mail", "io.ox/contacts", "io.ox/calendar",
            "io.ox/files", "io.ox/tasks", "io.ox/conversations",
            "io.ox/dev/ajaxDebug", "io.ox/dev/testing", "io.ox/dev/theme-maker",
            "io.ox/demo", "io.ox/lessons", "io.ox/office/editor"
        ],

        favorites: [
            "io.ox/portal", "io.ox/mail", "io.ox/contacts", "io.ox/calendar",
            "io.ox/files", "io.ox/tasks" //"io.ox/conversations"
        ],

        categories: ["Basic", "Business", "Productivity", "Dev"],

        apps: {

            "io.ox/portal": {
                title: "Portal",
                company: "Open-Xchange",
                icon: "portal.png",
                category: "Productivity",
                settings: true
            },

            "io.ox/mail": {
                title: "Mail",
                company: "Open-Xchange",
                icon: "mail.png",
                category: "Basic",
                settings: true
            },

            "io.ox/mail/write": {
                title: "Compose email",
                company: "Open-Xchange",
                icon: "mail-write.png",
                category: "Basic",
                settings: false,
                visible: false
            },

            "io.ox/applications": {
                title: "Application Manager",
                company: "Open-Xchange",
                icon: "apps.png",
                category: "Basic",
                settings: false,
                visible: false
            },

            "io.ox/contacts": {
                title: "Address Book",
                company: "Open-Xchange",
                icon: "addressbook.png",
                category: "Basic",
                settings: false
            },

            "io.ox/calendar": {
                title: "Calendar",
                company: "Open-Xchange",
                icon: "calendar.png",
                category: "Productivity",
                settings: true
            },

            "io.ox/tasks": {
                title: "Tasks",
                company: "Open-Xchange",
                icon: "default.png",
                category: "Productivity",
                settings: true
            },

            "io.ox/tasks/edit": {
                title: "Edit task",
                company: "Open-Xchange",
                icon: "default.png",
                category: "Productivity",
                settings: false,
                visible: false
            },

            "io.ox/files": {
                title: "Files",
                company: "Open-Xchange",
                icon: "files.png",
                category: "Productivity",
                settings: true
            },

            "io.ox/conversations": {
                title: "Conversations",
                company: "Open-Xchange",
                icon: "conversations.png",
                category: "Productivity",
                settings: false
            },

            "io.ox/editor": {
                title: "SimplePad",
                company: "Open-Xchange",
                icon: "default.png",
                category: "Productivity",
                settings: false
            },

            "io.ox/settings": {
                title: "Settings",
                company: "Open-Xchange",
                icon: "files.png",
                category: "Basic",
                settings: false
            },

            "io.ox/dev/ajaxDebug": {
                title: "Ajax Debugger",
                company: "CompuGlobalHyperMegaNet",
                icon: "default.png",
                category: "Dev",
                settings: false
            },

            "io.ox/dev/testing": {
                title: "UI Test Suite",
                company: "CompuGlobalHyperMegaNet",
                icon: "default.png",
                category: "Dev",
                settings: false
            },

            "io.ox/dev/theme-maker": {
                title: "Theme Maker",
                company: "Mattes Inc.",
                icon: "theme-maker.png",
                category: "Dev",
                settings: false
            },
            "io.ox/demo": {
                title: "Demo Launcher",
                company: "Cisco Inc.",
                category: "Dev",
                settings: false
            },
            "io.ox/lessons": {
                title: "Lessons",
                company: "Open-Xchange Inc.",
                icon: "default.png",
                category: "Dev",
                settings: false
            },
            "io.ox/office/editor": {
                title: "Documents",
                company: "Open-Xchange Inc.",
                icon: "documents.png",
                category: "Dev",
                settings: false,
                createArguments: {file:"new"}
            },
            "3rd.party/addr": {
                title: "Plaxo Address Book",
                company: "Plaxo Inc.",
                icon: "addressbook.png",
                category: "Productivity",
                description: "The only address book that works for you. Plaxo keeps your contact info updated & your communication devices in sync."
            },

            // Examples from apps.1und1.de
            "3rd.party/a1": {
                title: "Scopevisio ERP",
                company: "Scopevisio AG",
                category: "Business",
                icon: "a1.png",
                description: "Vertrieb, Finanzen und Buchhaltung für Dienstleister: Greifen Sie von jedem Standort aus auf stets konsistente Daten zu und vermeiden Sie Doppeleingaben.",
                link: "http://apps.1und1.de/Scopevisio-ERP-7257.html"
            },
            "3rd.party/a2": {
                title: "myfactory.GO!",
                company: "myfactory International GmbH",
                category: "Business",
                icon: "a2.png",
                description: "Geschäftsprozesse effizient steuern: Warenwirtschaft (ERP), CRM und FiBu für Handel, produzierende Unternehmen, Handwerk und Dienstleister.",
                link: "http://apps.1und1.de/myfactoryGO-6928.html"
            },
            "3rd.party/a3": {
                title: "SEGAL ERP",
                company: "SEGAL Systems GmbH",
                category: "Business",
                icon: "a3.png",
                description: "Unternehmensziele erreichen: Machen Sie Ihr Business mit optimaler Projektplanung und zufriedenen Kunden noch erfolgreicher.",
                link: "http://apps.1und1.de/SEGAL-ERP-6874.html"
            },
            "3rd.party/a4": {
                title: "Actindo Commerce",
                company: "Actindo GmbH",
                category: "Business",
                icon: "a4.png",
                description: "Unternehmensziele erreichen: Machen Sie Ihr Business mit optimaler Projektplanung und zufriedenen Kunden noch erfolgreicher.",
                link: "http://apps.1und1.de/Actindo-Commerce-6813.html"
            }
        }
    };
});
