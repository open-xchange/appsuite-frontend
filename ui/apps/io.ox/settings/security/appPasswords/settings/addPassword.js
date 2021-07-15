/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/settings/security/appPasswords/settings/addPassword', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/core/yell',
    'io.ox/core/settings/util',
    'io.ox/core/capabilities',
    'io.ox/core/api/appPasswordApi',
    'gettext!io.ox/core',
    'less!io.ox/settings/security/appPasswords/settings/style'
], function (views, ext, mini, ModalView, yell, util, capabilities, api, gt) {

    'use strict';

    var POINT = 'io.ox/settings/security/appPasswords/addDevice/',
        INDEX = 0;

    function doAdd(model) {
        var def = $.Deferred();
        if (model.get('name') && model.get('scope')) {
            require(['io.ox/core/api/appPasswordApi'], function (api) {
                var name = model.get('name');
                var scope = model.get('scope');
                api.addPassword(name, scope)
                .then(function (data) {
                    showPassword(name, data, def);
                }, function (error) {
                    require(['io.ox/core/notifications'], function (notifications) {
                        notifications.yell('error', gt('There was a problem adding the password.'));
                        console.error(error);
                    });
                });
            });
        } else {
            if (!model.get('name')) {
                $('input[name="name"]').focus();
            }
            if (!model.get('scope')) {
                $('select[name="scope"]').focus();
            }
        }
    }

    function getApplicationOptions() {
        var def = $.Deferred();
        api.getApps().then(function (apps) {
            var values = [];
            apps = apps.sort(function (a, b) {
                if (a.sort && b.sort) {
                    if (a.sort - b.sort === 0) {  // If same sort value, alphabetical
                        return a.displayName.localeCompare(b.displayName);
                    }
                    return a.sort - b.sort;
                }
                if (a.sort) return -1;  // Items with sort value take priority over those missing.
                if (b.sort) return 1;
                // Fallback alphabetical
                return a.displayName.localeCompare(b.displayName);
            });
            apps.forEach(function (app) {
                values.push({
                    label: app.displayName,
                    value: app.name
                });
            });
            def.resolve(values);
        }, function (error) {
            require(['io.ox/core/notifications'], function (notifications) {
                notifications.yell('error', gt('There was a problem getting the list of available applications from the server.'));
                console.error(error);
            });
            def.reject();
        });
        return def;
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'AppLabel',
            render: function () {
                var label = $('<div class="appAddSpan">').append(gt('To add a password, select an application to use with a new password, as well as a new descriptive name for the password.'));
                this.append(
                    label,
                    $('<br>')
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'AppSelector',
            render: function (baton) {
                if (!baton.model) {
                    baton.model = new Backbone.Model();
                }
                var placeholder = $('<div>');
                var spinner;
                this.append(
                    placeholder,
                    (spinner = $('<div>').busy())
                );
                getApplicationOptions().then(function (apps) {
                    var selector = util.compactSelect('scope', gt('Application'), baton.model, apps, { width: 6 });
                    placeholder.replaceWith(selector);
                    spinner.remove();
                }, function () {
                    spinner.remove();
                });

            }
        },
        {
            index: INDEX += 100,
            id: 'nameInput',
            render: function (baton) {
                var input = util.input('name', gt('Password name'), baton.model);
                baton.model.set('name', gt('My Phone'));
                input[1].val(gt('My Phone')).on('click', function () {
                    $(this).select();
                });
                this.append(
                    $('<div class="form-group row">').append($('<div class="col-md-6">').append(input)),
                    $('<br>')
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'Button',
            render: function (baton) {
                var button = $('<div class="form-group buttons">').append(
                    $('<button type="button" class="btn btn-primary">').append(
                        $('<i class="fa fa-plus" aria-hidden="true">'), $.txt(gt('Add new password'))
                    )
                    .on('click', function () {
                        doAdd(baton.model);
                    })
                );
                this.append(button);
            }
        }
    );

    function showPassword(app, data, def) {
        require(['io.ox/backbone/views/modal', 'io.ox/settings/security/appPasswords/settings/pane'], function (ModalDialog, list) {
            new ModalDialog({
                async: true,
                title: gt('Password Created')
            })
            .build(function () {
                var success = gt('A password was created successfully.  Please use the following settings in the application:');
                var label = $('<span for="appPassLoginInfo">').append(success);
                var loginDiv = $('<div id="appPassLoginInfo" class="login_info selectable-text">');
                var username = gt('Username: %s', data.login);
                var password = gt('Password: %s', '<span class="appPassword">' + data.password + '</span>');
                loginDiv.append(username).append('<br>').append(password);
                this.$body.append(label, loginDiv);
            })
            .addButton({ action: 'ok', label: gt('Close') })
            .on('ok', function () {
                this.close();
                def.resolve();
                list.refresh();
            })
            .open();
        });
    }


    return {
        start: open
    };

});

