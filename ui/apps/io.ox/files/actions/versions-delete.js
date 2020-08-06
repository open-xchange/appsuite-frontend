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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/actions/versions-delete', [
    'io.ox/files/api',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/files'
], function (api, ModalDialog, gt) {

    'use strict';

    return function (data) {
        //#. 'Delete version' as header text to confirm to delete a version of a file via a modal dialog.
        new ModalDialog({ title: gt('Delete version'), description: gt.pgettext('One file only', 'Do you really want to delete this version?') })
            .addCancelButton()
            .addButton({ label: gt('Delete version'), action: 'delete' })
            .on('delete', function () { api.versions.remove(data); })
            .open();
    };
});
