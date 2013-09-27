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

define('io.ox/office/preview/app/taskactions', ['io.ox/office/preview/app/actionshelper'], function (ActionsHelper) {

    'use strict';

    var // the identifier of the 'View' action
        ACTION_ID = 'io.ox/tasks/actions/office/view';

    // global initialization ==================================================

    // create the action to view the file attachment in OX Viewer
    ActionsHelper.createViewerAction(ACTION_ID, function (baton) {
        return {
            source: 'task',
            folder_id: baton.data.folder,
            id: baton.data.id,
            attached: baton.data.attached,
            module: baton.data.module,
            filename: baton.data.filename
        };
    });

    // create a link in the attachment drop-down menu
    ActionsHelper.createViewerLink('io.ox/tasks/attachment/links', ACTION_ID, { index: 250 });

    // disable 'Preview' and 'Open in browser' actions defined by OX Tasks
    ActionsHelper.disableActionForViewable('io.ox/tasks/actions/preview-attachment');
    ActionsHelper.disableActionForViewable('io.ox/tasks/actions/open-attachment');

    // exports ================================================================

    return;

});
