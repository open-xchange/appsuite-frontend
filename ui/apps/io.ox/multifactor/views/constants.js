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
        ReAuthenticationTitle: gt('Re-Authentication required for this action'),
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
