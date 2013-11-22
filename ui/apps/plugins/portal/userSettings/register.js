/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/portal/userSettings/register',
    ['io.ox/core/extensions',
     'io.ox/core/main',
     'gettext!io.ox/core'
    ], function (ext, main, gt) {

    'use strict';

    function changeUserData() {

        require(['io.ox/core/tk/dialogs', 'io.ox/core/settings/user'], function (dialogs, users) {
            var usermodel,
                dialog = new dialogs.ModalDialog({
                    top: 60,
                    width: 900,
                    center: false,
                    maximize: true
                })
                .addPrimaryButton('save', gt('Save'))
                .addButton('discard', gt('Discard'));

            var $node = dialog.getContentNode();

            users.editCurrentUser($node).done(function (model) {
                usermodel = model;
            }).fail(function () {
                $node.append(
                    $.fail(gt('Couldn\'t load your contact data.'), function () {
                        users.editCurrentUser($node).done(function () {
                            $node.find('[data-action="discard"]').hide();
                        });
                    })
                );
            });
            dialog.show().done(function (action) {
                if (action === 'save') {
                    usermodel.save();
                }
            });
        });
    }

    function changePassword() {

        require(['io.ox/core/tk/dialogs', 'io.ox/core/http', 'io.ox/core/notifications'], function (dialogs, http, notifications) {

            new dialogs.ModalDialog({ async: true, width: 400 })
            .header($('<h4>').text(gt('Change password')))
            .build(function () {
                this.getContentNode().append(
                    $('<label>').text(gt('Your current password')),
                    $('<input type="password" class="input-large current-password">'),
                    $('<label>').text(gt('New password')),
                    $('<input type="password" class="input-large new-password">'),
                    $('<label>').text(gt('Repeat new password')),
                    $('<input type="password" class="input-large repeat-new-password">'),
                    $('<div class="alert alert-block alert-info">')
                    .css('margin', '14px 0px')
                    .text(
                        gt('If you change the password, you will be signed out. Please ensure that everything is closed and saved.')
                    )
                );
            })
            .addPrimaryButton('change', gt('Change password and sign out'))
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
                    node.find('input[type="password"]').val('');
                    dialog.close();
                    dialog = null;
                    main.logout();
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

        preview: function () {
            var content;
            this.append(
                content = $('<div class="content">').append(
                    // user data
                    $('<div class="action">').text(gt('My contact data'))
                    .on('click', changeUserData)
                )
            );
            // password
            //check for capability
            require(['io.ox/core/capabilities'], function (capabilities) {
                if (capabilities.has('edit_password')) {
                    content.append(
                        $('<div class="action">').text(gt('My password'))
                        .on('click', changePassword)
                    );
                }
            });
        }
    });

    ext.point('io.ox/portal/widget/userSettings/settings').extend({
        title: gt('User data'),
        type: 'userSettings',
        editable: false,
        unique: true
    });

    return {
        changePassword: function (e) {
            if (e && e.preventDefault) e.preventDefault();
            require(['io.ox/core/capabilities'], function (capabilities) {
                if (capabilities.has('edit_password')) changePassword();
            });
        }
    };
});
