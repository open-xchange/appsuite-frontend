/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/mail/mobile-toolbar-actions', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/mail/api',
    'gettext!io.ox/mail'
], function (ext, links, api, gt) {

    'use strict';

    // define links for each page

    //var pointFolderView = ext.point('io.ox/mail/mobile/toolbar/folderView'),
    var pointListView = ext.point('io.ox/mail/mobile/toolbar/listView'),
        pointListViewMultiSelect = ext.point('io.ox/mail/mobile/toolbar/listView/multiselect'),
        pointThreadView = ext.point('io.ox/mail/mobile/toolbar/threadView'),
        pointDetailView = ext.point('io.ox/mail/mobile/toolbar/detailView'),
        submenu = ext.point('io.ox/mail/mobile/toolbar/submenuActions');

    var meta = {
        'compose': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Compose'),
            icon: 'fa fa-edit',
            drawDisabled: true,
            ref: 'io.ox/mail/actions/compose',
            cssClasses: 'io-ox-action-link mobile-toolbar-action'
        },
        'reply': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-reply',
            label: gt('Reply to sender'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/reply',
            cssClasses: 'io-ox-action-link mobile-toolbar-action'
        },
        'reply-all': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-reply-all',
            label: gt('Reply to all recipients'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/reply-all',
            cssClasses: 'io-ox-action-link mobile-toolbar-action'
        },
        'forward': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-mail-forward',
            label: gt('Forward'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/forward',
            cssClasses: 'io-ox-action-link mobile-toolbar-action'
        },
        'delete': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-trash-o',
            label: gt('Delete'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/delete',
            cssClasses: 'io-ox-action-link mobile-toolbar-action'
        },
        'move': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Move'),
            icon: 'fa fa-sign-in',
            drawDisabled: true,
            ref: 'io.ox/mail/actions/move',
            section: 'file-op',
            cssClasses: 'io-ox-action-link mobile-toolbar-action'
        },
        'mark-read': {
            prio: 'hi',
            mobile: 'hi',
            drawDisabled: true,
            label: gt('Mark as read'),
            ref: 'io.ox/mail/actions/mark-read',
            section: 'flags'
        },
        'mark-unread': {
            prio: 'hi',
            mobile: 'hi',
            drawDisabled: true,
            label: gt('Mark as unread'),
            ref: 'io.ox/mail/actions/mark-unread',
            section: 'flags'
        },
        'copy': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Copy'),
            ref: 'io.ox/mail/actions/copy',
            section: 'file-op'
        },
        'archive': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-archive',
            //#. Verb: (to) archive messages
            label: gt.pgettext('verb', 'Archive'),
            section: 'file-op',
            ref: 'io.ox/mail/actions/archive',
            cssClasses: 'io-ox-action-link mobile-toolbar-action'
        }
    };

    function addAction(point, ids) {
        var index = 0;
        _(ids).each(function (id) {
            var extension = meta[id];
            extension.id = id;
            extension.index = (index += 100);
            point.extend(new links.Link(extension));
        });
        index = 0;
    }

    addAction(submenu, ['mark-read', 'mark-unread']);

    addAction(pointListView, ['compose']);

    addAction(pointThreadView, ['compose']);

    addAction(pointDetailView, ['reply', 'reply-all', 'delete', 'forward']);

    //multiselect in listview
    addAction(pointListViewMultiSelect, ['delete', 'forward', 'move', 'archive']);

    pointDetailView.extend(new links.Dropdown({
        id: 'test',
        index: 900,
        noCaret: true,
        icon: 'fa fa-bars',
        label: gt('Actions'),
        ariaLabel: gt('Actions'),
        ref: 'io.ox/mail/links/inline',
        classes: 'io-ox-action-link mobile-toolbar-action'
    }));

    // add submenu as text link to toolbar in multiselect
    pointListViewMultiSelect.extend(new links.Dropdown({
        index: 50,
        label: $('<span>').text(
            //.# Will be used as menu heading in mail module which then shows the sub-actions "mark as read" and "mark as unread"
            gt('Mark as')
        ),
        // don't draw the caret icon beside menu link
        noCaret: true,
        ref: 'io.ox/mail/mobile/toolbar/submenuActions'
    }));

    // special "edit draft button"
    ext.point('io.ox/mail/mobile/navbar/links').extend(new links.Link({
        prio: 'hi',
        mobile: 'hi',
        label: gt('Edit draft'),

        ref: 'io.ox/mail/actions/edit'
    }));

    ext.point('io.ox/mail/mobile/navbar/links/action').extend(new links.ToolbarLinks({
        classes: 'navbar-action right',
        index: 100,
        id: 'edit-draft-button',
        ref: 'io.ox/mail/mobile/navbar/links'
    }));

    var updateToolbar = _.debounce(function (selection) {

        if (!selection) return;

        // remember if this list is based on a single thread
        var isThread = this.props.get('thread');

        // resolve thread
        var list = api.resolve(selection, isThread);
        if (list.length === 0) isThread = false;

        // extract single object if length === 1
        list = list.length === 1 ? list[0] : list;

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
    pointListViewMultiSelect.extend({
        id: 'update-button-states',
        index: 10000,
        draw: function (baton) {
            // hmmmm, should work for this easy case
            if (baton.data.length === 0) {
                $('.mobile-toolbar-action', this).addClass('ui-disabled');
            } else {
                $('.mobile-toolbar-action', this).removeClass('ui-disabled');
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
                // if there's a thread-mail baton already set, don't overwrite it
                // Happens becuase the change event occurs later than the "showmail" event
                if (app.pages.getCurrentPage().toolbar.baton.threadMember) return;
                // don't update in folderview
                if (app.pages.getCurrentPage().name === 'folderView') return;
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
