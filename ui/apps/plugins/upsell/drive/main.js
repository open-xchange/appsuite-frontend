
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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/upsell/drive/main', [
    'io.ox/core/extPatterns/stage',
    'io.ox/core/extensions',
    'settings!plugins/upsell'
], function (Stage, ext, settings) {

    'use strict';

    var adSettings =  settings.get('driveAd'),
        extendDrive;

    if (!adSettings) {
        console.error('The upsell bubbles app does not work without settings for plugins/upsell//driveAd.');
        return;
    }

    extendDrive = function () {
        ext.point('io.ox/files/details').extend({
            id: 'upsellad',
            //after the title, right?
            index: 201,
            draw: function () {
                this.append(
                    $('<div>').html(adSettings)
                );
            }
        });
    };

    new Stage('io.ox/core/stages', {
        id: 'upsellbubbles',
        index: 1002,
        run: function () {
            extendDrive();
            return $.when();
        }
    });

    return {
        extendDrive: extendDrive
    };
});
