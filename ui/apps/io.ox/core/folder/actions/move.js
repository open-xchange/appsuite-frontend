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

define('io.ox/core/folder/actions/move',
    ['io.ox/core/folder/api',
     'io.ox/core/folder/tree',
     'io.ox/core/notifications',
     'io.ox/core/tk/dialogs',
     'gettext!io.ox/core'], function (api, TreeView, notifications, dialogs, gt) {

    'use strict';

    return {

        //
        // Move/copy item
        //
        // options:
        //   button: primary button label
        //   flat: use flat tree (e.g. for contacts)
        //   indent: indent first level (default is true; also needed for flat trees)
        //   list: list of items
        //   module: 'mail'
        //   root: tree root id
        //   settings: app-specific settings
        //   success: i18n strings { multiple: '...', single: '... }
        //   title: dialog title
        //   target: target is known; no dialog
        //   type: move/copy
        //   vgrid: app's vgrid (deprecated)
        //

        item: function (options) {

            var type = options.type || 'move',
                settings = options.settings;

            function success() {
                notifications.yell('success', options.list.length > 1 ? options.success.multiple : options.success.single);
                options.api.refresh();
            }

            function fail(error) {
                if (error) notifications.yell(error); // error might still be undefined
            }

            function commit(target) {

                if (type === 'move' && options.vgrid) options.vgrid.busy();

                options.api[type](options.list, target).then(
                    function (response) {
                        // files API returns array on error; mail just a single object
                        // contacts a double array of undefined; tasks the new object.
                        // so every API seems to behave differently.
                        if (_.isArray(response) && response.length > 0) {
                            fail(response[0]);
                        } else if (_.isObject(response) && response.error) {
                            fail(response);
                        } else {
                            if (type === 'copy') success();
                            api.reload(target, options.list);
                            if (type === 'move' && options.vgrid) options.vgrid.idle();
                        }
                    },
                    notifications.yell
                );
            }

            if (options.target) {
                if (options.list[0].folder_id !== options.target) commit(options.target);
                return;
            }

            var dialog = new dialogs.ModalDialog({ addClass: 'zero-padding' })
                .header($('<h4>').text(options.title))
                .addPrimaryButton('ok', options.button || gt('Ok'), 'ok', { tabIndex: '1' })
                .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: '1' });

            dialog.getBody().css({ height: options.height || 250 });

            var folderId = String(options.list[0].folder_id),
                id = settings.get('folderpopup/last') || folderId;

            var tree = new TreeView({
                context: 'popup',
                flat: !!options.flat,
                indent: options.indent !== undefined ? options.indent : true,
                module: options.module,
                open: options.settings.get('folderpopup/open', []),
                root: options.root || '1',
                customize: function (baton) {
                    var data = baton.data,
                        same = type === 'move' && data.id === folderId,
                        create = api.can('create', data);
                    if (same || !create) this.addClass('disabled');
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
                if (target && (type === 'copy' || target !== folderId)) commit(target);
            })
            .show(function () {
                tree.preselect(id);
                dialog.getBody().focus().append(tree.render().$el);
            })
            .done(function () {
                tree = dialog = null;
            });
        },

        folder: function (id) {

            var model = api.pool.getModel(id),
                module = model.get('module'),
                flat = /^(contacts|calendar|infostore)$/.test(module);

            var dialog = new dialogs.ModalDialog({ async: true, addClass: 'zero-padding' })
                .header(
                    $('<h4>').append(
                        $.txt(gt('Move folder')),
                        $.txt(': '),
                        $.txt(model.get('title'))
                    )
                )
                .addPrimaryButton('ok', gt('Ok'))
                .addButton('cancel', gt('Cancel'));

            dialog.getBody().css('height', '250px');

            var tree = new TreeView({
                context: 'popup',
                flat: flat,
                indent: !flat,
                module: module,
                root: module === 'infostore' ? '9' : '1',
                customize: function (baton) {

                    var data = baton.data,
                        same = data.id === id,
                        move = api.can('move:folder', model.toJSON(), data);

                    if (module === 'mail' && data.module === 'system') return;
                    if (same || !move) this.addClass('disabled');
                }
            });

            dialog.on('ok', function () {
                var target = tree.selection.get();
                if (target) api.move(id, target).then(this.close, this.idle).fail(notifications.yell);
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
