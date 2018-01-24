/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Jonas Regier <jonas.regier@open-xchange.com>
 */

define('io.ox/files/contextmenu', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/actions',
    'io.ox/backbone/mini-views/abstract',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/contextmenu-utils',
    'io.ox/core/collection',
    'gettext!io.ox/core',
    'io.ox/files/share/toolbar'
], function (ext, extAction, AbstractView, Dropdown, ContextUtils, Collection, gt) {

    'use strict';

    // ======  context menu definition ======

    // default/outside-list file context menu definition
    ext.point('io.ox/files/listview/contextmenu').extend(
        {
            id: 'addfolder',
            index: 1000,
            ref: 'io.ox/files/actions/add-folder',
            section: '5',
            label: gt('Add folder')
        }
    );

    // myshares file context menu definition
    ext.point('io.ox/files/share/myshares/listview/contextmenu').extend(
        {
            id: 'permissions',
            index: 1000,
            ref: 'io.ox/files/actions/permissions',
            section: '10',
            label: gt('Edit share')
        },
        {
            id: 'show-in-folder',
            index: 1100,
            ref: 'io.ox/files/actions/show-in-folder',
            section: '20',
            label: gt('Show in Drive')
        },
        {
            id: 'revoke-access',
            index: '1200',
            ref: 'io.ox/files/share/revoke',
            section: '30',
            label: gt('Revoke access')
        }
    );

    // default file context menu definition
    ext.point('io.ox/files/listview/contextmenu').extend(

        {
            id: 'viewer',
            index: 1000,
            ref: 'io.ox/files/actions/viewer',
            section: '10',
            label: gt('View')
        },
        {
            id: 'download',
            index: 1100,
            ref: 'io.ox/files/actions/download',
            section: '10',
            label: gt('Download')
        },
        {
            id: 'downloadfolder',
            index: 1200,
            ref: 'io.ox/files/actions/download-folder',
            section: '10',
            label: gt('Download')
        },
        {
            id: 'add-favorite',
            index: 1200,
            ref: 'io.ox/files/favorites/add',
            section: '20',
            label: gt('Add to favorites')
        },
        {
            id: 'remove-favorite',
            index: 1200,
            ref: 'io.ox/files/favorites/remove',
            section: '20',
            label: gt('Remove from favorites')
        },
        {
            id: 'invite',
            index: 1300,
            ref: 'io.ox/files/actions/invite',
            section: '30',
            label: gt('Invite people')
        },
        {
            id: 'getalink',
            index: 1400,
            ref: 'io.ox/files/actions/getalink',
            section: '30',
            label: gt('Create sharing link')
        },
        {
            id: 'rename',
            index: 1500,
            ref: 'io.ox/files/actions/rename',
            section: '40',
            label: gt('Rename')
        },
        {
            id: 'move',
            index: 1600,
            ref: 'io.ox/files/actions/move',
            section: '40',
            label: gt('Move')
        },
        {
            id: 'copy',
            index: 1700,
            ref: 'io.ox/files/actions/copy',
            section: '40',
            label: gt('Copy')
        },
        {
            id: 'saveaspdf',
            index: 1800,
            ref: 'io.ox/files/actions/save-as-pdf',
            section: '50',
            label: gt('Save as PDF')
        },
        {
            id: 'send',
            index: 1700,
            ref: 'io.ox/files/actions/send',
            section: '50',
            label: gt('Send by mail')
        },
        {
            id: 'delete',
            index: 1900,
            ref: 'io.ox/files/actions/delete',
            section: '60',
            label: gt('Delete')
        },
        {
            id: 'show-in-folder',
            index: 1100,
            ref: 'io.ox/files/actions/show-in-folder',
            section: '20',
            label: gt('Show in Drive')
        }
    );

});
