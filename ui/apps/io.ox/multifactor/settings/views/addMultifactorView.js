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

define('io.ox/multifactor/settings/views/addMultifactorView', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/core/yell',
    'io.ox/multifactor/api',
    'io.ox/multifactor/views/constants',
    'gettext!io.ox/core/boot',
    'less!io.ox/multifactor/style',
    'io.ox/multifactor/auth'
], function (views, ext, mini, ModalView, yell, api, constants, gt) {

    'use strict';

    var POINT = 'multifactor/settings/addMultifactor',
        INDEX = 0;

    var def;
    var dialog;

    function open(providers, backup) {
        dialog = openModalDialog(providers, backup);
        def = new $.Deferred();
        return def;
    }

    function openModalDialog(providers, backup) {

        return new ModalView({
            async: true,
            point: POINT,
            title: backup ? gt('Add Recovery Option') : gt('Add Verification Option'),
            enter: 'add',
            model: new Backbone.Model({ providers: providers, backup: backup })
        })
        .build(function () {
        })
        .on('cancel', function () {
            def.reject();
        })
        .addButton()
        .open();
    }

    ext.point(POINT).extend(
        {
            index: INDEX += 100,
            id: 'backupHelp',
            render: function (baton) {
                if (baton.model.get('backup')) {
                    var label = $('<p class="backupDescr">').append(gt('In the event you lose or are unable to use your authentication device, your account will be locked out unless you set up a recovery method. We strongly recommend that you do so now.'))
                    .append('<br>');
                    this.$body.append(
                        label
                    );
                }
            }
        },
        {
            index: INDEX += 100,
            id: 'selector',
            render: function (baton) {
                var providers = baton.model.get('providers');
                if (!providers || providers.length === 0) {
                    this.$body.append($('<div>').append(gt('No providers available')));
                    return;
                }
                var node = this;
                var ul = $('<ul class="list-group list-unstyled settings-list-view mfAddDevice">');
                providers.forEach(function (provider) {
                    ul.append(getProviderSelection(provider, baton.model.get('backup')));
                });
                node.$body.append(ul);
            }
        }

    );

    function getProviderSelection(provider, backup) {
        var icon;
        var text;
        switch (provider.name) {
            case constants.SMS:
                icon = constants.SMS_ICON;
                text = gt('Code via text message');
                break;
            case 'WEB-AUTH':
                text = gt('Use a FIDO2 compatible device to authenticate your identity.');
                icon = 'fa-microchip';
                break;
            case constants.U2F:
                if (!window.u2f || location.protocol !== 'https:') return;
                text = gt('Yubikey, Google Security Keys, or compatible FIDO device');
                icon = constants.U2F_ICON;
                break;
            case 'YUBIKEY':
                text = gt('Use Yubikey\'s One Time Password System');
                icon = 'fa-id-badge';
                break;
            case constants.TOTP:
                text = gt('Google Authenticator or compatible');
                icon = constants.TOTP_ICON;
                break;
            case constants.BACKUP:
                text = gt('Backup code to access your account.');
                icon = constants.BACKUP_ICON;
                break;
            default:
                var baton = new ext.Baton();
                ext.point('io.ox/multifactor/addDevice/' + provider.name).invoke('render', this, baton);
                if (baton.data.text) {
                    text = baton.data.text;
                    icon = baton.data.icon;
                } else {
                    text = gt('Unknown system');
                    icon = 'fa-error';
                }
        }
        var li = $('<li class="settings-list-item multifactordeviceSelectable">').attr('title', text)
        .on('click', function (e) {
            addDevice(provider.name, backup);
            e.preventDefault();
        });
        var iconCol = $('<i class="fa ' + icon + ' mfIcon">');
        var textCol = $('<span style="max-width:90%">').append(text);
        return (li.append(iconCol).append(textCol));

    }

    function addDevice(name, backup) {
        require(['io.ox/multifactor/settings/views/addDevice'], function (addDevice) {
            addDevice.start(name, def, backup);
        });
        dialog.close();
    }


    return {
        open: open
    };

});
