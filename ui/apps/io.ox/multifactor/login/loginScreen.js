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

define('io.ox/multifactor/login/loginScreen', ['io.ox/core/extensions',
    'io.ox/core/main/appcontrol', 'io.ox/core/main/icons', 'io.ox/core/api/apps'
], function (ext) {

    'use strict';

    var login = {
        create: function () {
            var topbar = $('#io-ox-appcontrol');
            ext.point('io.ox/core/appcontrol').invoke('draw', topbar);
            $('#io-ox-core').show();
        },
        destroy: function () {
            $('#io-ox-appcontrol').empty();
        }
    };

    return login;

});
