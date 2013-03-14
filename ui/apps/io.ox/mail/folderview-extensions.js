/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2013
 * Mail: info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/mail/folderview-extensions',
    ['io.ox/core/extensions',
     'io.ox/core/api/folder',
     'io.ox/mail/api',
     'gettext!io.ox/mail'], function (ext, folderAPI, mailAPI, gt) {

    'use strict';

    var POINT = 'io.ox/mail/folderview';

    function addAccount(e) {
        e.preventDefault();
        require(['io.ox/mail/accounts/settings'], function (m) {
            m.mailAutoconfigDialog(e);
        });
    }

    ext.point(POINT + '/sidepanel/toolbar/add').extend({
        id: 'add-account',
        index: 300,
        draw: function (baton) {
            this.append($('<li>').append(
                $('<a href="#" data-action="add-mail-account">').text(gt('Add mail account')).on('click', addAccount)
            ));
        }
    });
    function subscribeIMAPFolder(e) {
        e.preventDefault();
        e.data.app.folderView.subscribe(e.data);
    }

    ext.point(POINT + '/sidepanel/toolbar/add').extend({
        id: 'subscribe-folder',
        index: 400,
        draw: function (baton) {
            this.append($('<li>').append(
                $('<a href="#" data-action="subscribe">').text(gt('Subscribe IMAP folders'))
                .on('click', { app: baton.app, selection: baton.tree.selection }, subscribeIMAPFolder)
            ));
        }
    });

    function markMailFolderRead(e) {
        e.preventDefault();
        var item = {folder: e.data.app.folder.get()};

        mailAPI.markRead(item).done(function () {
            // TODO: unify events?
            mailAPI.trigger("remove-unseen-mails", item); //remove notifications in notification area
            folderAPI.trigger('update:unread', item);
        });
    }

    ext.point(POINT + '/sidepanel/toolbar/options').extend({
        id: 'mark-folder-read',
        index: 50,
        draw: function (baton) {
            this.append($('<li>').append(
                $('<a href="#" data-action="markfolderread">').text(gt('Mark all mails as read'))
                .on('click', { app: baton.app }, markMailFolderRead)
            ));
        }
    });

    function expungeFolder(e) {
        e.preventDefault();
        var baton = e.data.baton,
        id = _(baton.app.folderView.selection.get()).first();
        mailAPI.expunge(id);
    }

    ext.point(POINT + '/sidepanel/toolbar/options').extend({
        id: 'expunge',
        index: 75,
        draw: function (baton) {
            var link = $('<a href="#" data-action="expunge">').text(gt('Clean up'));
            this.append($('<li>').append(link));
            if (folderAPI.can('delete', baton.data)) {
                link.on('click', { baton: baton }, expungeFolder);
            } else {link.addClass('disabled').on('click', $.preventDefault);
            }
            this.append($('<li class="divider">'));
        }
    });

    function clearFolder(e) {
        e.preventDefault();
        var baton = e.data.baton,
        id = _(baton.app.folderView.selection.get()).first();
        mailAPI.clear(id);
    }

    ext.point(POINT + '/sidepanel/toolbar/options').extend({
        id: 'clear',
        index: 450,
        draw: function (baton) {
            var link = $('<a href="#" data-action="clearfolder">').text(gt('Empty folder'));
            this.append($('<li class="divider">'), $('<li>').append(link));
            if (folderAPI.can('delete', baton.data)) {
                link.on('click', { baton: baton }, clearFolder);
            } else {
                link.addClass('disabled').on('click', $.preventDefault);
            }
        }
    });


});
