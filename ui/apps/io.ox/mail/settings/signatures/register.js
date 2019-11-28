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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/mail/settings/signatures/register', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'gettext!io.ox/mail'
], function (ext, capabilities, gt) {

    'use strict';

    if (!capabilities.has('guest')) {
        ext.point('io.ox/settings/pane/main/io.ox/mail').extend({
            id: 'io.ox/mail/settings/signatures',
            title: _.device('smartphone') ? gt('Signature') : gt('Signatures'),
            ref: 'io.ox/mail/settings/signatures',
            index: 200
        });
    }

});
