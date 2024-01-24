/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/contextmenu', ['io.ox/core/extensions', 'gettext!io.ox/mail'], function (ext, gt) {

    'use strict';

    var items = [
        // --- react ---
        ['reply', 'react', gt('Reply')],
        ['reply-all', 'react', gt('Reply all')],
        ['forward', 'react', gt('Forward')],
        // --- mark ---
        ['mark-read', 'mark', gt('Mark as read')],
        ['mark-unread', 'mark', gt('Mark as unread')],
        ['spam', 'mark', gt('Mark as spam')],
        ['nospam', 'mark', gt('Not spam')],
        //#. Verb: (to) flag messages
        ['flag', 'mark', gt.pgettext('verb', 'Flag')],
        //#. Verb: (to) unflag messages
        ['unflag', 'mark', gt.pgettext('verb', 'Unflag')],
        // --- organize ---
        ['delete', 'organize', gt('Delete')],
        //#. Verb: (to) archive messages
        ['archive', 'organize', gt.pgettext('verb', 'Archive')],
        ['move', 'organize', gt('Move')],
        ['copy', 'organize', gt('Copy')],
        ['print', 'organize', gt('Print')],
        // --- other ---
        ['source', 'other', gt('View source')],
        ['save-as-eml', 'other', gt('Save as file')]
    ];

    ext.point('io.ox/mail/listview/contextmenu').extend(
        items.map(function (item, index) {
            return {
                id: item[0],
                index: 100 + index * 100,
                title: item[2],
                ref: 'io.ox/mail/actions/' + item[0],
                section: item[1]
            };
        })
    );
});
