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
    'less!io.ox/multifactor/style',
    'io.ox/multifactor/lib/u2f-api'
], function (gt) {
    'use strict';

    // Create table entry for the device
    function createTable(iconType, type, device, deletable) {
        var div = $('<div class="multifactordevice">')
        .attr('data-deviceId', device.id)
        .attr('data-deviceName', device.name)
        .attr('data-provider', device.provider.name);
        var named = device.name && device.name !== '';
        if (!deletable) div.addClass('multifactordeviceSelectable');
        var table = $('<table class="multifactorDeviceTable">')
            .attr('summary', gt('Multifactor Device of type %s. ', type) + (named ? gt('Device name %s', device.name) : ''));
            //.append($('<caption style="left:-300px; position:absolute">').append((named ? device.name : type)));
        var row = $('<tr>');
        var icon = $('<icon class="fa ' + iconType + '">').attr('aria-label', type);
        var iconCol = $('<td class="multifactorIcon">').append(icon);
        var textCol = $('<td class="multifactorText">').append(type);
        var detailCol = $('<td class="multifactorDetail">');
        if (device.name && device.name.length > 1) {
            detailCol.append(device.name);
        }
        var editCol = deletable ? $('<td class="multifactorEdit">').append(
            $('<a href="#">').attr('aria-label', gt('Edit Name')).append('<icon class="fa fa-pencil">')) : '';
        var deleteCol = deletable ? $('<td class="multifactorDelete">').append(
            $('<a href="#">').attr('aria-label', gt('Delete')).append('<icon class="fa fa-trash-o">')) : '';
        return div.append(
            table.append(
                row.append(iconCol).append(textCol).append(detailCol).append(editCol).append(deleteCol)));

    }

    // Create Table entry based on provider type
    function getDeviceTable(device, selectable) {
        switch (device.provider.name) {
            case 'SMS':
                return createTable('fa-mobile', gt('SMS Text Messaging'), device, selectable);
            case 'EXAMPLE-MFA':
                return createTable('fa-id-card', 'Example MFA', device, selectable);
            case 'WEB-AUTH':
                return createTable('fa-microchip', gt('Web auth'), device, selectable);
            case 'U2F':
                if (!window.u2f && !selectable) {
                    console.log('U2F not compatible with this browser');
                    return;  //  If browser not compatible, and being used for auth, then don't display
                }
                if (!selectable) device.name = '';  //  U2F devices grouped together.  We don't want to specify device names unless deleting/etc
                return createTable('fa-microchip', gt('U2F'), device, selectable);
            case 'YUBIKEY':
                return createTable('fa-id-badge', gt('Yubikey'), device, selectable);
            case 'TOTP':
                return createTable('fa-google', gt('Google Authenticator'), device, selectable);
            case 'BACKUP_STRING':
                return createTable('fa-file-text-o', gt('Recovery code'), device, selectable);
            default:
                return $('<span>').append(gt('UNKNOWN'));
        }
    }

    function doRender(devices, deletable) {
        var div = $('<div>').addClass('MultifactorDiv');
        devices.forEach(function (device) {
            div.append(getDeviceTable(device, deletable));
        });
        return div;
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
