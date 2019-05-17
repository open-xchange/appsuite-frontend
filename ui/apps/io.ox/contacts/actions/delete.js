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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/contacts/actions/delete', [
    'io.ox/contacts/api',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/contacts'
], function (api, dialogs, gt) {

    'use strict';

    return function (baton) {
        var data = baton.data;
        new dialogs.ModalDialog()
            .text(getQuestion(data))
            .addPrimaryButton('delete', gt('Delete'), 'delete')
            .addButton('cancel', gt('Cancel'), 'cancel')
            .show()
            .done(function (action) {
                if (action === 'delete') api.remove(data);
            });
    };

    function getQuestion(data) {
        if (data.length > 1) return gt('Do you really want to delete these items?');
        if (data[0].mark_as_distributionlist) return gt('Do you really want to delete this distribution list?');
        return gt('Do you really want to delete this contact?');
    }
});
