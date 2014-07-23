/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/actions/attachmentSave',
    ['io.ox/mail/api',
     'io.ox/core/notifications',
     'io.ox/core/tk/dialogs',
     'io.ox/core/folder/tree',
     'io.ox/core/folder/api',
     'settings!io.ox/files', // yep, files not mail!
     'settings!io.ox/core',
     'gettext!io.ox/mail'], function (api, notifications, dialogs, TreeView, folderAPI, settings, settingsCore, gt) {

    'use strict';

    function commit(list, target) {

        notifications.yell('busy',
            gt.ngettext('Saving attachment to Drive', 'Saving attachments to Drive', list.length) + ' ...'
        );

        api.saveAttachments(list, target).then(
            // success
            function success(response) {

                function yell(res) {
                    if (res.error) {
                        notifications.yell(res.error);
                    } else {
                        notifications.yell('success',
                            gt.ngettext('Attachment has been saved', 'Attachments have been saved', list.length)
                        );
                    }
                }

                if (_.isArray(response)) {
                    _.each(response, function (fileResponse) {
                        yell(fileResponse);
                    });
                } else {
                    yell(response);
                }
                folderAPI.reload(target, list);
            },
            // fail
            notifications.yell
        );
    }

    return {

        multiple: function (list) {

            var dialog = new dialogs.ModalDialog({ addClass: 'zero-padding' })
                .header($('<h4>').text(gt('Save attachment')))
                .addPrimaryButton('ok', gt('Save'), 'ok', { tabindex: '1' })
                .addButton('cancel', gt('Cancel'), 'cancel', { tabindex: '1' });

            dialog.getBody().css({ height: '250px' });

            var folderId = settingsCore.get('folder/infostore'),
                id = settings.get('folderpopup/last') || folderId;

            var tree = new TreeView({
                context: 'popup',
                module: 'infostore',
                open: settings.get('folderpopup/open', []),
                root: '9',
                customize: function (baton) {
                    var data = baton.data, create = folderAPI.can('create', data);
                    if (!create) this.addClass('disabled');
                }
            });

            tree.on('open close', function () {
                var open = this.getOpenFolders();
                settings.set('folderpopup/open', open).save();
            });

            tree.on('change', function (id) {
                settings.set('folderpopup/last', id).save();
            });

            dialog.on('ok', function () {
                var target = tree.selection.get();
                if (target) commit(list, target);
            })
            .show(function () {
                tree.preselect(id);
                dialog.getBody().focus().append(tree.render().$el);
            })
            .done(function () {
                tree = dialog = null;
            });
        }
    };
});
