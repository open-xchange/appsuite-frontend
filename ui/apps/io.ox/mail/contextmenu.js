define('io.ox/mail/contextmenu', [
    'io.ox/core/extensions',
    'gettext!io.ox/mail'
], function (ext, gt) {
    'use strict';

    var INDEX = 100;
    ext.point('io.ox/mail/listview/contextmenu').extend({
        id: 'reply',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/reply',
        section: 'react',
        label: gt('Reply')
    }, {
        id: 'reply-all',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/reply-all',
        section: 'react',
        label: gt('Reply All')
    }, {
        id: 'forward',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/forward',
        section: 'react',
        label: gt('Forward')
    }, {
        id: 'spam',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/spam',
        section: 'mark',
        label: gt('Spam')
    }, {
        id: 'nospam',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/nospam',
        section: 'mark',
        label: gt('No Spam')
    }, {
        id: 'flag',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/flag',
        section: 'mark',
        label: gt('Flag')
    }, {
        id: 'unflag',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/unflag',
        section: 'mark',
        label: gt('Unflag')
    }, {
        id: 'mark-read',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/mark-read',
        section: 'mark',
        label: gt('Mark read')
    }, {
        id: 'mark-unread',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/mark-unread',
        section: 'mark',
        label: gt('Unread')
    }, {
        id: 'delete',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/delete',
        section: 'organize',
        label: gt('Delete')
    }, {
        id: 'archive',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/archive',
        section: 'organize',
        label: gt('Archive')
    }, {
        id: 'move',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/move',
        section: 'organize',
        label: gt('Move')
    }, {
        id: 'copy',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/copy',
        section: 'organize',
        label: gt('Copy')
    }, {
        id: 'print',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/print',
        section: 'other',
        label: gt('Print')
    }, {
        id: 'save-as-eml',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/save',
        section: 'other',
        label: gt('Save as file')
    }, {
        id: 'source',
        index: INDEX += 100,
        ref: 'io.ox/mail/actions/source',
        section: 'other',
        label: gt('View source')
    });
});
