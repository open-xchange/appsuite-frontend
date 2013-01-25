
define(function () {

    return {

        pageTitle: 'App Suite. ',

        pageHeaderPrefix: 'OX',
        pageHeader: 'App Suite',

        productName: 'Open-Xchange App Suite',
        productNameMail: 'OX Mail',

        contact: 'Open-Xchange AG, Rollnerstr. 14, D-90408 Nürnberg, E-Mail: info@open-xchange.com',

        autoLogin: true,
        forgotPassword: false, //'https://iforgot.apple.com',

        languages: {
            en_US: 'English',
            de_DE: 'Deutsch',
            fr_FR: 'Français'
        },

        hosts: ['appsuite-dev.open-xchange.com', 'ox6-dev.open-xchange.com', 'ox6.open-xchange.com'],

        copyright: '\u00A9 2012 Open-Xchange.',
        version: '7.0.0 Drop #6',
        serverVersion: '6.22.0 Rev 42',
        buildDate: '2012-11-01',

        plugins: {
            signin: [],
            core: ['halo']
        },

        portalPluginEditable: ['reddit', 'flickr', 'tumblr', 'rss'],
        previewExtensions : ['doc', 'dot', 'docx', 'dotx', 'docm', 'dotm', 'xls', 'xlt', 'xla', 'xlsx', 'xltx', 'xlsm',
             'xltm', 'xlam', 'xlsb', 'ppt', 'pot', 'pps', 'ppa', 'pptx', 'potx', 'ppsx', 'ppam', 'pptm', 'potm', 'ppsm', 'pdf',
             'odt', 'ods', 'odp', 'odg', 'odc', 'odf', 'odi', 'odm', 'otg', 'ots', 'ott', 'otp' ]
    };
});
