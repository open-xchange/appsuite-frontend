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
     'io.ox/core/extPatterns/actions',
     'io.ox/mail/actions',
     'less!io.ox/mail/style.less',
     'io.ox/mail/folderview-extensions'
    ], function (ext, actions) {

    'use strict';

    // classic toolbar
    var toolbar = $('<ul class="classic-toolbar">').append(
        $('<li><a href="#" role="button" data-action="compose"><b>New</b></a></li>'),
        $('<li><a href="#" role="button" data-action="delete">Delete</a></li>'), // delete
        $('<li><a href="#" role="button" data-action="reply-all">Reply <i class="icon-caret-down"/></a></li>'), // reply
        $('<li><a href="#" role="button" data-action="forward">Forward</a></li>'), // forward
        $('<li><a href="#" role="button" data-action="spam">Spam</a></li>'), // spam
        $('<li><a href="#" role="button" data-action="move">Move <i class="icon-caret-down"/></a></li>'), // move
        $('<li><a href="#" role="button">More <i class="icon-caret-down"/></a></li>') // other
    );

    function processAction(e) {
        e.preventDefault();
        var app = e.data.app,
            action = $(this).data('action'),
            selection = _(app.listView.selection.get()).map(_.cid),
            baton = ext.Baton({ data: selection, app: app });
        switch (action) {
        case 'delete':
            actions.invoke('io.ox/mail/actions/delete', this, baton, e);
            break;
        case 'compose':
            actions.invoke('io.ox/mail/actions/compose', this, baton, e);
            break;
        case 'reply-all':
            if (selection.length !== 1) break;
            actions.invoke('io.ox/mail/actions/reply-all', this, baton, e);
            break;
        case 'forward':
            if (selection.length === 0) break;
            actions.invoke('io.ox/mail/actions/forward', this, baton, e);
            break;
        case 'move':
            if (selection.length === 0) break;
            actions.invoke('io.ox/mail/actions/move', this, baton, e);
            break;
        }
    }

    toolbar.children().slice(1).hide();

    ext.point('io.ox/mail/mediator').extend({
        id: 'toolbar',
        index: 'last',
        setup: function (app) {

            app.listView.on('selection:change', function (list) {
                toolbar.children().slice(1).toggle(list.length > 0);
            });

            toolbar.on('click', 'a', { app: app }, processAction);

            app.getWindow().nodes.body.addClass('classic-toolbar-visible').append(toolbar);
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
