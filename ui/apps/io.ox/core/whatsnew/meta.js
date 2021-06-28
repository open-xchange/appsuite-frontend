/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/whatsnew/meta', [
    'io.ox/core/extensions',
    'gettext!io.ox/core',
    'settings!io.ox/core',
    'io.ox/core/capabilities'
], function (ext, gt, settings, capabilities) {

    'use strict';

    // versions:
    // '7.10.5': 1
    var features = [
        {
            version: 1,
            capabilities: 'infostore && (filestorage_xox || filestorage_xctx)',
            name: gt('Federated Sharing of Files'),
            description: gt('The sharing dialogs have been significantly updated to simplify the whole sharing process, and to facilitate the sharing of files between contexts and other deployments.')
        },
        {
            version: 1,
            capabilities: 'client-onboarding',
            // this feature needs a custom check because capabilities are not sufficient here. Customers may still have the old wizard configured
            check: function () {
                return settings.get('onboardingWizard', true);
            },
            name: gt('Improved "Connect your device" Wizard'),
            description: gt('The "Connect your device" wizard now features simplified device selection, as well as the use of QR codes to make setting up your device even easier.')
        },
        {
            version: 1,
            capabilities: 'infostore',
            name: gt('%1$s Usability', gt.pgettext('app', 'OX Drive')),
            description: gt('%1$s now offers the ability to Drag & Drop desktop folders into %1$s. The sharing dialogs have also been simplified and search performance was improved.', gt.pgettext('app', 'OX Drive'))
        },
        {
            version: 1,
            capabilities: 'webmail',
            name: gt('Saving Email Drafts'),
            description: gt('Email drafts are now automatically saved in the drafts folder and are therefore available on all your devices by default.')
        },
        {
            version: 1,
            name: gt('Navigation Improvements'),
            description: gt('The top navigation area has been redesigned to make accessing apps, help and settings easier.')
        },
        {
            version: 1,
            capabilities: 'switchboard',
            name: gt('Audio and Video'),
            description: gt('This release comes with the ability to hold a video or audio call with other people. This can be scheduled within a calendar appointment, or started directly from contacts, the halo view and other logical places. To help we have also added a presence indicator.')
        },
        {
            version: 1,
            capabilities: 'chat',
            name: gt('Chat for %1$s', ox.serverConfig.productName),
            description: gt('With this release you will notice a new chat bubble icon in the menu bar. This opens the new chat window and lets you write messages to any other OX App Suite user. Chats can be instigated from the chat window, contacts or halo view.')
        }
    ];

    // example for configuration
    /*var links = {
        fallback: 'https://www.open-xchange.com',
        ca_ES: 'https://www.open-xchange.com',
        cs_CZ: 'https://www.open-xchange.com',
        da_DK: 'https://www.open-xchange.com',
        de_DE: 'https://www.open-xchange.com',
        en_GB: 'https://www.open-xchange.com',
        en_US: 'https://www.open-xchange.com',
        es_ES: 'https://www.open-xchange.com',
        es_MX: 'https://www.open-xchange.com',
        fi_FI: 'https://www.open-xchange.com',
        fr_CA: 'https://www.open-xchange.com',
        fr_FR: 'https://www.open-xchange.com',
        hu_HU: 'https://www.open-xchange.com',
        it_IT: 'https://www.open-xchange.com',
        ja_JP: 'https://www.open-xchange.com',
        lv_LV: 'https://www.open-xchange.com',
        nb_NO: 'https://www.open-xchange.com',
        nl_NL: 'https://www.open-xchange.com',
        pl_PL: 'https://www.open-xchange.com',
        pt_BR: 'https://www.open-xchange.com',
        ro_RO: 'https://www.open-xchange.com',
        ru_RU: 'https://www.open-xchange.com',
        sk_SK: 'https://www.open-xchange.com',
        sv_SE: 'https://www.open-xchange.com',
        tr_TR: 'https://www.open-xchange.com',
        zh_CN: 'https://www.open-xchange.com',
        zh_TW: 'https://www.open-xchange.com'
    };
    */

    // support customized help links
    var helpLinks = settings.get('whatsNew/helpLinks', false);
    // no custom fallback link? use en_US
    if (helpLinks) helpLinks.fallback = helpLinks.fallback || helpLinks.en_US;

    // allow customization of the feature list, be careful to use the same versioning as the original list or we will get bugs
    var customfeatures = ext.point('io.ox/core/whatsnew/dialog/featurelist').invoke('customize', null, features).valueOf();

    if (customfeatures.length > 0) {
        features = _(customfeatures).flatten();
    }

    // get the latest version that has features in the list
    var getLatestVersion = function () {
            return _.max(_(features).pluck('version'));
        },
        // get features based on the last seen version of the dialog
        getFeatures = function () {
            var latestVersion = getLatestVersion();

            return _(features).filter(function (feature) {
                // not seen by user or from the latest version (we always want to show the features from the latest version because empty lists are boring)
                // also user must have the correct capabilities
                // some features may also be device specific (disabled on smartphones etc)
                // if there is a custom check function, run that too
                return (feature.version > settings.get('whatsNew/lastSeenVersion', -1) || feature.version === latestVersion) &&
                       (!feature.capabilities || capabilities.has(feature.capabilities) &&
                       (!feature.device || _.device(feature.device)) &&
                       (!feature.check || feature.check())
                       );
            });
        },
        // returns language specific help url or fallback if configured
        getLink = function () {
            if (!helpLinks) return false;
            return helpLinks[ox.language] || helpLinks.fallback;
        };

    return {
        getFeatures: getFeatures,
        getLatestVersion: getLatestVersion,
        getLink: getLink
    };
});
