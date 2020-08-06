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
    'io.ox/backbone/views/modal',
    'gettext!io.ox/files'
], function (api, ModalDialog, gt) {

    'use strict';

    return function (data) {
        //#. 'Delete previous versions' as header of a modal dialog to confirm to delete all previous versions of a file.
        new ModalDialog({ title: gt('Delete previous versions'), description: gt('Do you really want to delete all previous versions except the current version?') })
            .addCancelButton()
            .addButton({ label: gt('Delete'), action: 'deletePreviousVersions' })
            .on('deletePreviousVersions', function () { api.versions.removePreviousVersions(data); })
            .open();
    };
});
