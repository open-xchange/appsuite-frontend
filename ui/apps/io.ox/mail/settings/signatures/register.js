/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/mail/settings/signatures/register', [
    'io.ox/core/extensions',
    'gettext!io.ox/mail'
], function (ext, gt) {

    'use strict';

    ext.point('io.ox/settings/pane/main/io.ox/mail').extend({
        id: 'io.ox/mail/settings/signatures',
        title: gt('Signatures'),
        ref: 'io.ox/mail/settings/signatures',
        index: 400
    });

});
