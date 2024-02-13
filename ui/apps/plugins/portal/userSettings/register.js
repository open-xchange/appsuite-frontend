/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('plugins/portal/userSettings/register', [
    'io.ox/core/extensions',
    'io.ox/core/main',
    'gettext!io.ox/core',
    'settings!io.ox/core',
    'io.ox/core/capabilities',
    'less!plugins/portal/userSettings/style'
], function (ext, main, gt, settings, capabilities) {

    'use strict';

    var internalUserEdit = settings.get('user/internalUserEdit', true),
        passwordEdit = capabilities.has('edit_password');

    if (!internalUserEdit && !passwordEdit) return false;

    function keyClickFilter(e) {
        if (e.which === 13 || e.type === 'click') {
            if (_.isFunction(e.data.fn)) {
                e.data.fn();
            }
        }
    }

    function changeUserData() {
        require(['io.ox/core/settings/user'], function (users) {
            users.openModalDialog();
        });
    }

    function changePassword() {

        require(['io.ox/backbone/views/modal', 'io.ox/core/http', 'io.ox/core/yell'], function (ModalDialog, http, yell) {

            var isGuest = capabilities.has('guest'),
                oldPass, oldScore, newPass, newPass2, strengthBar, strengthLabel, strengthBarWrapper,
                minLength = settings.get('password/minLength', 4),
                maxLength = settings.get('password/maxLength', 0),
                showStrength = settings.get('password/showStrength', true),
                pwRegex = settings.get('password/regexp', '[^a-z0-9]'),
                regexText = settings.get('password/special', '$, _, %'),
                buttonText = gt('Change password and sign out'),
                pwStrengths = [
                    { label: gt('Password strength: Too short'), color: 'bar-weak', barLength: '20%' }, //red
                    { label: gt('Password strength: Wrong length'), color: 'bar-weak', barLength: '20%' }, //red
                    { label: gt('Password strength: Very weak'), color: 'bar-weak', barLength: '20%' }, //red
                    { label: gt('Password strength: Weak'), color: 'bar-weak', barLength: '40%' }, //red
                    { label: gt('Password strength: Good'), color: 'bar-good', barLength: '60%' }, //orange
                    { label: gt('Password strength: Strong'), color: 'bar-strong', barLength: '80%' }, //green
                    { label: gt('Password strength: Very strong'), color: 'bar-strong', barLength: '100%' }, //green
                    { label: gt('Password strength: Legendary!'), color: 'bar-legendary', barLength: '100%' } //golden
                ];
            if (isGuest) {
                buttonText = settings.get('password/emptyCurrent') ? gt('Add login password') : gt('Change login password');
            }
            new ModalDialog({ async: true, width: 500, title: isGuest ? buttonText : gt('Change password') })
            .build(function () {
                //#. %1$s are some example characters
                //#, c-format
                var hintText = gt('Your password is more secure if it also contains capital letters, numbers, and special characters like %1$s', regexText);
                if (maxLength) {
                    //#. %1$s is the minimum password length
                    //#. %2$s is the maximum password length
                    //#, c-format
                    hintText = gt('Password length must be between %1$d and %2$d characters.', minLength, maxLength) + '<br>' + hintText;
                } else {
                    //#. %1$s is the minimum password length
                    //#, c-format
                    hintText = gt('Minimum password length is %1$d.', minLength) + '<br>' + hintText;
                }
                var pwContainer = [];
                if (showStrength) {
                    strengthBarWrapper = $('<div>').hide().append(
                        strengthLabel = $('<label class="password-change-label">'),
                        $('<div class="progress">').append(
                            strengthBar = $('<div class="progress-bar password-strength-bar">')
                        )
                    );
                    pwContainer = [strengthBarWrapper, $('<div class=password-hint-container>').append(hintText)];
                }

                var currentPasswordString = gt('Your current password'),
                    guid = _.uniqueId('form-control-label-');

                this.$body.append(
                    $('<label class="password-change-label">').attr('for', guid).text(currentPasswordString).toggle(!(isGuest && settings.get('password/emptyCurrent'))),
                    oldPass = $('<input type="password" class="form-control current-password">').attr({ 'id': guid, autocomplete: 'new-password' }).toggle(!(isGuest && settings.get('password/emptyCurrent'))),

                    $('<label class="password-change-label">').attr('for', guid = _.uniqueId('form-control-label-')).text(gt('New password')),
                    newPass = $('<input type="password" class="form-control new-password">').attr({ 'id': guid, autocomplete: 'new-password' }),

                    $('<label class="password-change-label">').attr('for', guid = _.uniqueId('form-control-label-')).text(gt('Repeat new password')),
                    newPass2 = $('<input type="password" class="form-control repeat-new-password">').attr({ 'id': guid, autocomplete: 'new-password' }),

                    pwContainer,
                    $('<div class="alert alert-info">').css('margin', '14px 0').css('max-height', '500px').text(
                        gt('If you change the password, you will be signed out. Please ensure that everything is closed and saved.')
                    ).toggle(!isGuest)
                );
                if (showStrength) newPass.on('keyup', updateStrength);

            })
            .addCancelButton()
            .addButton({ label: buttonText, action: 'change' })
            .on('change', function () {

                // we change empty string to null to be consistent
                var dialog = this,
                    node = dialog.$body,
                    newPassword1 = newPass.val() === '' ? null : newPass.val(),
                    newPassword2 = newPass2.val() === '' ? null : newPass2.val(),
                    oldPassword = oldPass.val() === '' ? null : oldPass.val();

                // current state: middlware allows empty passwords for guests ONLY
                if (!isGuest && newPassword1 === null) {
                    yell('warning', gt('Your new password may not be empty.'));
                    dialog.idle();
                    newPass.focus();
                    dialog = null;
                    return;
                }

                if (newPassword1 !== newPassword2) {
                    yell('warning', gt('The two newly entered passwords do not match.'));
                    dialog.idle();
                    newPass2.focus();
                    dialog = null;
                    return;
                }

                http.PUT({
                    module: 'passwordchange',
                    params: { action: 'update' },
                    appendColumns: false,
                    data: {
                        old_password: oldPassword,
                        new_password: newPassword1
                    }
                })
                .done(function () {
                    node.find('input[type="password"]').val('');
                    dialog.close();
                    dialog = null;
                    //no need to logut guests
                    if (!isGuest) {
                        main.logout();
                        return;
                    }
                    settings.set('password/emptyCurrent', newPassword1 === null);
                })
                .fail(function (error) {
                    yell(error);
                    dialog.idle();
                    oldPass.focus();
                    dialog = null;
                });
            })
            .on('show', function () {
                oldPass.focus();
            }).open();

            //returns the strength of a password
            function strengthtest(pw) {
                //length test
                // between min and max length
                if (pw.length >= minLength && (pw.length <= maxLength || maxLength === 0)) {
                    // lower case +1; upper case +1; numbers +1; special chars +1
                    var score = 2 + /[a-z]/.test(pw) + /[A-Z]/.test(pw) + /[0-9]/.test(pw) + (new RegExp(pwRegex, 'i')).test(pw),
                        // (>6)-->2, (6-7)-->4,(8-9)-->5, (>10)-->6 or more
                        maxScore = 2 + Math.floor((Math.max(0, pw.length - 4) / 2)) + (pw.length >= 6 ? 1 : 0);
                    //legendary test for truly awesome passwords
                    if (score === 6 && pw.length > 99) {
                        //really legendary
                        score = 7;
                    }

                    score = Math.min(score, maxScore);
                    if (oldScore !== score) {
                        yell('screenreader', pwStrengths[score].label);
                    }
                    oldScore = score;
                    return pwStrengths[score];
                } else if (maxLength === 0) {
                    if (oldScore !== 0) {
                        yell('screenreader', pwStrengths[0].label);
                    }
                    oldScore = 0;
                    // to short with no maxlength
                    return pwStrengths[0];
                }
                if (oldScore !== 1) {
                    yell('screenreader', pwStrengths[1].label);
                }
                oldScore = 1;
                // to short or to long
                return pwStrengths[1];
            }

            //tests the password and draws the bar
            function updateStrength() {
                if (newPass.val() === '') {
                    strengthBarWrapper.slideUp();
                } else {
                    var result = strengthtest(newPass.val());
                    strengthLabel.text(result.label);
                    //cleanup
                    strengthBar.removeClass('bar-weak bar-good bar-strong bar-legendary')
                        .addClass(result.color).css('width', result.barLength);
                    strengthBarWrapper.slideDown();
                }
            }
        });
    }

    ext.point('io.ox/portal/widget/userSettings').extend({

        title: gt('User data'),

        preview: function () {
            var content = $('<div class="content">');
            if (internalUserEdit) {
                content.append(
                    // user data
                    $('<button class="action" type="button">').text(gt('My contact data'))
                    .on('click keypress', { fn: changeUserData }, keyClickFilter)

                );
            }
            // password
            // check for capability
            if (passwordEdit) {
                content.append(
                    $('<button class="action" type="button">').text(gt('My password'))
                    .on('click keypress', { fn: changePassword }, keyClickFilter)
                );
            }
            this.append(content);
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
