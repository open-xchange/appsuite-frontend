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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/mail/actions/addToPortal', [
    'io.ox/core/notifications',
    'io.ox/portal/widgets',
    'gettext!io.ox/mail'
], function (notifications, widgets, gt) {

    'use strict';

    return function (baton) {
        var data = baton.first();
        // using baton.data.parent if previewing during compose (forward mail as attachment)
        widgets.add('stickymail', {
            plugin: 'mail',
            props: $.extend({
                id: data.id,
                folder_id: data.folder_id,
                title: data.subject ? data.subject : gt('No subject')
            }, data.parent || {})
        });
        notifications.yell('success', gt('This email has been added to the portal'));
    };
});
