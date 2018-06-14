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
    function createTable(icon, type, device) {
        var div = $('<div class="multifactordevice">')
        .attr('data-deviceId', device.id)
        .attr('data-deviceName', device.name)
        .attr('data-provider', device.provider.name)
        .on('click', function (e) {
            e.preventDefault();
            $('.multifactordevice').removeClass('selected');
            div.addClass('selected');
        });
        var link = $('<a href="#" class="multifactorDivLink" aria-label="' + device.name + '">');
        var table = $('<table class="multifactorDeviceTable">');
        var row = $('<tr>');
        var iconCol = $('<td class="multifactorIcon">').append('<icon class="fa ' + icon + '">');
        var textCol = $('<td class="multifactorText">').append(type);
        var detailCol = $('<td class="multifactorDetail">').append(gt('Name:') + device.name).append('<br/>').append(gt('ID:') + device.id);
        return div.append(
            link.append(table.append(
                row.append(iconCol).append(textCol).append(detailCol))));

    }

    // Create Table entry based on provider type
    function getDeviceTable(device) {
        switch (device.provider.name) {
            case 'SMS':
                return createTable('fa-mobile', gt('SMS Text Messaging'), device);
            case 'EXAMPLE-MFA':
                return createTable('fa-mobile', 'Example MFA', device);
            case 'U2F':
                return createTable('fa-microchip', gt('U2F'), device);
            case 'YUBIKEY':
                return createTable('fa-id-badge', gt('Yubikey'), device);
            case 'TOTP':
                return createTable('fa-google', gt('Google Authenticator'), device);
            default:
                return $('<span>').append(gt('UNKNOWN'));
        }
    }

    var renderer = {
        render: function (devices) {
            var div = $('<div>').addClass('MultifactorDiv');
            devices.forEach(function (device) {
                div.append(getDeviceTable(device));
            });
            return div;
        }
    };

    return renderer;

});
