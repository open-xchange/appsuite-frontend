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
        LostButton: gt('I lost my device'),
        OKButton: gt('Proceed'),
        CancelButton: gt('Cancel'),
        AuthenticationTitle: gt('Second Factor Authentication'),
        AuthDialogClass: _.device('small') ? 'multifactorAuthMobile' : 'multifactorAuth'
    };

    return constants;

});
