/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Kristof Kamin <kristof.kamin@open-xchange.com>
 */

define('io.ox/files/actions/delete-previous-versions', [
    'io.ox/files/api',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/files'
], function (api, dialogs, gt) {

    'use strict';

    return function (data) {
        new dialogs.ModalDialog()
            .text(gt('Do you really want to delete all previous versions except the current version?'))
            .addPrimaryButton('deletePreviousVersions', gt('Delete'), 'deletePreviousVersions')
            .addButton('cancel', gt('Cancel'), 'cancel')
            .on('deletePreviousVersions', function () {
                api.versions.removePreviousVersions(data);
            })
            .show();
    };
});
