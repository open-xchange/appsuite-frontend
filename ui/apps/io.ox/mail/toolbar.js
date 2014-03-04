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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/toolbar',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/core/extPatterns/actions',
     'io.ox/core/tk/flag-picker',
     'io.ox/mail/api',
     'io.ox/backbone/mini-views/dropdown',
     'io.ox/core/tk/upload',
     'io.ox/core/dropzone',
     'io.ox/core/notifications',
     'gettext!io.ox/mail',
     'io.ox/mail/actions',
     'less!io.ox/mail/style.less',
     'io.ox/mail/folderview-extensions'
    ], function (ext, links, actions, flagPicker, api, Dropdown, upload, dropzone, notifications, gt) {

    'use strict';

    // define links for classic toolbar
    var point = ext.point('io.ox/mail/classic-toolbar/links');

    var meta = {
        //
        // --- HI ----
        //
        'compose': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Compose'),
            title: gt('Compose new email'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/compose'
        },
        'reply': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'icon-reply',
            label: gt('Reply to sender'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/reply'
        },
        'reply-all': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'icon-reply-all',
            label: gt('Reply all recipients'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/reply-all'
        },
        'forward': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'icon-mail-forward',
            label: gt('Forward'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/forward'
        },
        'delete': {
            prio: 'hi',
            mobile: 'lo',
            icon: 'icon-trash',
            label: gt('Delete'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/delete'
        },
        'color': {
            prio: 'hi',
            mobile: 'none',
            icon: 'icon-bookmark',
            label: gt('Set color'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/color',
            customize: function (baton) {
                flagPicker.attach(this, { data: baton.data });
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
        },
        'folder': {
            prio: 'lo',
            label: gt('Show/hide folder'),
            ref: 'io.ox/mail/actions/toggle-folder',
            section: 'keep'
        }
    };

    // local dummy action

    new actions.Action('io.ox/mail/actions/color', {
        requires: 'some',
        action: $.noop
    });

    // transform into extensions

    var index = 0;

    _(meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(new links.Link(extension));
    });

    ext.point('io.ox/mail/classic-toolbar').extend(new links.InlineLinks({
        attributes: {},
        classes: '',
        forcelimit: true, // always use drop-down
        index: 200,
        id: 'toolbar-links',
        ref: 'io.ox/mail/classic-toolbar/links'
    }));

    // view dropdown
    ext.point('io.ox/mail/classic-toolbar').extend({
        id: 'view-dropdown',
        index: 10000,
        draw: function (baton) {

            if (_.device('small')) return;

            this.append(
                new Dropdown({ model: baton.app.props, label: gt('View'), tagName: 'li' })
                .header(gt('Preview pane'))
                .option('preview', 'right', gt('Right'))
                .option('preview', 'bottom', gt('Bottom'))
                .option('preview', 'none', gt('None'))
                .divider()
                .option('folderview', true, gt('Show folders'))
                .option('checkboxes', true, gt('Show checkboxes'))
                .render()
                .$el.addClass('pull-right')
            );
        }
    });

    // classic toolbar
    var toolbar = $('<ul class="classic-toolbar" role="menu">');

    var updateToolbar = _.debounce(function (list) {
        if (!list) return;
        // remember if this list is based on a single thread
        var isThread = list.length === 1 && /^thread\./.test(list[0]);
        // resolve thread
        list = api.threads.resolve(list);
        // extract single object if length === 1
        list = list.length === 1 ? list[0] : list;
        // draw toolbar
        var baton = ext.Baton({ $el: toolbar, data: list, isThread: isThread, app: this });
        ext.point('io.ox/mail/classic-toolbar').invoke('draw', toolbar.empty(), baton);
    }, 10);

    ext.point('io.ox/mail/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {
            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbar = $('<ul class="classic-toolbar" role="menu">')
            );
            app.updateToolbar = updateToolbar;
        }
    });

    ext.point('io.ox/mail/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
            app.updateToolbar();
            // update toolbar on selection change as well as any model change (seen/unseen flag)
            app.listView.on('selection:change change', function () {
                app.updateToolbar(app.listView.selection.get());
            });
        }
    });


    // // Uploads
    // app.queues = {};

    // if (settings.get('features/importEML') !== false) {
    //     app.queues.importEML = upload.createQueue({
    //         start: function () {
    //             win.busy();
    //         },
    //         progress: function (file) {
    //             return api.importEML({ file: file, folder: app.folder.get() })
    //                 .done(function (data) {
    //                     var first = _(data.data || []).first() || {};
    //                     if ('Error' in first) {
    //                         notifications.yell('error', first.Error);
    //                     } else {
    //                         grid.selection.set(first);
    //                         notifications.yell('success', gt('Mail has been imported'));
    //                     }
    //                 });
    //         },
    //         stop: function () {
    //             win.idle();
    //         },
    //         type: 'importEML'
    //     });
    // }

    // // drag & drop
    // win.nodes.outer.on('selection:drop', function (e, baton) {
    //     actions.invoke('io.ox/mail/actions/move', null, baton);
    // });

});
