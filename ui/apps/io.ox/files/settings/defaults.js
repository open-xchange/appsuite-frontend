/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/files/settings/defaults', function () {

    'use strict';

    var settingsDefaults = {
        view: 'fluid:icon',
        videoEnabled: true,
        audioEnabled: true,
        rootFolderId: 9,
        showHidden: false
    };

    return settingsDefaults;
});
