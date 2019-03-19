/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicableƒ
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/mail/compose/actions', [
    'io.ox/backbone/views/actions/util',
    'io.ox/core/download'
], function (actionUtil, download) {

    'use strict';

    new actionUtil.Action('io.ox/mail/compose/actions/download', {
        // no download for older ios devices
        device: '!ios || ios >= 12',
        collection: 'some',
        action: function (baton) {
            download.composeAttachment(baton.first());
        }
    });

});
