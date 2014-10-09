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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/mail/actions/addToPortal', [
    'io.ox/core/notifications',
    'gettext!io.ox/mail'
], function (notifications, gt) {

    'use strict';

    return function (baton) {
        require(['io.ox/portal/widgets'], function (widgets) {
            //using baton.data.parent if previewing during compose (forward mail as attachment)
            widgets.add('stickymail', {
                plugin: 'mail',
                props: $.extend({
                    id: baton.data.id,
                    folder_id: baton.data.folder_id,
                    title: baton.data.subject
                }, baton.data.parent || {})
            });
            notifications.yell('success', gt('This mail has been added to the portal'));
        });
    };

});
