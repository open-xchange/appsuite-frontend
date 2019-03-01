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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/contacts/actions/addToPortal', [
    'io.ox/portal/widgets',
    'io.ox/contacts/api',
    'io.ox/core/yell',
    'gettext!io.ox/mail'
], function (widgets, api, yell, gt) {

    'use strict';

    return function (baton) {
        var data = baton.first();
        widgets.add('stickycontact', {
            plugin: 'contacts',
            props: { id: data.id, folder_id: data.folder_id, title: data.display_name }
        });
        // trigger update event to get redraw of detail views
        api.trigger('update:' + _.ecid(data), data);
        yell('success', gt('This distribution list has been added to the portal'));
    };
});
