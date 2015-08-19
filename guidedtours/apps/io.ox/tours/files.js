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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/tours/files', [
    'io.ox/core/tk/wizard',
    'gettext!io.ox/tours'
], function (Tour, gt) {

    'use strict';

    /* Tour: Files / Infostore */
    Tour.registry.add({
        id: 'default/io.ox/files',
        app: 'io.ox/files',
        priority: 1
    }, function () {
        new Tour()
        .step()
            .title(gt('Folder tree'))
            .content(gt('Use the folder tree to access own, public or shared files. If the folder tree is hidden, click on View > Folder view on the right side of the toolbar.'))
            .spotlight('.folder-tree')
            .end()
        .step()
            .title(gt('Selecting a view'))
            .content(gt('To select one of the views List, Icons or Squares, click on View on the right side of the toolbar.'))
            .spotlight('.classic-toolbar [data-dropdown=view]')
            .end()
        .step()
            .title(gt('The List view'))
            .content(gt('The List view shows details like the size and date of change. Use the checkboxes to select files. Click on a file to view further details and functions in the pop-up.'))
            .spotlight('.classic-toolbar [data-dropdown=view]')
            .end()
        .step()
            .title(gt('The Icons view'))
            .content(gt('The Icons view displays an icon and the file name for each file. Click on an icon to view further details and functions in the pop-up.'))
            .spotlight('.classic-toolbar [data-dropdown=view]')
            .end()
        .step()
            .title(gt('The Tiles view'))
            .content(gt('The Tiles view shows a big icon for each file. Click on an icon to view further details and functions in the pop-up.'))
            .spotlight('.classic-toolbar [data-dropdown=view]')
            .end()
        .step()
            .title(gt('Uploading a file'))
            .content(gt('To upload a file, click on New > Upload new file in the toolbar.'))
            .spotlight('[data-ref="io.ox/files/dropdown/new"]')
            .end()
        .step()
            .title(gt('Creating a note'))
            .content(gt('To create a note, click on New > Add note in the toolbar.'))
            .spotlight('[data-ref="io.ox/files/dropdown/new"]')
            .end()
        //TODO: add step about new viewer
        .step()
            //TODO: add information about showing the detail sidebar
            .title(gt('Displaying information'))
            .content(gt('To view further information, click on a file. A pop-up window displays further details and functions.'))
            .spotlight('.file-cell')
            .end()
        .start();
    });
});
