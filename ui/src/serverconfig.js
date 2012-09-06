
define(function () {

    return {

        pageTitle: 'OX7. ',
        pageHeader: 'open xchange 7',

        productNameMail: 'OX7 Mailer',

        autoLogin: true,
        forgotPassword: 'https://iforgot.apple.com',

        languages: {
            en_US: 'English',
            de_DE: 'Deutsch',
            fr_FR: 'Français'
        },

        hosts: ['ox7-dev.open-xchange.com', 'ox6-dev.open-xchange.com', 'ox6.open-xchange.com'],

        copyright: '&copy; 2012 open xchange.',
        version: '7.0.0 dev',
        buildDate: '2012-04-26',

        plugins: {
            signin: [],
            core: ['halo'],
            halo: ['halo/contacts', 'halo/appointments', 'halo/linkedIn', 'halo/mail'],
            keychain: ["io.ox/mail/accounts/keychain", 'io.ox/oauth/keychain'],
            keychainSettings: ['io.ox/mail/accounts/settings', 'io.ox/oauth/settings'],
            // All available plugins - default-plugins moved to io.ox/portal/settings/defaults.js:
            portal: ['appointments', 'linkedIn', 'mail', 'rss', 'facebook', 'twitter', 'tumblr', 'flickr', 'reddit', 'dummy', 'tasks', 'quota'],
            notifications: ['calendar', 'mail', 'tasks'],
            tests: ["io.ox/mail/write", "plugins/halo", "io.ox/contacts", "io.ox/contacts/edit", "io.ox/contacts/distrib",
                    "io.ox/core", "io.ox/files/tests/interface", "io.ox/files/tests/unit", "io.ox/settings/accounts/email", "io.ox/settings"]
        },

        portalPluginEditable: ['reddit', 'flickr', 'tumblr'],
        previewExtensions : ['doc', 'dot', 'docx', 'dotx', 'docm', 'dotm', 'xls', 'xlt', 'xla', 'xlsx', 'xltx', 'xlsm',
             'xltm', 'xlam', 'xlsb', 'ppt', 'pot', 'pps', 'ppa', 'pptx', 'potx', 'ppsx', 'ppam', 'pptm', 'potm', 'ppsm', 'pdf']
    };
});
