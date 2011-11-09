
define(function () {
    
    return {
        
        installed: [
            "io.ox/portal", "io.ox/mail", "io.ox/contacts", "io.ox/calendar",
            "io.ox/files", "io.ox/conversation",
            "io.ox/internal/ajaxDebug", "io.ox/internal/testing"
        ],
        
        favorites: [
            "io.ox/portal", "io.ox/mail", "io.ox/contacts", "io.ox/calendar",
            "io.ox/files", "io.ox/conversation"
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
            
            "io.ox/conversation": {
                title: "Conversations",
                company: "Open-Xchange",
                icon: "default.png",
                category: "Productivity"
            },
            
            "io.ox/internal/ajaxDebug": {
                title: "Ajax Debugger",
                company: "CompuGlobalHyperMegaNet",
                icon: "default.png",
                category: "Dev"
            },
            
            "io.ox/internal/testing": {
                title: "UI Test Suite",
                company: "CompuGlobalHyperMegaNet",
                icon: "default.png",
                category: "Dev"
            }
        }
    };
});