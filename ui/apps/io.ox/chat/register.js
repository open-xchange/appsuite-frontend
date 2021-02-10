/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/register', [], function (settings) {

    'use strict';

    ox.on('core:ready', function () {
        // no smartphone support yet
        if (_.device('smartphone')) return;
        if (_.device('!maintab')) return;
        require(['settings!io.ox/chat', 'io.ox/chat/main'], function (settings, app) {
            if (!settings.get('autoStart', false)) return;
            app.getApp().launch();
        });
    });
});
