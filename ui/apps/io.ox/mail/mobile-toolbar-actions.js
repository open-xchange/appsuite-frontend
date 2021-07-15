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

define('io.ox/mail/mobile-toolbar-actions', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/toolbar',
    'io.ox/backbone/views/actions/mobile',
    'io.ox/mail/api',
    'io.ox/core/capabilities',
    'gettext!io.ox/mail'
], function (ext, ToolbarView, mobile, api, cap, gt) {

    'use strict';

    var meta = {
        'compose': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Compose'),
            icon: 'fa fa-pencil',
            ref: 'io.ox/mail/actions/compose',
            drawDisabled: true
        },
        'reply': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-reply',
            title: gt('Reply to sender'),
            ref: 'io.ox/mail/actions/reply',
            drawDisabled: true
        },
        'reply-all': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-reply-all',
            title: gt('Reply to all recipients'),
            ref: 'io.ox/mail/actions/reply-all',
            drawDisabled: true
        },
        'forward': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-mail-forward',
            title: gt('Forward'),
            ref: 'io.ox/mail/actions/forward',
            drawDisabled: true
        },
        'delete': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-trash-o',
            title: gt('Delete'),
            ref: 'io.ox/mail/actions/delete',
            drawDisabled: true
        },
        'move': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Move'),
            ref: 'io.ox/mail/actions/move',
            section: 'file-op',
            drawDisabled: true
        },
        'mark-read': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Mark as read'),
            ref: 'io.ox/mail/actions/mark-read',
            section: 'flags',
            drawDisabled: true
        },
        'mark-unread': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Mark as unread'),
            ref: 'io.ox/mail/actions/mark-unread',
            section: 'flags',
            drawDisabled: true
        },
        'copy': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Copy'),
            ref: 'io.ox/mail/actions/copy',
            section: 'file-op'
        },
        'archive': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'fa fa-archive',
            //#. Verb: (to) archive messages
            title: gt.pgettext('verb', 'Archive')
        },
        'spam': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Mark as spam'),
            ref: 'io.ox/mail/actions/spam'
        },
        'nospam': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Not spam'),
            ref: 'io.ox/mail/actions/nospam'
        },
        'flag': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Flag'),
            ref: 'io.ox/mail/actions/flag'
        },
        'unflag': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Unflag'),
            ref: 'io.ox/mail/actions/unflag'
        },
        'color': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Set color...'),
            ref: 'io.ox/mail/actions/triggerFlags'
        }
    };

    var points = {
        listView: 'io.ox/mail/mobile/toolbar/listView',
        multiselect: 'io.ox/mail/mobile/toolbar/listView/multiselect',
        threadView: 'io.ox/mail/mobile/toolbar/threadView',
        detailView: 'io.ox/mail/mobile/toolbar/detailView'
    };

    mobile.addAction(points.listView, meta, ['compose']);
    mobile.addAction(points.multiselect, meta, ['compose', 'delete', 'forward', 'move', 'archive']);
    mobile.addAction(points.threadView, meta, ['compose']);
    mobile.addAction(points.detailView, meta, ['reply', 'reply-all', 'delete', 'forward', 'mark-read', 'mark-unread', 'spam', 'flag', 'unflag', 'nospam', 'copy', 'color']);
    mobile.createToolbarExtensions(points);

    var updateToolbar = _.debounce(function (selection) {
        if (!selection) return;

        // remember if this list is based on a single thread
        var isThread = this.isThreaded();

        // resolve thread
        var list = api.resolve(selection, isThread);
        if (list.length === 0) isThread = false;

        // extract single object if length === 1

        list = list.length === 1 ? list[0] : list;

        // don't set an empty baton
        // if (selection.length === 0 && list.length === 0) return;
        // draw toolbar
        var baton = ext.Baton({ data: list, isThread: isThread, selection: selection, app: this });

        // handle updated baton to pageController
        var current = this.pages.getCurrentPage();

        // handle baton to navbar
        // this is special for mail as we might show the "edit draft" action in the upper right corner
        // for draft mails
        current.navbar.setBaton(baton);
        if (current.toolbar) current.toolbar.setBaton(baton);
        if (current.secondaryToolbar) current.secondaryToolbar.setBaton(baton);

    }, 50);

    // multi select toolbar links need some attention
    // in case nothing is selected disabled buttons
    // This should be done via our Link concept, but I
    // didn't get it running. Feel free to refactor this
    // to a nicer solutioun
    ext.point(points.multiselect).extend({
        id: 'update-button-states',
        index: 10000,
        draw: function (baton) {
            // hmmmm, should work for this easy case
            if (baton.data.length === 0) {
                $('a.mobile-toolbar-action, .mobile-toolbar-action a', this).addClass('ui-disabled');
            } else {
                $('a.mobile-toolbar-action, .mobile-toolbar-action a', this).removeClass('ui-disabled');
            }
        }
    });

    // some mediator extensions
    // register update function and introduce toolbar updating
    ext.point('io.ox/mail/mediator').extend({
        id: 'toolbar-mobile',
        index: 10100,
        setup: function (app) {
            if (!_.device('smartphone')) return;
            app.updateToolbar = updateToolbar;
        }
    });

    ext.point('io.ox/mail/mediator').extend({
        id: 'update-toolbar-mobile',
        index: 10300,
        setup: function (app) {
            if (!_.device('smartphone')) return;
            app.updateToolbar();
            // update toolbar on selection change as well as any model change (seen/unseen flag)
            // selection:action also triggers if the same mail is opened again, so the toolbar has to be drawn
            app.listView.on('selection:change change selection:action', function () {
                var cp = app.pages.getCurrentPage();
                // don't update in folderview
                if (cp.name === 'folderTree') return;
                // if there's a thread-mail baton already set, don't overwrite it
                // Happens becuase the change event occurs later than the "showmail" event
                if (cp.toolbar && cp.toolbar.baton.threadMember) return;
                app.updateToolbar(app.listView.selection.get());
            });

            app.threadView.$el.on('showmail', function () {
                var baton = ext.Baton({ threadMember: true, data: app.threadView.mail, isThread: false, app: app });
                // handle updated baton to pageController
                app.pages.getPageObject('detailView').toolbar.setBaton(baton);
            });
        }
    });

    ext.point('io.ox/mail/mediator').extend({
        id: 'change-mode-toolbar-mobile',
        index: 10400,
        setup: function (app) {
            if (!_.device('smartphone')) return;
            // if multiselect is triggered, show secondary toolbar with other options based on selection
            app.props.on('change:checkboxes', function (model, state) {
                var page = app.pages.getCurrentPage();
                app.pages.toggleSecondaryToolbar(page.name, state);
            });
        }
    });

});
