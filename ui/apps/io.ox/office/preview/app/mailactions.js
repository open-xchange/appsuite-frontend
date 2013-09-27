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

define('io.ox/office/preview/app/mailactions', ['io.ox/office/preview/app/actionshelper'], function (ActionsHelper) {

    'use strict';

    var // the identifier of the 'View' action
        ACTION_ID = 'io.ox/mail/actions/office/view';

    // global initialization ==================================================

    // create the action to view the file attachment in OX Viewer
    ActionsHelper.createViewerAction(ACTION_ID, function (baton) {
        return {
            source: 'mail',
            folder_id: baton.data.mail.folder_id,
            id: baton.data.mail.id,
            attached: baton.data.id,
            filename: baton.data.filename
        };
    });

    // create a link in the attachment drop-down menu
    ActionsHelper.createViewerLink('io.ox/mail/attachment/links', ACTION_ID, { index: 250 });

    // disable 'Preview' and 'Open in browser' actions defined by OX Mail
    ActionsHelper.disableActionForViewable('io.ox/mail/actions/preview-attachment');
    ActionsHelper.disableActionForViewable('io.ox/mail/actions/open-attachment');

    // exports ================================================================

    return;

});
