/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/files/contextmenu', ['io.ox/core/extensions', 'gettext!io.ox/core'], function (ext, gt) {

    'use strict';

    var points = {
        // favorites use the same contextmenu as main list view
        'io.ox/files/listview/contextmenu': [
            // #1
            //#. used as a verb here. label of a button to view files
            ['viewer', '10', gt('View')],
            // #2
            ['favorites/add', '20', gt('Add to favorites')],
            ['favorites/remove', '20', gt('Remove from favorites')],
            ['show-in-folder', '20', gt('Show in Drive')],
            //#3
            ['download', '30', gt('Download')],
            ['download-folder', '30', gt('Download entire folder')],
            // #4
            ['invite', '40', gt('Share / Permissions')],
            // #5
            ['rename', '50', gt('Rename')],
            ['move', '50', gt('Move')],
            ['copy', '50', gt('Copy')],
            // #6
            ['send', '60', gt('Send by email')],
            ['save-as-pdf', '60', gt('Save as PDF')],
            // #7
            ['delete', '70', gt('Delete')],
            ['restore', '70', gt('Restore')]
        ],
        'io.ox/files/share/myshares/listview/contextmenu': [
            ['editShare', '10', gt('Edit share')],
            ['show-in-folder', '10', gt('Show in Drive')],
            ['revoke', '20', gt('Revoke access')]
        ]
    };

    function layoutEnabled(baton) {
        var layoutType = this;
        return layoutType === baton.app.props.get('layout');
    }

    function viewOptionEnabled(baton) {
        var optionName = this;
        return baton.app.props.get(optionName);
    }

    // Drive context menu when clicked in free space
    ext.point('io.ox/files/listview/contextmenu/freespace').extend({
        id: 'add-folder',
        index: 10,
        section: 10,
        title: gt('Add new folder'),
        ref: 'io.ox/files/actions/add-folder'
    });

    // sharing
    ext.point('io.ox/files/listview/contextmenu/freespace').extend({
        id: 'invite',
        index: 20,
        section: 20,
        title: gt('Share / Permissions'),
        ref: 'io.ox/files/actions/invite'
    });

    ext.point('io.ox/files/listview/contextmenu/freespace').extend({
        id: 'getalink',
        index: 30,
        section: 20,
        title: gt('Create sharing link'),
        ref: 'io.ox/files/actions/getalink'
    });

    // layout options
    ext.point('io.ox/files/listview/contextmenu/freespace').extend({
        id: 'list',
        index: 40,
        section: 30,
        sectionTitle: gt('Layout'),
        title: gt('List'),
        checkmarkFn: layoutEnabled.bind('list'),
        ref: 'io.ox/files/actions/layout-list'
    });

    ext.point('io.ox/files/listview/contextmenu/freespace').extend({
        id: 'icon',
        index: 50,
        section: 30,
        sectionTitle: gt('Layout'),
        title: gt('Icons'),
        checkmarkFn: layoutEnabled.bind('icon'),
        ref: 'io.ox/files/actions/layout-icon'
    });

    ext.point('io.ox/files/listview/contextmenu/freespace').extend({
        id: 'title',
        index: 60,
        section: 30,
        sectionTitle: gt('Layout'),
        title: gt('Tiles'),
        checkmarkFn: layoutEnabled.bind('tile'),
        ref: 'io.ox/files/actions/layout-tile'
    });

    // View options
    ext.point('io.ox/files/listview/contextmenu/freespace').extend({
        id: 'checkbox',
        index: 70,
        section: 40,
        sectionTitle: gt('Options'),
        title: gt('Checkboxes'),
        checkmarkFn: viewOptionEnabled.bind('checkboxes'),
        ref: 'io.ox/files/actions/view-checkboxes'
    });

    ext.point('io.ox/files/listview/contextmenu/freespace').extend({
        id: 'folderview',
        index: 80,
        section: 40,
        sectionTitle: gt('Options'),
        title: gt('Folder view'),
        checkmarkFn: viewOptionEnabled.bind('folderview'),
        ref: 'io.ox/files/actions/view-folderview'
    });

    ext.point('io.ox/files/listview/contextmenu/freespace').extend({
        id: 'file-detail',
        index: 90,
        section: 40,
        sectionTitle: gt('Options'),
        title: gt('File details'),
        checkmarkFn: viewOptionEnabled.bind('details'),
        ref: 'io.ox/files/actions/view-details'
    });

    _(points).each(function (items, point) {
        ext.point(point).extend(
            items.map(function (item, index) {
                return {
                    id: item[0],
                    index: 100 + index * 100,
                    title: item[2],
                    ref: 'io.ox/files/actions/' + item[0],
                    section: item[1]
                };
            })
        );
    });
});
