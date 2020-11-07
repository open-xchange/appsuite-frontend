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
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/chat/settings/defaults', [], function () {

    'use strict';

    return {
        host: false,
        emailNotification: 'always',
        showChatNotifications: true,
        sounds: {
            enabled: true,
            playWhen: 'onlyInactive',
            file: 'bongo1.mp3'
        }
    };
});
