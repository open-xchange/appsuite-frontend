/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 *
 */

define('io.ox/files/actions/basic-authentication-account', [
    'io.ox/backbone/views/modal',
    'io.ox/core/yell',
    'gettext!io.ox/files',
    'io.ox/core/api/filestorage',
    'io.ox/core/extensions'
], function (ModalDialog, yell, gt, filestorageApi, ext) {

    'use strict';

    function createNonOauthAccount(action, service) {
        var def = $.Deferred(),
            baton = ext.Baton({});

        function collectValues(dialog) {
            return {
                newDisplayname: dialog.$body.find('.add-storage-account-displayname').val(),
                newUsername: dialog.$body.find('.add-storage-account-login').val(),
                newPassword: dialog.$body.find('.add-storage-account-password').val(),
                newUrl: dialog.$body.find('.add-storage-account-url').val()
            };
        }

        ext.point('io.ox/files/add-account/wizard').extend({
            id: 'displayname',
            index: 100,
            draw: function () {
                var input, self = this;
                this.append(
                    $('<div class="form-group">').append(
                        $('<label for="add-storage-account-displayname">').text(gt('Display name')),
                        input = $('<input id="add-storage-account-displayname" type="text" class="form-control add-storage-account-displayname" autocomplete="section-addAccount new-displayname">') //??
                    )
                );

                input.on('change', function () { //?
                    var alert = self.find('.alert');
                    if (alert.length && alert.attr('errorAttributes').indexOf('displayname') !== -1) {
                        alert.remove();
                    }
                });
            }
        });

        ext.point('io.ox/files/add-account/wizard').extend({
            id: 'login',
            index: 100,
            draw: function () {
                var input, self = this;
                this.append(
                    $('<div class="form-group">').append(
                        $('<label for="add-storage-account-login">').text(gt('Your user name')),
                        input = $('<input id="add-storage-account-login" type="text" class="form-control add-storage-account-login" autocomplete="section-addAccount new-username">') //??
                    )
                );

                input.on('change', function () { //?
                    var alert = self.find('.alert');
                    if (alert.length && alert.attr('errorAttributes').indexOf('login') !== -1) {
                        alert.remove();
                    }
                });
            }
        });

        ext.point('io.ox/files/add-account/wizard').extend({
            id: 'password',
            index: 200,
            draw: function () {
                var input, self = this;
                this.append(
                    $('<div class="form-group">').append(
                        $('<label for="add-storage-account-password">').text(gt('Your password')),
                        input = $('<input id="add-storage-account-password" type="password" class="form-control add-storage-account-password" autocomplete="section-addAccount new-password">')
                    )
                );

                input.on('change', function () {
                    var alert = self.find('.alert');
                    if (alert.length && alert.attr('errorAttributes').indexOf('password') !== -1) {
                        alert.remove();
                    }
                });
            }
        });

        ext.point('io.ox/files/add-account/wizard').extend({
            id: 'url',
            index: 200,
            draw: function () {
                var input, self = this;
                this.append(
                    $('<div class="form-group">').append(
                        $('<label for="add-storage-account-url">').text(gt('Your url')),
                        input = $('<input id="add-storage-account-url" type="text" class="form-control add-storage-account-url" autocomplete="section-addAccount new-url">')
                    )
                );

                input.on('change', function () {
                    var alert = self.find('.alert');
                    if (alert.length && alert.attr('errorAttributes').indexOf('url') !== -1) {
                        alert.remove();
                    }
                });
            }
        });

        ext.point('io.ox/files/add-account/wizard').extend({
            id: 'security-hint',
            index: 300,
            draw: function () {
                if (window.location.protocol !== 'https:') return;
                this.append($('<div class="help-block">').text(gt('Your credentials will be sent over a secure connection only')));
            }
        });

        ext.point('io.ox/files/add-account/wizard').extend({
            id: 'feedback',
            index: 1000000000000,
            draw: function () {
                this.append(
                    $('<div class="alert-placeholder">')
                );
            }
        });

        new ModalDialog({
            model: new Backbone.Model(),
            title: gt('Add storage account'),
            enter: action === 'create' ? 'add' : 'update',
            async: true
        })
        .build(function () {
            baton.popup = this;
            // invoke extensions
            ext.point('io.ox/files/add-account/wizard').invoke('draw', this.$body, baton);

            if (action === 'update') {
                this.$body.find('.add-storage-account-displayname').val(service.get('displayName'));
                this.$body.find('.add-storage-account-login').val(service.get('configuration').login);
                this.$body.find('.add-storage-account-password').val(service.get('configuration').password);
                this.$body.find('.add-storage-account-url').val(service.get('configuration').url);
            }
        })
        .addCancelButton()
        .addButton(action === 'create' ? { label: gt('Add'), action: 'add' } : { label: gt('Update'), action: 'update' })
        .on('add', function () {
            var values = collectValues(this),
                createOptions = {
                    'filestorageService': service.get('id'),
                    'displayName': values.newDisplayname,
                    'configuration': {
                        'login': values.newUsername,
                        'password': values.newPassword,
                        'url': values.newUrl
                    }
                };

            return filestorageApi.createAccount(createOptions)
                .then(function () {
                    def.resolve();
                    baton.popup.close();
                    yell('success', gt('Account added successfully'));
                });

        })
        .on('update', function () {

            var values = collectValues(this),
                updateOptions = {
                    'id': service.get('id'),
                    'filestorageService': service.get('filestorageService'),
                    'displayName': values.newDisplayname,
                    'configuration': {
                        'login': values.newUsername,
                        'password': values.newPassword,
                        'url': values.newUrl
                    }
                };
            return filestorageApi.updateAccount(updateOptions)
                .then(function () {
                    def.resolve();
                    baton.popup.close();
                    yell('success', gt('Account updated successfully'));
                });

        })
        .on('open', function () {
            var self = this;
            this.$footer.find('[data-action="add"]').prop('disabled', true);
            this.$body.on('keyup', 'input', function () {
                var values = [];
                _.each(self.$el.find('input'), function (el) {
                    if (el.value !== '') {
                        values.push(el.value);
                    }
                });
                if (values.length === 4) {
                    self.$footer.find('[data-action="add"]').prop('disabled', false);
                } else {
                    self.$footer.find('[data-action="add"]').prop('disabled', true);
                }
            });
        })
        .open();
        return def;
    }

    return createNonOauthAccount;
});
