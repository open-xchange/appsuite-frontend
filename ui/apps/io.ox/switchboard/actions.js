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
 */

define('io.ox/switchboard/actions', [
    'io.ox/switchboard/main',
    'io.ox/backbone/views/modal',
    'io.ox/core/tk/sounds-util',
    'io.ox/backbone/views/actions/util'
], function (api, Modal, Sound, actionsUtil) {

    'use strict';

    var Action = actionsUtil.Action;

    new Action('io.ox/switchboard/call-user', {
        action: function (baton) {
            // TODO: Nice dialog
            new Modal({ title: 'Calling...', description: 'Calling user ' + baton.user })
                .addButton({ label: 'Cancel', action: 'cancel' })
                .on('cancel', function () {
                    api.cancel();
                })
                .open();

            api.call(baton.user);
        }
    });

});
