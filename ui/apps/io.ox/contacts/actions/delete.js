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
    'io.ox/backbone/views/modal',
    'gettext!io.ox/contacts'
], function (api, ModalDialog, gt) {

    'use strict';

    return function (baton) {
        var data = baton.data;
        new ModalDialog({ title: getTitle(data), description: getQuestion(data) })
            .addCancelButton()
            .addButton({ label: gt('Delete'), action: 'delete' })
            .on('delete', function () { api.remove(data); })
            .open();
    };

    //#. ''Delete items', 'Delete distribution list' and 'Delete contact' as headers of a modal dialog to delete items, distribution lists and contacts.
    function getTitle(data) {
        if (data.length > 1) return gt('Delete items');
        if (data[0].mark_as_distributionlist) return gt('Delete distribution list');
        return gt('Delete contact');
    }

    function getQuestion(data) {
        if (data.length > 1) return gt('Do you really want to delete these items?');
        if (data[0].mark_as_distributionlist) return gt('Do you really want to delete this distribution list?');
        return gt('Do you really want to delete this contact?');
    }
});
