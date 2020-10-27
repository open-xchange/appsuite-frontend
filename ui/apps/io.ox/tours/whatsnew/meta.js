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

define('io.ox/tours/whatsnew/meta', [
    'gettext!io.ox/core',
    'settings!io.ox/tours',
    'io.ox/core/capabilities'
], function (gt, settings, capabilities) {

    'use strict';

    // versions:
    // '7.10.5': 1
    var features = [
        /*
        {
            version: 1,
            name: 'New top bar layout',
            description: 'We\'ve resorted the icons in the upper application bar. The app launcher and quick launchers are now grouped on the left to make navigation faster and easier.'
        },
        {
            version: 1,
            name: 'Search moved to the top',
            description: 'The search field moved to the top to offer faster and easier access, no need to open the folder tree anymore.'
        },
        {
            version: 1,
            capabilities: 'infostore',
            name: 'Format HDD feature',
            description: 'Get unlimited space on your local hard drive by erasing simply everything directly through the browser.'
        },
        {
            version: 1,
            capabilities: 'infostore calendar',
            name: 'Flux compensator',
            description: 'With our new flux device we are able to send you just back to the future. Time travel made easy, ask Doc Brown for more info. Note: Plutonium not included'
        },
        {
            version: 1,
            name: gt('Download additional ram'),
            description: gt('Cannot run the latest games? Fear no more we\'ve got you covered. Download extra ram with one click. Packages of 16GB, 32GB or even 64GB available. RGB for more fps included of course')
        }*/
    ];

    // language based, uses ox.language variable
    // TODO provide some official default links
    var helpLinks = {
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

    // support customized help links
    helpLinks = settings.get('whatsNew/helpLinks', helpLinks);
    // no custom fallback link? use en_US
    helpLinks.fallback = helpLinks.fallback || helpLinks.en_US;

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
                return (feature.version > settings.get('whatsNew/lastSeenVersion', -1) || feature.version === latestVersion) &&
                       (!feature.capabilities || capabilities.has(feature.capabilities));
            });
        },
        // returns language specific help url or fallback
        getLink = function () {
            return helpLinks[ox.language] || helpLinks.fallback;
        };

    return {
        getFeatures: getFeatures,
        getLatestVersion: getLatestVersion,
        getLink: getLink
    };
});
