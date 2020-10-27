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
            name: 'Download additional ram',
            description: 'Cannot run the latest games? Fear no more we\'ve got you covered. Download extra ram with one click. Packages of 16GB, 32GB or even 64GB available. RGB for more fps included of course'
        }
    ];

    // language based, uses ox.language variable
    // TODO provide some official default links
    var helpLinks = {
        fallback: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ca_ES: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        cs_CZ: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        da_DK: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        de_DE: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        en_GB: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        en_US: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        es_ES: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        es_MX: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        fi_FI: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        fr_CA: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        fr_FR: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        hu_HU: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        it_IT: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ja_JP: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        lv_LV: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        nb_NO: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        nl_NL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        pl_PL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        pt_BR: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ro_RO: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ru_RU: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sk_SK: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sv_SE: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        tr_TR: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        zh_CN: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        zh_TW: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
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
