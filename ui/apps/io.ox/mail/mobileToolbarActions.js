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

    var pointFolderView = ext.point('io.ox/mail/mobile/toolbar/folderView'),
        pointListView = ext.point('io.ox/mail/mobile/toolbar/listView'),
        pointListViewMultiSelect = ext.point('io.ox/mail/mobile/toolbar/listView/multiselect'),
        pointThreadView = ext.point('io.ox/mail/mobile/toolbar/threadView'),
        pointDetailView = ext.point('io.ox/mail/mobile/toolbar/detailView');

    var meta = {

        'compose': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Compose'),
            icon: 'fa fa-edit',
            drawDisabled: true,
            ref: 'io.ox/mail/actions/compose'
        },
        'reply': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-reply',
            label: gt('Reply to sender'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/reply'
        },
        'reply-all': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-reply-all',
            label: gt('Reply to all recipients'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/reply-all'
        },
        'forward': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-mail-forward',
            label: gt('Forward'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/forward'
        },
        'delete': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-trash-o',
            label: gt('Delete'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/delete'
        },
        'color': {
            prio: 'hi',
            mobile: 'none',
            icon: 'fa fa-bookmark',
            label: gt('Set color'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/color',
            customize: function () {
                //flagPicker.attach(this, { data: baton.data });
            }
        },
        'edit': {
            prio: 'hi',
            mobile: 'lo',
            label: gt('Edit draft'),
            ref: 'io.ox/mail/actions/edit'
        },
        //
        // --- LO ----
        //
        'markunread': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Mark as unread'),
            ref: 'io.ox/mail/actions/markunread',
            section: 'flags'
        },
        'markread': {
            prio: 'lo',
            mobile: 'lo',
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
        },
        'print': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Print'),
            ref: 'io.ox/mail/actions/print',
            section: 'export'
        },
        'saveEML': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Save as file'),
            ref: 'io.ox/mail/actions/save',
            section: 'export'
        },
        'source': {
            prio: 'lo',
            mobile: 'none',
            //#. source in terms of source code
            label: gt('View source'),
            ref: 'io.ox/mail/actions/source',
            section: 'export'
        },
        'reminder': {
            prio: 'lo',
            mobile: 'none',
            label: gt('Reminder'),
            ref: 'io.ox/mail/actions/reminder',
            section: 'keep'
        },
        'add-to-portal': {
            prio: 'lo',
            mobile: 'none',
            label: gt('Add to portal'),
            ref: 'io.ox/mail/actions/add-to-portal',
            section: 'keep'
        }
    };

    var index = 0;

    function addLink(point, ids) {
        _(ids).each(function (id) {
            var extension = meta[id];
            extension.id = id;
            extension.index = (index += 100);
            point.extend(new links.Link(extension));
        });
    }

    // build links for each toolbar

    addLink(pointFolderView, ['compose']);

    addLink(pointListView, ['compose']);

    addLink(pointThreadView, ['compose']);

    addLink(pointDetailView, ['compose', 'reply', 'reply-all', 'forward', 'delete']);

    //multiselect in listview
    addLink(pointListViewMultiSelect, ['forward', 'delete']);

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
        this.pages.getCurrentPage().secondaryToolbar.setBaton(baton);

    }, 10);


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
                app.updateToolbar(app.listView.selection.get());
            });
        }
    });

    ext.point('io.ox/mail/mediator').extend({
        id: 'change-mode-toolbar-mobile',
        index: 10400,
        setup: function (app) {
            if (!_.device('small')) return;

            app.props.on('change:checkboxes', function (model, state) {
                var page = app.pages.getCurrentPage();
                app.pages.toggleSecondaryToolbar(page.name, state);
            });
        }
    });

});