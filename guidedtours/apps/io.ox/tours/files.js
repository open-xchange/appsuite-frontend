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
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'gettext!io.ox/tours'
], function (ext, notifications, gt) {

    'use strict';

    /* Tour: Files / Infostore */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/files',
        app: 'io.ox/files',
        priority: 1,
        tour: {
            id: 'Files',
            steps: [{
                title: gt('Folder tree'),
                placement: 'right',
                target: function () { return $('.foldertree-container:visible')[0]; },
                content: gt('Use the folder tree to access own, public or shared files. If the folder tree is hidden, click on View > Folder view on the right side of the toolbar.')
            },
            {
                title: gt('Selecting a view'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('To select one of the views List, Icons or Squares, click on View on the right side of the toolbar.')
            },
            {
                title: gt('The List view'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('The List view shows details like the size and date of change. Use the checkboxes to select files. Click on a file to view further details and functions in the pop-up.')
            },
            {
                title: gt('The Icons view'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('The Icons view displays an icon and the file name for each file. Click on an icon to view further details and functions in the pop-up.')
            },
            {
                title: gt('The Tiles view'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('The Tiles view shows a big icon for each file. Click on an icon to view further details and functions in the pop-up.')
            },
            {
                onShow: function () {
                    if ($('.toolbar-button.dropdown.open .dropdown-menu').length === 0) {
                        $('[data-ref="io.ox/files/dropdown/new"]').click();
                    }
                },
                title: gt('Uploading a file'),
                placement: 'right',
                target: function () { return $('[data-ref="io.ox/files/dropdown/new"]')[0]; },
                /*target: function () { return $('[data-action="io.ox/files/actions/upload"]')[0]; },*/
                content: gt('To upload a file, click on New > Upload new file in the toolbar.')
            },
            {
                onShow: function () {
                    if ($('.toolbar-button.dropdown.open .dropdown-menu').length === 0) {
                        $('[data-ref="io.ox/files/dropdown/new"]').click();
                    }
                },
                title: gt('Creating a note'),
                placement: 'right',
                target: function () { return $('[data-ref="io.ox/files/dropdown/new"]')[0]; },
                content: gt('To create a note, click on New > Add note in the toolbar.')
            },
            {
                title: gt('Slideshow'),
                placement: 'bottom',
                target: function () { return $('[data-ref="io.ox/files/icons/slideshow"]:visible')[0]; },
                content: gt('If a folder contains images, you can display a slideshow. To do so click the View slideshow icon in the toolbar.')
            },
            {
                title: gt('Displaying information'),
                placement: 'bottom',
                target: function () { return $('.file-cell')[0]; },
                content: gt('To view further information, click on a file. A pop-up window displays further details and functions.')
            }]
        }
    });
});
