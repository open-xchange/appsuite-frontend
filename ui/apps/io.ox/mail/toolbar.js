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
     'gettext!io.ox/mail',
     'io.ox/mail/actions',
     'less!io.ox/mail/style.less',
     'io.ox/mail/folderview-extensions'
    ], function (ext, links, actions, flagPicker, api, gt) {

    'use strict';

    // define links for classic toolbar
    var point = ext.point('io.ox/mail/classic-toolbar/links');

    var meta = {
        //
        // --- HI ----
        //
        'compose': {
            prio: 'hi',
            label: gt('Compose'),
            title: gt('Compose new email'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/compose'
        },
        'reply': {
            prio: 'hi',
            icon: 'icon-reply',
            label: gt('Reply to sender'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/reply'
        },
        'reply-all': {
            prio: 'hi',
            icon: 'icon-reply-all',
            label: gt('Reply all recipients'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/reply-all'
        },
        'forward': {
            prio: 'hi',
            icon: 'icon-mail-forward',
            label: gt('Forward'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/forward'
        },
        'delete': {
            prio: 'hi',
            icon: 'icon-trash',
            label: gt('Delete'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/delete'
        },
        'color': {
            prio: 'hi',
            icon: 'icon-bookmark',
            //label: gt('Set flag color'),
            drawDisabled: true,
            ref: 'io.ox/mail/actions/color',
            customize: function (baton) {
                flagPicker.attach(this, { data: baton.data });
            }
        },
        'edit': {
            prio: 'hi',
            label: gt('Edit draft'),
            ref: 'io.ox/mail/actions/edit'
        },
        //
        // --- LO ----
        //
        'markunread': {
            prio: 'lo',
            label: gt('Mark as unread'),
            ref: 'io.ox/mail/actions/markunread',
            section: 'flags'
        },
        'markread': {
            prio: 'lo',
            label: gt('Mark as read'),
            ref: 'io.ox/mail/actions/markread',
            section: 'flags'
        },
        'print': {
            prio: 'lo',
            label: gt('Print'),
            ref: 'io.ox/mail/actions/print',
            section: 'export'
        },
        'saveEML': {
            prio: 'lo',
            label: gt('Save as file'),
            ref: 'io.ox/mail/actions/save',
            section: 'export'
        },
        'source': {
            prio: 'lo',
            //#. source in terms of source code
            label: gt('View source'),
            ref: 'io.ox/mail/actions/source',
            section: 'export'
        },
        'reminder': {
            prio: 'lo',
            label: gt('Reminder'),
            ref: 'io.ox/mail/actions/reminder',
            section: 'keep'
        },
        'add-to-portal': {
            prio: 'lo',
            label: gt('Add to portal'),
            ref: 'io.ox/mail/actions/add-to-portal',
            section: 'keep'
        }
    };

    // local action

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
        index: 100,
        id: 'toolbar-links',
        ref: 'io.ox/mail/classic-toolbar/links'
    }));

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
        ext.point('io.ox/mail/classic-toolbar').invoke('draw', toolbar.empty(), ext.Baton({ $el: toolbar, data: list, isThread: isThread }));
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
        index: 10100,
        setup: function (app) {
            app.updateToolbar();
            // update toolbar on selection change as well as any model change (seen/unseen flag)
            app.listView.on('selection:change change', function () {
                app.updateToolbar(app.listView.selection.get());
            });
        }
    });

    // var SimpleMailWriter = Backbone.View.extend({

    //     className: 'simple-mail-writer abs',

    //     events: {
    //         'click [data-action="send"]': 'onCancel',
    //         'click [data-action="draft"]': 'onCancel',
    //         'click [data-action="cancel"]': 'onCancel'
    //     },

    //     onCancel: function (e) {
    //         e.preventDefault();
    //         this.hide();
    //         this.reset();
    //     },

    //     show: function () {
    //         this.$el.show();
    //         this.$el.find('.field-to').focus();
    //     },

    //     hide: function () {
    //         this.$el.hide();
    //     },

    //     reset: function () {
    //         this.$el.find('.editor textarea, input').val('');
    //     },

    //     render: function () {
    //         this.$el.hide().append(
    //             $('<div class="inline-toolbar">').append(
    //                 $('<li><a href="#" role="button" data-action="send"><b>envoyer</b></a></li>'),
    //                 $('<li><a href="#" role="button" data-action="draft">enregistrer le brouillon</a></li>'),
    //                 $('<li><a href="#" role="button" data-action="cancel">annuler</a></li>')
    //             ),
    //             $('<div class="writer">').append(
    //                 $('<div class="header">').append(
    //                     $('<table border="0">').append(
    //                         $('<tr><td class="row-label">de :</td><td><b>' + ox.user + '</b></td></tr>'),
    //                         $('<tr><td class="row-label">à :</td><td><input type="text" class="field-to input-xxlarge"/></td></tr>'),
    //                         $('<tr><td class="row-label">objet :</td><td><input type="text" class="field-subject input-xxlarge" placeholder="Saisissez l\'objet de votre message"/></td></tr>'),
    //                         $('<tr><td class="row-label"></td><td><i class="icon-paper-clip"/> joindre un fichier</td></tr>')
    //                     )
    //                 ),
    //                 $('<div class="editor">').append(
    //                     $('<textarea>').attr('placeholder', 'Votre message')
    //                 )
    //             )
    //         );
    //         return this;
    //     }
    // });

    //var writer = new SimpleMailWriter();
    //win.nodes.body.append(writer.render().$el);

    // hide writer / go back to list
    // $(document).on('click', '.folder.selectable', function (e) {
    //     threadView.onBack(e);
    //     writer.hide();
    // });

    // toolbar.on('click', 'a', function (e) {
    //     e.preventDefault();
    //     var action = $(this).data('action'),
    //         selection = _(listView.selection.get()).map(_.cid),
    //         baton = ext.Baton({ data: selection, app: app });
    //     switch (action) {
    //     case 'compose':
    //         if (e.altKey || e.shiftKey)
    //             actions.invoke('io.ox/mail/actions/compose', this, baton, e);
    //             else writer.show();
    //         break;
    //     case 'reply-all':
    //         if (selection.length !== 1) break;
    //         actions.invoke('io.ox/mail/actions/reply-all', this, baton, e);
    //         break;
    //     case 'forward':
    //         if (selection.length === 0) break;
    //         actions.invoke('io.ox/mail/actions/forward', this, baton, e);
    //         break;
    //     case 'move':
    //         if (selection.length === 0) break;
    //         actions.invoke('io.ox/mail/actions/move', this, baton, e);
    //         break;
    //     case 'setting':
    //         ox.launch('io.ox/settings/main');
    //         break;
    //     case 'help':
    //         var helpDir = 'help/' + ox.language + '/',
    //             startingPoints = {
    //             'io.ox/contacts': 'ox.appsuite.user.chap.contacts.html',
    //             'io.ox/calendar': 'ox.appsuite.user.chap.calendar.html',
    //             'io.ox/tasks': 'ox.appsuite.user.chap.tasks.html',
    //             'io.ox/mail': 'ox.appsuite.user.chap.email.html',
    //             'io.ox/files': 'ox.appsuite.user.chap.files.html',
    //             'io.ox/portal': 'ox.appsuite.user.sect.portal.customize.html'
    //         };
    //         var currentApp = ox.ui.App.getCurrentApp(),
    //         currentType = currentApp.attributes.name,
    //         target = currentType in startingPoints ? startingPoints[currentType] : 'index.html';
    //         window.open(helpDir + target);
    //         break;
    //     case 'refresh':
    //         ox.trigger('refresh^');
    //         break;
    //     default:
    //         notifications.yell('info', 'Just a test (' + action + ')');
    //         break;
    //     }
    // });

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

    // // go!
    // commons.addFolderSupport(app, grid, 'mail', options.folder)
    //     .fail(function (result) {
    //         var errorMsg = (result && result.error) ? result.error + ' ' : '';
    //         errorMsg += gt('Application may not work as expected until this problem is solved.');
    //         notifications.yell('error', errorMsg);
    //     })
    //     .always(commons.showWindow(win, grid));

    // return SimpleMailWriter;
});
