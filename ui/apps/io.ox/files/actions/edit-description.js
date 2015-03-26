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
    'io.ox/files/legacy_api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/tk/keys',
    'gettext!io.ox/files'
], function (api, dialogs, KeyListener, gt) {

    'use strict';

    return function (data) {

        var keys = new KeyListener($input),
            dialog = new dialogs.ModalDialog(),
            $input = $('<textarea rows="10" class="form-control" tabindex="1"></textarea>')
                    .val(data.description),
            $form = $('<form>')
                    .css('margin', '0 0 0 0')
                    .append(
                        $input
                    );

        function save() {
            var description = $input.val(),
                update = {
                    id: data.id,
                    folder_id: data.folder_id,
                    description: description
                };
            return api.update(update).fail(notify);
        }

        // notifications lazy load
        function notify () {
            var self = this,
                args = arguments;
            require(['io.ox/core/notifications'], function (notifications) {
                notifications.yell.apply(self, args);
            });
        }

        keys.on('shift+enter', function () {
            dialog.busy();
            save().done(function () {
                dialog.close();
            });
        });

        dialog
            .header($('<h4>').text(gt('Description')))
            .append(
                $form
            )
            .addPrimaryButton('save', gt('Save'), 'save',  { 'tabIndex': '1' })
            .addButton('cancel', gt('Cancel'), 'cancel',  { 'tabIndex': '1' })
            .show(function () {
                $input.select();
                keys.include();
            })
            .done(function (action) {
                if (action === 'save') {
                    save();
                }
            });
    };
});
