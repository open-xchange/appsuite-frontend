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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */


define('io.ox/contacts/enterprisepicker/dialog', [
    'io.ox/backbone/views/modal',
    'gettext!io.ox/contacts'
], function (ModalDialog, gt) {

    'use strict';

    var open = function (callback) {

        return new ModalDialog({
            point: 'io.ox/contacts/enterprisepicker-dialog',
            help: 'ox.appsuite.user.sect.email.send.enterpriserpicker.html',
            title: gt('Global address list')
        })
        .on({
            'select': function () {
                var selection = [];
                if (_.isFunction(callback)) callback(selection);
            }
        })
        .addCancelButton()
        //#. Context: Add selected contacts; German "Auswählen", for example
        .addButton({ label: gt('Select'), action: 'select' })
        .open();
    };

    // use same names as default addressbook picker, to make it easier to switch between the two
    return {
        open: open
    };

});
