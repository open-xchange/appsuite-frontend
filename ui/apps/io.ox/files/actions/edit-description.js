/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/actions/edit-description', [
    'io.ox/files/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (api, dialogs, notifications, gt) {

    'use strict';

    return function (data) {

        function save() {
            var changes = { description: this.getContentNode().find('textarea').val() };
            console.log('update', data, changes);
            return api.update(data, changes).fail(notifications.yell);
        }

        new dialogs.ModalDialog()
            .header($('<h4>').text(gt('Description')))
            .append(
                $('<textarea rows="10" class="form-control" tabindex="1">')
            )
            .addPrimaryButton('save', gt('Save'), 'save',  { 'tabIndex': '1' })
            .addButton('cancel', gt('Cancel'), 'cancel',  { 'tabIndex': '1' })
            .on('save', save)
            .show(function () {
                this.find('textarea').val(data.description).focus();
            });
    };
});
