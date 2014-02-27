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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/imap-subscription',
    ['io.ox/core/api/folder',
     'io.ox/core/cache',
     'io.ox/core/tk/folderviews',
     'gettext!io.ox/core'
    ], function (api, cache, folderviews, gt) {

    'use strict';

    var that = {

        show: function () {

            var folderCache = new cache.SimpleCache('folder-all', false),
                subFolderCache = new cache.SimpleCache('subfolder-all', false),
                storage = {
                    folderCache: folderCache,
                    subFolderCache: subFolderCache
                };

            var container = $('<div>'),
                tree = new folderviews.ApplicationFolderTree(container, {
                    type: 'mail',
                    tabindex: 0,
                    rootFolderId: '1',
                    checkbox: true,
                    all: true,
                    storage: storage,
                    filter: function (folder) {
                        // also allow top-level mailfolders
                        // top-level folder of external accounts don’t have imap-subscribe capability :\
                        return (/^default\d+(\W|$)$/i).test(folder.id) || api.can('imap-subscribe', folder);
                    }
                });

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                var pane = new dialogs.ModalDialog({
                    width: 500,
                    addclass: 'subscribe-imap-folder'
                });
                var changesArray = [];

                pane.header(
                    $('<h4>').text(gt('Subscribe IMAP folders'))
                )
                .build(function () {
                    this.getContentNode().addClass('max-height-300').append(container);
                })
                .addPrimaryButton('save', gt('Save'))
                .addButton('cancel', gt('Cancel'))
                .show(function () {
                    tree.paint().done(function () {
                        tree.selection.updateIndex().selectFirst();
                        pane.getBody().find('.io-ox-foldertree').focus();
                    });
                })
                .done(function (action) {
                    if (action === 'save') {
                        _(changesArray).each(function (change) {
                            api.update(change, storage);
                        });
                        tree.destroy().done(function () {
                            tree = pane = null;
                        });
                    }
                    if (action === 'cancel') {
                        tree.destroy().done(function () {
                            tree = pane = null;
                        });
                    }
                });

                tree.container.on('change', 'input[type="checkbox"]', function () {
                    var folder = $(this).val(),
                        checkboxStatus = $(this).is(':checked'),
                        changes = { subscribed: checkboxStatus },
                        tobBePushed = { folder: folder, changes: changes};
                    changesArray.push(tobBePushed);
                });
            });
        }
    };

    return that;
});
