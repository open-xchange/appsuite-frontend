/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/wizards/firstStart/main', [
    'io.ox/core/extPatterns/stage'
], function (Stage) {

    'use strict';

    new Stage('io.ox/core/stages', {
        id: 'firstStartWizard',
        index: 550,
        run: function () {
            return $.when();
        }
    });

    return {
    };
});
