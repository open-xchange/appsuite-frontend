/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */
 
define('com.spamexperts/register', [
    'io.ox/core/extensions',
    'io.ox/core/upsell',
    'gettext!com.spamexperts/translations',
    'settings!com.spamexperts'
],
function (ext, upsell, gt, settings) {
    'use strict';

    if (!upsell.visible('com.spamexperts')) return;

    ext.point('io.ox/core/foldertree/mail/app').extend({
        id: 'com.spamexperts',
        index: 'last',
        draw: function () {
            if (_.device('!smartphone')) {
                this.append($('<div class="links" style="margin-top: -1em">').append(
                    $('<a href="#" data-action="com.spamexperts" tabindex="1" role="button">')
                        .text(
                            //#. %1$s is the name of the configuration panel
                            gt('%1$s access', _.noI18n(settings.get('name'))))
                        .on('click', goToSettings)
                ));
            }
        }
    });

    function goToSettings(e) {
        e.preventDefault();
        if (upsell.has('com.spamexperts')) {
            ox.launch('io.ox/settings/main', { id: 'com.spamexperts' });
        } else {
            upsell.trigger({ missing: 'com.spamexperts' });
        }
    }
});
