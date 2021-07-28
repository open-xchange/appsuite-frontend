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

define('io.ox/multifactor/factorRenderer', [
    'gettext!io.ox/core/boot',
    'io.ox/core/extensions',
    'io.ox/multifactor/views/constants',
    'less!io.ox/multifactor/style',
    'less!io.ox/backbone/mini-views/settings-list-view'
], function (gt, ext, constants) {
    'use strict';

    var duplicates = {};

    // Create table entry for the device
    function createLi(iconType, type, device, deletable) {
        var li = $('<li class="settings-list-item multifactordevice">')
        .attr('data-deviceId', device.id)
        .attr('data-deviceName', device.name)
        .attr('data-provider', device.providerName)
        .attr('title', type);
        var icon = $('<i class="fa ' + iconType + ' mfIcon">').attr('aria-label', type);
        var textSpan = $('<span>').addClass(deletable ? 'mfText' : 'mfTextWide').append(type);
        var nameSpan = $('<span class="mfName">').text(device.name);
        if (!deletable) {
            li.addClass('multifactordeviceSelectable');
        }
        var editCol = deletable ? $('<a href="#" class="action mfEdit">').attr('title', gt('Edit')).append(gt('Edit')) : '';
        var deleteCol = deletable ? $('<a href="#" class="action mfDelete">').attr('aria-label', gt('Delete')).append($('<i class="fa fa-trash-o" aria-hidden="true">').attr('title', gt('Delete'))) : '';
        return li.append(icon).append(textSpan).append(nameSpan).append(editCol).append(deleteCol);

    }

    // Create Table entry based on provider type
    function getDeviceLi(device, selectable) {
        switch (device.providerName) {
            case constants.SMS:
                return createLi(constants.SMS_ICON, gt('SMS Code'), device, selectable);
            case 'WEB-AUTH':
                return createLi('fa-microchip', gt('Web auth'), device, selectable);
            case constants.U2F:
                if (!window.u2f && !selectable) {
                    console.log('U2F not compatible with this browser');
                    return;  //  If browser not compatible, and being used for auth, then don't display
                }
                if (!selectable && duplicates.u2f) return;  // Only display one u2f device when authenticating
                duplicates.u2f = true;
                return createLi(constants.U2F_ICON, gt('Security Token'), device, selectable);
            case 'YUBIKEY':
                return createLi('fa-id-badge', gt('Yubikey'), device, selectable);
            case constants.TOTP:
                return createLi(constants.TOTP_ICON, gt('Google Authenticator'), device, selectable);
            case constants.BACKUP:
                return createLi(constants.BACKUP_ICON, gt('Recovery code'), device, selectable);
            default:
                var baton = new ext.Baton();
                ext.point('io.ox/multifactor/device/' + device.providerName).invoke('render', this, baton);
                if (baton.data.text) {
                    return createLi(baton.data.icon, baton.data.text, device, selectable);
                }
                // what's the purpose of this string? removed gt call for
                // this
                return $('<span>').append('UNKOWN');
        }
    }

    function doRender(devices, deletable) {
        duplicates = {};
        var div = $('<div class="MultifactorDiv">');
        var ul = $('<ul class="list-group list-unstyled settings-list-view">');
        devices.forEach(function (device) {
            ul.append(getDeviceLi(device, deletable));
        });
        return div.append(ul);
    }

    var renderer = {
        renderDeletable: function (devices) {
            return doRender(devices, true);
        },
        renderList: function (devices) {
            return doRender(devices, false);
        }
    };

    return renderer;

});
