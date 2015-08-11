/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/http_errors', ['io.ox/core/http', 'gettext!io.ox/core'], function (http, gt) {

    'use strict';

    // inject into http once the translations are available
    http.messages = {
        //#. generic error message
        generic: gt('An unknown error occurred'),
        //#. error message when offline
        offline: gt('Cannot connect to server. Please check your connection.')
    };
});
