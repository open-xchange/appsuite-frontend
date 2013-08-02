/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/preview/app/mailactions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/office/preview/app/actionshelper',
     'gettext!io.ox/office/main'
    ], function (ext, links, ActionsHelper, gt) {

    'use strict';

    ActionsHelper.createViewerAction('io.ox/mail/actions/office/view', function (baton) {
        return {
            source: 'mail',
            folder_id: baton.data.mail.folder_id,
            id: baton.data.mail.id,
            attached: baton.data.id,
            filename: baton.data.filename
        };
    });

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'office_view',
        index: 250,
        label: gt('View'),
        ref: 'io.ox/mail/actions/office/view'
    }));

    // disable 'Preview' and 'Open in browser' actions defined by OX Mail
    ActionsHelper.disableActionForViewable('io.ox/mail/actions/preview-attachment');
    ActionsHelper.disableActionForViewable('io.ox/mail/actions/open-attachment');

});
