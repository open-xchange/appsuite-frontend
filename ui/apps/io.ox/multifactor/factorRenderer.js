/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * @author Greg Hill <greg.hill@open-xchange.com>
 *
 * Copyright (C) 2016-2020 OX Software GmbH
 */
define('io.ox/multifactor/factorRenderer', [
    'gettext!io.ox/core/boot',
    'io.ox/core/extensions',
    'io.ox/multifactor/views/constants',
    'less!io.ox/multifactor/style',
    'less!io.ox/backbone/mini-views/settings-list-view',
    'io.ox/multifactor/lib/u2f-api'
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
                if (!selectable) device.name = '';  //  U2F devices grouped together.  We don't want to specify device names unless deleting/etc
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
                return $('<span>').append(gt('UNKNOWN'));
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
