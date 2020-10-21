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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/actions/imap-subscription', [
    'io.ox/core/folder/api',
    'io.ox/core/folder/picker',
    'io.ox/core/http',
    'gettext!io.ox/core'
], function (api, picker, http, gt) {

    'use strict';

    return function (options) {
        options = options || {};

        var previous = {}, changes = {};

        function check(id, state) {
            if (state !== previous[id]) changes[id] = state; else delete changes[id];
        }

        function subfolders(node, checked) {
            var list = node.find('ul input[type="checkbox"]');
            // toggle state
            list.prop('disabled', !checked);
            if (checked) return;
            // uncheck
            list.filter(':checked').each(function (index, node) {
                $(node).prop('checked', false);
            });
        }

        function change() {
            var node = $(this), checked = node.prop('checked');
            subfolders(node.closest('.folder'), checked);
            check(node.val(), checked);
        }

        function keypress(e) {
            if (e.which !== 32 || e.isDefaultPrevented()) return;
            e.preventDefault();
            var node = $(this).find('input:checkbox').first(), state = node.prop('checked');
            // skip if checkbox is disabled
            if (node.prop('disabled')) return;
            node.prop('checked', !state);
        }

        // remove "all" cache entries
        _(api.pool.collections).each(function (collection, id) {
            if (id.indexOf('all/') === 0) delete api.pool.collections[id];
        });

        function getSubscribedSubfolders(model) {
            var id = model.get('id');
            // process only subscribed subfolders
            if (!model.get('subscr_subflds')) return;
            var models = api.pool.getCollection(id, true).models,
                children = _.filter(models, function (model) { return model.get('subscribed'); });
            return _.map(children, function (model) {
                return model.get('id');
            });
        }

        picker({
            async: true,
            all: true,
            addClass: 'zero-padding subscribe-imap-folder',
            button: gt('Save'),
            context: 'subscribe',
            height: 300,
            module: options.module || 'mail',
            selection: false,
            title: options.title || gt('Subscribe to IMAP folders'),
            help: options.helplink || 'ox.appsuite.user.sect.dataorganisation.sharing.subscribe.html',
            createFolderButton: false,
            alternativeButton: gt('Refresh folders'),
            root: options.root || '1',
            hideTrashfolder: options.hideTrashfolder || false,

            always: function (dialog) {

                http.pause();

                // subfolder handling
                var list = Object.keys(changes);
                // hint: for-loop allows manipulating that list within handler
                for (var i = 0; i < list.length; i++) {
                    var id = list[i], state = changes[id];
                    if (state) continue;
                    var model = api.pool.getModel(id);
                    // eslint-disable-next-line no-loop-func
                    _.each(getSubscribedSubfolders(model), function (id) {
                        changes[id] = false;
                        list.push(id);
                    });
                }

                var affectedFolders = _(changes).map(function (state, id) {
                    // update flag
                    api.update(id, { subscribed: state }, { silent: true });
                    // get parent folder id
                    var model = api.pool.getModel(id);
                    return model.get('folder_id');
                });

                // reload affected folders
                _(affectedFolders).chain().uniq().each(function (id) {
                    api.list(id, { cache: false });
                });

                http.resume().done(function () {
                    // refresh all virtual folders to be safe
                    api.virtual.refresh();
                    dialog.close();
                });
            },

            customize: function (baton) {
                var data = baton.data,
                    virtual = /^virtual/.test(data.id) || data.id === 'default0/virtual',
                    // top-level folder of external accounts don’t have imap-subscribe capability :\
                    disabled = virtual || !api.can('read', data) || !api.can(options.capabilityCheck || 'subscribe:imap', data);

                previous[data.id] = data.subscribed;
                var guid = _.uniqueId('form-control-label-');
                this.find('.folder-label').before(
                    $('<label class="folder-checkbox">').attr('for', guid).append(
                        $('<input type="checkbox">').attr('id', guid)
                            .prop({ checked: data.subscribed, disabled: disabled })
                            .on('change', change).val(data.id)
                    )
                );

                this.on('keypress', keypress);
            },

            close: function () {
                previous = changes = null;
            },
            alternative: function (dialog, tree) {
                var node = tree.getNodeView(tree.selection.get() || tree.root);
                node.collection.fetched = false;
                node.isReset = false;
                node.reset();
                dialog.idle();
            }
        });
    };
});
