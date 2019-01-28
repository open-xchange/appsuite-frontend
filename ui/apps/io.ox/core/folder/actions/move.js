/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/actions/move', [
    'io.ox/core/folder/api',
    'io.ox/core/folder/picker',
    'io.ox/core/notifications',
    'gettext!io.ox/core',
    'io.ox/mail/api'
], function (api, picker, notifications, gt, mailAPI) {

    'use strict';

    var virtualMapping = {
        'virtual/myfolders': api.altnamespace ? 'default0' : 'default0' + mailAPI.separator + 'INBOX'
    };

    function canMoveFolder(target, input) {
        var canMoveState = 'ok';

        _.all(input, function (inputItem) {
            var currentFolderId = target;

            // do not check files
            if (inputItem.folder_id !== 'folder') return true;
            // check if folder is moved into itself
            if (currentFolderId === inputItem.id) { canMoveState = 'error:self'; return false; }

            // check if folder is moved into own subfolder
            while (currentFolderId) {
                if (String(currentFolderId) === '1') return true;
                if (currentFolderId === inputItem.id) { canMoveState = 'error:subfld'; return false; }
                // move on level up in the folder tree
                currentFolderId = api.pool.getModel(currentFolderId).get('folder_id');
            }
        });
        return canMoveState;
    }

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
        //   successCallback: callback function on success, is used instead of yell then
        //   title: dialog title
        //   target: target is known; no dialog
        //   type: move/copy
        //   vgrid: app's vgrid (deprecated)
        //

        item: function (options) {

            var type = options.type || 'move',
                settings = options.settings,
                // input is either source folder (move all) or a list of items (move)
                input = options.source || options.list,
                isMove = /^move/.test(type),
                onlyFolder = false,
                multiple = type === 'moveAll' || options.list.length > 1,
                current = options.source || options.list[0].folder_id;

            function success() {
                notifications.yell('success', multiple ? options.success.multiple : options.success.single);
                if (options.api.refresh) options.api.refresh();
            }

            function commit(target) {
                if (isMove && options.vgrid) options.vgrid.busy();

                if (/^virtual/.test(target)) {
                    return notifications.yell('error', gt('You cannot move items to virtual folders'));
                }

                // final check for write privileges; if it's only folders the server check the privilegs.
                if (!onlyFolder && !api.pool.getModel(target).can('create')) {
                    return notifications.yell('error', gt('You cannot move items to this folder'));
                }

                if (type === 'move' && options.module === 'infostore') {
                    switch (canMoveFolder(target, input)) {
                        case 'ok':
                            break;
                        case 'error:self':
                            return notifications.yell('error', gt('A folder cannot be moved into itself'));
                        case 'error:subfld':
                            return notifications.yell('error', gt('A folder cannot be moved to one of its subfolders'));
                        // no default
                    }
                }

                // support for move, moveAll, and copy
                options.api[type](input, target, options.all).then(
                    function (response) {
                        // files API returns array on error; mail just a single object
                        // contacts a double array of undefined; tasks the new object.
                        // so every API seems to behave differently.
                        if (!options.fullResponse && _.isArray(response)) response = _(response).compact()[0];
                        // custom callback?
                        if (options.successCallback) {
                            options.successCallback(response, { input: input, target: target, options: options.all });
                        } else if (_.isObject(response) && response.error) {
                            // fail?
                            notifications.yell(response);
                        } else {
                            if (type === 'copy') success();
                            api.reload(input, target);
                            if (isMove && options.vgrid) options.vgrid.idle();
                        }
                    },
                    function (e) {
                        if (e.code === 'UI_CONSREJECT') {
                            // inform when a big copy operation is still ongoing, but the user clicked again(thinking it didn't work)
                            notifications.yell('warning', gt('Please wait for the previous operation to finish'));
                        } else {
                            notifications.yell('error', e.error || e);
                        }
                    }
                );
            }

            if (type !== 'moveAll') {
                onlyFolder = true;
                _(options.list).each(function (item) {
                    if (!onlyFolder) return;
                    onlyFolder = item.folder_id === 'folder';
                });
            }

            if (options.target) {
                if (current !== options.target) commit(options.target);
                return;
            }

            picker({
                async: true,
                button: options.button,
                filter: options.filter,
                flat: !!options.flat,
                indent: options.indent !== undefined ? options.indent : true,
                module: options.module,
                persistent: 'folderpopup',
                root: options.root,
                open: options.open,
                settings: settings,
                title: options.title,
                type: options.type,
                initialize: options.pickerInit || $.noop,
                close: options.pickerClose || $.noop,

                done: function (id, dialog) {
                    if (type === 'copy' || id !== current) commit(id);
                    if (dialog) dialog.close();
                },

                disable: options.disable || function (data, options) {
                    var same = isMove && data.id === current,
                        create = onlyFolder ? api.can('create:folder', data) : api.can('create', data);
                    return same || !create || (options && /^virtual/.test(options.folder));
                }
            });
        },

        all: function (options) {
            // default API is mail API
            this.item(_.extend({ api: mailAPI, module: 'mail', type: 'moveAll', title: gt('Move all messages') }, options));
        },

        folder: function (id, settings) {

            var model = api.pool.getModel(id),
                module = model.get('module'),
                flat = api.isFlat(module),
                context = 'popup';
            picker({
                async: true,
                addClass: 'zero-padding',
                done: function (target, dialog, tree) {
                    dialog.busy(true);
                    if (!!virtualMapping[target]) target = virtualMapping[target];
                    function preselect() {
                        tree.preselect(target);
                    }
                    api.move(id, target, { enqueue: true }).done(dialog.close).fail([dialog.idle, preselect, notifications.yell]);

                },
                customize: function (baton) {

                    var data = baton.data,
                        same = data.id === id,
                        move = api.can('move:folder', model.toJSON(), data);

                    if (module === 'mail' && data.module === 'system') return;
                    if (same || !move) this.addClass('disabled');
                },
                disable: function (data) {
                    var move = id === data.id || /^virtual\//.test(data.id);
                    return move && !virtualMapping[data.id];
                },
                flat: flat,
                indent: !flat,
                module: module,
                root: module === 'infostore' ? '9' : '1',
                title: gt('Move folder') + ': ' + model.get('title'),
                context: context,
                persistent: 'folderpopup',
                settings: settings
            });
        }
    };
});
