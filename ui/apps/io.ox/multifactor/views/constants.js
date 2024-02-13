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

define('io.ox/multifactor/views/constants', [
    'gettext!io.ox/core/boot'
], function (gt) {

    'use strict';

    var constants = {
        // Buttons
        LostButton: gt('I lost my device'),
        OKButton: gt('Next'),
        CancelButton: gt('Cancel'),
        AuthenticationTitle: gt('2-Step Verification'),
        ReAuthenticationTitle: gt('Reauthentication required for this action'),
        SelectDeviceTitle: gt('Select 2-Step Verification Method'),
        AuthDialogClass: _.device('small') ? 'multifactorAuthMobile' : 'multifactorAuth',
        // MF Devices
        U2F: 'U2F',
        U2F_ICON: 'fa-microchip',
        SMS: 'SMS',
        SMS_ICON: 'fa-mobile',
        TOTP: 'TOTP',
        TOTP_ICON: 'fa-google',
        BACKUP: 'BACKUP_STRING',
        BACKUP_ICON: 'fa-file-text-o'
    };

    return constants;

});
