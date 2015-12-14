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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/contacts/actions/delete', [
    'io.ox/contacts/api',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/contacts'
], function (api, dialogs, gt) {

    'use strict';

    return function (baton) {

        var data = baton.data, question;

        // get proper question
        if (_.isArray(data) && data.length > 1) {
            question = gt('Do you really want to delete these items?');
        } else if (data.mark_as_distributionlist) {
            question = gt('Do you really want to delete this distribution list?');
        } else {
            question = gt('Do you really want to delete this contact?');
        }

        new dialogs.ModalDialog()
            .text(question)
            .addPrimaryButton('delete', gt('Delete'), 'delete', { 'tabIndex': '1' })
            .addButton('cancel', gt('Cancel'), 'cancel', { 'tabIndex': '1' })
            .show()
            .done(function (action) {
                if (action === 'delete') {
                    api.remove(data);
                }
            });
    };

});
