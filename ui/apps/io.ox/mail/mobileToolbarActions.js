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

define('io.ox/mail/mobileToolbarActions',
   ['io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/mail/api',
    'gettext!io.ox/mail'],
    function (ext, links, api, gt) {

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
        'markunread': {
            prio: 'lo',
            mobile: 'lo',
            drawDisabled: true,
            label: gt('Mark as unread'),
            ref: 'io.ox/mail/actions/markunread',
            section: 'flags'
        },
        'markread': {
            prio: 'lo',
            mobile: 'lo',
            drawDisabled: true,
            label: gt('Mark as read'),
            ref: 'io.ox/mail/actions/markread',
            section: 'flags'
        },
        'move': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Move'),
            ref: 'io.ox/mail/actions/move',
            section: 'file-op'
        },
        'copy': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Copy'),
            ref: 'io.ox/mail/actions/copy',
            section: 'file-op'
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

    addAction(submenu, ['markread', 'markunread']);

    addAction(pointListView, ['compose']);

    addAction(pointThreadView, ['compose']);

    addAction(pointDetailView, ['compose', 'reply', 'reply-all', 'forward', 'delete']);

    //multiselect in listview
    addAction(pointListViewMultiSelect, ['delete', 'forward']);

    // add submenu as text link to toolbar in multiselect
    pointListViewMultiSelect.extend(new links.DropdownLinks({
        index: 50,
        label: $('<span>').text(
            //.# Will be used as menu heading in mail module which then shows the sub-actions "mark as read" and "mark as unread"
            gt('Mark as')
        ),
        noCaret: true, // don't draw the caret icon beside menu link
        ref: 'io.ox/mail/mobile/toolbar/submenuActions'
    }));

    var updateToolbar = _.debounce(function (list) {

        if (!list) return;
        // remember if this list is based on a single thread
        var isThread = list.length === 1 && /^thread\./.test(list[0]);
        // resolve thread
        list = api.threads.resolve(list);
        // extract single object if length === 1
        list = list.length === 1 ? list[0] : list;
        // draw toolbar
        var baton = ext.Baton({data: list, isThread: isThread, app: this });

        // handle updated baton to pageController
        this.pages.getCurrentPage().toolbar.setBaton(baton);
        if (this.pages.getCurrentPage().secondaryToolbar) {
            this.pages.getCurrentPage().secondaryToolbar.setBaton(baton);
        }

    }, 10);

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
            if (!_.device('small')) return;
            app.updateToolbar = updateToolbar;
        }
    });

    ext.point('io.ox/mail/mediator').extend({
        id: 'update-toolbar-mobile',
        index: 10300,
        setup: function (app) {
            if (!_.device('small')) return;
            app.updateToolbar();
            // update toolbar on selection change as well as any model change (seen/unseen flag)
            app.listView.on('selection:change change', function () {
                // don't update in folderview
                if (app.pages.getCurrentPage().name === 'folderView') return;
                app.updateToolbar(app.listView.selection.get());
            });
        }
    });

    ext.point('io.ox/mail/mediator').extend({
        id: 'change-mode-toolbar-mobile',
        index: 10400,
        setup: function (app) {
            if (!_.device('small')) return;
            // if multiselect is triggered, show secondary toolbar with other options based on selection
            app.props.on('change:checkboxes', function (model, state) {
                var page = app.pages.getCurrentPage();
                app.pages.toggleSecondaryToolbar(page.name, state);
            });
        }
    });

});