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
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/core/boot/warning', [
    'io.ox/core/extensions',
    'gettext!io.ox/core/boot'
], function (ext, gt) {

    'use strict';

    ext.point('io.ox/core/boot/warning').extend({
        id: 'self-xss',
        index: 100,
        draw: function () {
            if (ox.debug) return;
            var warning = gt('Warning!'),
                message = gt('This is a browser feature for developers. If you were asked to copy and paste anything here, somebody might want to take over your account. Do not enter any script code without knowing what it does.');
            console.log('%c' + warning, 'font-size: 32px; color: #df0000');
            console.log('%c' + message, 'font-size: 20px;');
        }
    });
});
