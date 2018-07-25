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
    'gettext!multifactor',
    'less!io.ox/multifactor/style'
], function (gt) {
    'use strict';

    // Create table entry for the device
    function createTable(icon, type, device, selectable) {
        var div = $('<div class="multifactordevice">')
        .attr('data-deviceId', device.id)
        .attr('data-deviceName', device.name)
        .attr('data-provider', device.provider.name)
        .on('click', function (e) {
            e.preventDefault();
            if (!selectable) {
                $('.multifactordevice').removeClass('selected');
                div.addClass('selected');
            }
        });
        if (!selectable) div.addClass('multifactordeviceSelectable');
        var link = $('<a href="#" class="multifactorDivLink" aria-label="' + device.name + '">');
        var table = $('<table class="multifactorDeviceTable">');
        var row = $('<tr>');
        var iconCol = $('<td class="multifactorIcon">').append('<icon class="fa ' + icon + '">');
        var textCol = $('<td class="multifactorText">').append(type);
        var detailCol = $('<td class="multifactorDetail">');
        if (device.name && device.name.length > 1) {
            detailCol.append(device.name);
        }
        return div.append(
            link.append(table.append(
                row.append(iconCol).append(textCol).append(detailCol))));

    }

    // Create Table entry based on provider type
    function getDeviceTable(device, selectable) {
        switch (device.provider.name) {
            case 'SMS':
                return createTable('fa-mobile', gt('SMS Text Messaging'), device, selectable);
            case 'EXAMPLE-MFA':
                return createTable('fa-id-card', 'Example MFA', device, selectable);
            case 'WEB-AUTH':
                return createTable('fa-microchip', gt('U2F'), device, selectable);
            case 'YUBIKEY':
                return createTable('fa-id-badge', gt('Yubikey'), device, selectable);
            case 'TOTP':
                return createTable('fa-google', gt('Google Authenticator'), device, selectable);
            case 'BACKUP_STRING':
                return createTable('fa-file-text', gt('Recovery code'), device, selectable);
            default:
                return $('<span>').append(gt('UNKNOWN'));
        }
    }

    function doRender(devices, selectable) {
        var div = $('<div>').addClass('MultifactorDiv');
        devices.forEach(function (device) {
            div.append(getDeviceTable(device, selectable));
        });
        return div;
    }

    var renderer = {
        renderSelectable: function (devices) {
            return doRender(devices, false);
        },
        renderList: function (devices) {
            return doRender(devices, true);
        }
    };

    return renderer;

});
