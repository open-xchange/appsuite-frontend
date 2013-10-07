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
     'gettext!io.ox/core',
     'settings!io.ox/core',
     'less!plugins/portal/userSettings/style.less'
    ], function (ext, main, gt, settings) {

    'use strict';

    function keyClickFilter(e) {
        if (e.which === 13 || e.type === 'click') {
            if (_.isFunction(e.data.fn)) {
                e.data.fn();
            }
        }
    }

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

            var oldPass, newPass, newPass2, strengthBar, strengthLabel, strengthBarWrapper, passwordHintContainer,
                minLength = settings.get('password/minLength', 4),
                maxLength = settings.get('password/maxLength', 0),
                pwStrengths = [
                    {label: gt('Passwordstrength: Too short'), color: 'bar-darkgrey', barLength: '20%',
                              //#. %1$s is the minimum passwordlength
                              //#, c-format
                        hint: gt('Minimum password length is %1$d.', minLength)},//darkgrey
                    {label: gt('Passwordstrength: Wrong length'), color: 'bar-darkgrey', barLength: '20%',
                              //#. %1$s is the minimum passwordlength
                              //#. %2$s is the maximum passwordlength
                              //#, c-format
                        hint: gt('Password length must be between %1$d and %2$d characters.', minLength, maxLength)},//darkgrey
                    {label: gt('Passwordstrength: Very weak'), color: 'bar-darkgrey', barLength: '20%',
                     hint: gt('Your password is more secure if it also contains capital letters, numbers, and special characters like $, _, %')},//darkgrey
                    {label: gt('Passwordstrength: Weak'), color: 'bar-danger', barLength: '40%',
                     hint: gt('Your password is more secure if it also contains capital letters, numbers, and special characters like $, _, %')},//red
                    {label: gt('Passwordstrength: Good'), color: 'bar-success', barLength: '60%',
                     hint: gt('Your password is more secure if it also contains capital letters, numbers, and special characters like $, _, %')},//green
                    {label: gt('Passwordstrength: Strong'), color: 'bar-info', barLength: '80%'},//blue
                    {label: gt('Passwordstrength: Very strong'), color: 'bar-epic', barLength: '100%'},//purple
                    {label: gt('Passwordstrength: Lengendary!'), color: 'bar-legendary', barLength: '100%'},//Orange
                ];

            new dialogs.ModalDialog({ async: true, width: 400 })
            .header($('<h4>').text(gt('Change password')))
            .build(function () {
                this.getContentNode().append(
                    $('<label>').text(gt('Your current password')),
                    oldPass = $('<input type="password" class="form-control input-lg current-password">'),
                    $('<label>').text(gt('New password')),
                    newPass = $('<input type="password" class="form-control input-lg new-password">').on('keyup', updateStrength),
                    $('<label>').text(gt('Repeat new password')),
                    newPass2 = $('<input type="password" class="form-control input-lg repeat-new-password">'),
                    strengthLabel = $('<label class="password-strength-label">').hide(),//hide till new pw is inserted
                    strengthBarWrapper = $('<div class="progress">').append(
                        strengthBar = $('<div class="bar password-strength-bar">')).hide(),//hide till new pw is inserted
                    passwordHintContainer = $('<div class=password-hint-container>').hide(),
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
                if (newPass.val() === newPass2.val()) {
                    http.PUT({
                        module: 'passwordchange',
                        params: { action: 'update' },
                        appendColumns: false,
                        data: {
                            old_password: oldPass.val(),
                            new_password: newPass.val(),
                            new_password2: newPass2.val()
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
                        oldPass.focus();
                        dialog = null;
                    });
                } else {
                    notifications.yell('warning', gt('The two newly entered passwords do not match.'));
                    dialog.idle();
                    newPass2.focus();
                    dialog = null;
                }
            })
            .show(function () {
                oldPass.focus();
            });

            function strengthtest(pw) {//returns the strength of a password
                //length test
                if (pw.length >= minLength && (pw.length <= maxLength || maxLength === 0)) {// between min and max length
                    // lower case; +1 upper case +1; numbers +1; special chars +1
                    var score = 2 + /[a-z]/.test(pw) + /[A-Z]/.test(pw) + /[0-9]/.test(pw) + (new RegExp('[^a-z0-9]', 'i')).test(pw),
                        // (>6)-->2, (6-7)-->4,(8-9)-->5, (>10)-->6 or more
                        maxScore = 2 + Math.floor((Math.max(0, pw.length - 4) / 2)) + (pw.length >= 6 ? 1 : 0);
                    //legendary test for truly awesome passwords
                    if (score === 6 && pw.length > 99) {
                        score = 7;//really legendary
                    }
                    return pwStrengths[Math.min(score, maxScore)];
                } else if (maxLength === 0) {
                    return pwStrengths[0];// to short with no maxlength
                } else {
                    return pwStrengths[1];// to short or to long
                }
            }

            function updateStrength() {//tests the password and draws the bar
                if (newPass.val() === '') {
                    strengthLabel.hide();
                    strengthBarWrapper.hide();
                    passwordHintContainer.text('').hide();
                } else {
                    var result = strengthtest(newPass.val());
                    strengthLabel.text(result.label).show();
                    strengthBar.removeClass('bar-darkgrey bar-danger bar-success bar-info bar-epic bar-legendary')//cleanup
                        .addClass(result.color).css('width', result.barLength);
                    strengthBarWrapper.show();
                    if (result.hint) {
                        passwordHintContainer.text(result.hint).show();
                    } else {
                        passwordHintContainer.text('').hide();
                    }
                }
            }
        });
    }

    ext.point('io.ox/portal/widget/userSettings').extend({

        title: gt('User data'),

        preview: function () {
            var content;
            this.append(
                content = $('<div class="content">').append(
                    // user data
                    $('<div class="action" role="button" tabindex="1">').text(gt('My contact data'))
                    .on('click keypress', { fn: changeUserData }, keyClickFilter)

                )
            );
            // password
            //check for capability
            require(['io.ox/core/capabilities'], function (capabilities) {
                if (capabilities.has('edit_password')) {
                    content.append(
                        $('<div class="action" role="button" tabindex="1">').text(gt('My password'))
                        .on('click keypress', { fn: changePassword}, keyClickFilter)
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
