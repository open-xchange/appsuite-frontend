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

define('io.ox/core/folder/actions/move', [
    'io.ox/core/folder/api',
    'io.ox/core/folder/picker',
    'io.ox/core/notifications',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/core',
    'io.ox/mail/api'
], function (api, picker, notifications, dialogs, gt, mailAPI) {

    'use strict';

    var virtualMapping = {
        'virtual/myfolders': 'default0' + mailAPI.separator + 'INBOX'
    };

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

                // final check for write privileges
                if (!api.pool.getModel(target).can('create')) {
                    return notifications.yell('error', gt('You cannot move items to this folder'));
                }

                // support for move, moveAll, and copy
                options.api[type](input, target, options.all).then(
                    function (response) {
                        // files API returns array on error; mail just a single object
                        // contacts a double array of undefined; tasks the new object.
                        // so every API seems to behave differently.
                        if (_.isArray(response)) response = _(response).compact()[0];
                        // custom callback?
                        if (options.successCallback) {
                            options.successCallback(response);
                        } else if (_.isObject(response) && response.error) {
                            // fail?
                            notifications.yell(response);
                        } else {
                            if (type === 'copy') success();
                            api.reload(input, target);
                            if (isMove && options.vgrid) options.vgrid.idle();
                        }
                    },
                    notifications.yell
                );
            }

            if (options.target) {
                if (current !== options.target) commit(options.target);
                return;
            }

            picker({

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

                done: function (id) {
                    if (type === 'copy' || id !== current) commit(id);
                },

                disable: function (data, options) {
                    var same = isMove && data.id === current,
                        create = api.can('create', data);
                    return same || !create || (options && /^virtual/.test(options.folder));
                }
            });
        },

        all: function (options) {
            // default API is mail API
            this.item(_.extend({ api: mailAPI, module: 'mail', type: 'moveAll' }, options));
        },

        folder: function (id) {

            var model = api.pool.getModel(id),
                module = model.get('module'),
                flat = api.isFlat(module);

            picker({
                async: true,
                addClass: 'zero-padding',
                done: function (target, dialog) {
                    if (!!virtualMapping[target]) target = virtualMapping[target];
                    api.move(id, target).then(dialog.close, dialog.idle).fail(notifications.yell);
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
                title: gt('Move folder') + ': ' + model.get('title')
            });
        }
    };
});
