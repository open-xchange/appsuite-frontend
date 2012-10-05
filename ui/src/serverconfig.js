
define(function () {

    return {

        pageTitle: 'App Suite. ',

        pageHeaderPrefix: 'open xchange',
        pageHeader: 'App Suite',

        productNameMail: 'OX Mail',

        autoLogin: true,
        forgotPassword: false, //'https://iforgot.apple.com',

        languages: {
            en_US: 'English',
            de_DE: 'Deutsch',
            fr_FR: 'Français'
        },

        hosts: ['ox7-dev.open-xchange.com', 'ox6-dev.open-xchange.com', 'ox6.open-xchange.com'],

        copyright: '\u00A9 2012 open xchange.',
        version: '7.0.0 Drop #5',
        buildDate: '2012-10-04',

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
                    "io.ox/core", "io.ox/files/tests/interface", "io.ox/files/tests/unit", "io.ox/settings/accounts/email", "io.ox/settings", 'io.ox/backbone/tests']
        },

        portalPluginEditable: ['reddit', 'flickr', 'tumblr', 'rss'],
        previewExtensions : ['doc', 'dot', 'docx', 'dotx', 'docm', 'dotm', 'xls', 'xlt', 'xla', 'xlsx', 'xltx', 'xlsm',
             'xltm', 'xlam', 'xlsb', 'ppt', 'pot', 'pps', 'ppa', 'pptx', 'potx', 'ppsx', 'ppam', 'pptm', 'potm', 'ppsm', 'pdf']
    };
});
