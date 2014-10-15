/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
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
        widgets.add('stickycontact', {
            plugin: 'contacts',
            props: {
                id: baton.data.id,
                folder_id: baton.data.folder_id,
                title: baton.data.display_name
            }
        });
        // trigger update event to get redraw of detail views
        api.trigger('update:' + _.ecid(baton.data), baton.data);
        yell('success', gt('This distribution list has been added to the portal'));
    };

});
