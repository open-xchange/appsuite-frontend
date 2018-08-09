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
 * @author Greg Hill <greg.hill@open-xchange.com>
 */

define('io.ox/multifactor/settings/views/addMultifactorView', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/core/yell',
    'io.ox/multifactor/api',
    'gettext!io.ox/core/boot',
    'less!io.ox/multifactor/style',
    'io.ox/multifactor/lib/u2f-api'
], function (views, ext, mini, ModalView, yell, api, gt) {

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
            title: backup ? gt('Add a recovery device') : gt('Add Multifactor Device'),
            width: 640,
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
            render: function () {
                var label = $('<label class="backupDescr">').append(gt('In the event you lose or are unable to use your authentication device, your account will be locked out unless you set up a backup device.  We strongly recommend that you do so now.'))
                .append('<br>');
                this.$body.append(
                    label
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'header',
            render: function (baton) {
                var label = $('<label>').append(
                    baton.model.get('backup') ? gt('Please select a backup device to add') : gt('Please select a device type to add'))
                .append('<br>');
                this.$body.append(
                    label
                );
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
                providers.forEach(function (provider) {
                    node.$body.append(getProviderSelection(provider, baton.model.get('backup')));
                });
            }
        }

    );

    function getProviderSelection(provider, backup) {
        var icon;
        var text;
        switch (provider.name) {
            case 'SMS':
                icon = 'fa-mobile';
                text = gt('Recieve a text message with a number pin');
                break;
            case 'EXAMPLE-MFA':
                icon = 'fa-id-card';
                text = gt('An example provider');
                break;
            case 'WEB-AUTH':
                text = gt('Use a FIDO2 compatible device to authenticate your identity.');
                icon = 'fa-microchip';
                break;
            case 'U2F':
                text = gt('Use a U2F device');
                icon = 'fa-microchip';
                break;
            case 'YUBIKEY':
                text = gt('Use Yubikey\'s One Time Password System');
                icon = 'fa-id-badge';
                break;
            case 'TOTP':
                text = gt('Use Google Authenticator or other TOTP compatible authenticator');
                icon = 'fa-google';
                break;
            case 'BACKUP_STRING':
                text = gt('Long recovery code that you print or save to unlock your account');
                icon = 'fa-file-text';
                break;
            default:
                text = gt('Unknown system');
                icon = 'fa-error';
        }
        var div = $('<div class="multifactordevice">');
        div.on('click', function (e) {
            addDevice(provider.name, backup);
            e.preventDefault();
        });
        var link = $('<a href="#" class="multifactorDivLink">');
        var table = $('<table class="multifactorDeviceTable">');
        var tr = $('<tr>');
        var iconCol = $('<td class="multifactorIcon">').append('<icon class="fa ' + icon + '">');
        var textCol = $('<td class="multifactorText">').append(text);
        return (div.append(link.append(table.append(tr.append(iconCol).append(textCol)))));

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
