
define(function () {

    return {

        pageTitle: "OX7",
        pageHeader: "open xchange 7",

        autoLogin: true,
        forgotPassword: "https://iforgot.apple.com",

        languages: {
 en_US: "English",
 de_DE: "Deutsch",
 fr_FR: "Français"
        },

        defaultContext: "1337",

        copyright: "&copy; 2011 open xchange.",
        version: "7.0.0 dev",
        buildDate: "2010-10-21",

        plugins: {
            signin: [],
            core: ["halo"],
            halo: ["halo/contacts", "halo/appointments", "halo/linkedIn", "halo/mail"],
            portal: ["appointments", "linkedIn", "mail", "rss"],
            tests: ["io.ox/mail/write", "plugins/halo", "io.ox/contacts", "io.ox/contacts/edit", "io.ox/contacts/distrib",
                    "io.ox/core", "io.ox/files/tests/interface", "io.ox/files/tests/unit"]
        },

        previewExtensions : ["doc", "dot", "docx", "dotx", "docm", "dotm", "xls", "xlt", "xla", "xlsx", "xltx", "xlsm", "xltm", "xlam", "xlsb", "ppt", "pot", "pps", "ppa", "pptx", "potx", "ppsx", "ppam", "pptm", "potm", "ppsm"]
    };
});
