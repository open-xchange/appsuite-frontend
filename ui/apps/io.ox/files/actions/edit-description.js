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

define('io.ox/files/actions/edit-description', [
    'io.ox/files/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (api, ModalDialog, notifications, gt) {

    'use strict';

    return function (data) {
        new ModalDialog({ title: gt('Description') })
            .build(function () {
                this.$body.append(
                    this.$textarea = $('<textarea rows="10" class="form-control">').val(data.description)
                );
            })
            .addCancelButton()
            .addButton({ label: gt('Save'), action: 'save' })
            .on('save', function () {
                return api.update(data, { description: this.$textarea.val() }).fail(notifications.yell);
            })
            .open();
    };
});
