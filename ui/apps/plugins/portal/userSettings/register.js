/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/portal/userSettings/register', ['io.ox/core/extensions', 'gettext!io.ox/core'], function (ext, gt) {

    'use strict';

    function changeUserData(e) {
        require(['io.ox/core/tk/dialogs', 'io.ox/core/settings/user'], function (dialogs, userEdit) {

            var popup = new dialogs.SidePopup({ easyOut: true }),
                $node = $('<div>');

            userEdit.editCurrentUser($node).done(function (user) {
                user.on('update', function () {
                    require("io.ox/core/notifications").yell("success", gt("Your data has been saved"));
                    popup.close();
                });
            });

            popup.show(e, function (pane) {
                pane.append($node);
                pane.closest('.io-ox-sidepopup').find('.io-ox-sidepopup-close').hide();
            });
        });
    }

    function changePassword(e) {
        require(['io.ox/core/tk/dialogs', 'io.ox/core/http', 'io.ox/core/notifications'], function (dialogs, http, notifications) {

            new dialogs.ModalDialog({ easyOut: true, async: true, width: 400 })
            .header($('<h4>').text('Change password'))
            .build(function () {
                this.getContentNode().append(
                    $('<label>').text(gt('Your current password')),
                    $('<input type="password" class="input-large current-password">'),
                    $('<label>').text(gt('New password')),
                    $('<input type="password" class="input-large new-password">'),
                    $('<label>').text(gt('Repeat new password')),
                    $('<input type="password" class="input-large repeat-new-password">')
                );
            })
            .addPrimaryButton('change', gt('Change password'))
            .addButton('cancel', gt('Cancel'))
            .on('change', function (e, data, dialog) {
                var node = dialog.getContentNode();
                http.PUT({
                    module: 'passwordchange',
                    params: { action: 'update' },
                    appendColumns: false,
                    data: {
                        old_password: node.find('.current-password').val(),
                        new_password: node.find('.new-password').val(),
                        new_password2: node.find('.repeat-new-password').val()
                    }
                })
                .done(function () {
                    notifications.yell('success', gt('Your passward has been changed'));
                    node.find('input[type="password"]').val('');
                    dialog.close();
                    dialog = null;
                })
                .fail(function (error) {
                    notifications.yell(error);
                    dialog.idle();
                    node.find('input.current-password').focus();
                    dialog = null;
                });
            })
            .show(function () {
                $(this).find('input.current-password').focus();
            });
        });
    }

    ext.point('io.ox/portal/widget/userSettings').extend({

        title: gt('User data'),

        preview: function (baton) {
            this.append(
                $('<div class="content">').append(
                    // user data
                    $('<div class="action">').text(gt('My contact data'))
                    .on('click', changeUserData),
                    // password
                    $('<div class="action">').text(gt('My password'))
                    .on('click', changePassword)
                )
            );
        }
    });

    ext.point('io.ox/portal/widget/userSettings/settings').extend({
        title: gt('User data'),
        type: 'userSettings',
        editable: false
    });
});
