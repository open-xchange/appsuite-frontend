/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author @author Julian Bäume <julian.baeume@open-xchange.com>
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
