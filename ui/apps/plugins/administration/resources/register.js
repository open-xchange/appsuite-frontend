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

define('plugins/administration/resources/register', [
    'io.ox/core/extensions',
    'gettext!io.ox/core'
], function (ext, gt) {

    'use strict';

    ext.point('io.ox/settings/pane').extend({
        id: 'administration/resources',
        title: gt('Resources'),
        ref: 'plugins/administration/resources'
    });
});
