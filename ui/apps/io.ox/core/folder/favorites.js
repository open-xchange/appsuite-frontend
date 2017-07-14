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

define('io.ox/core/folder/favorites', [
    'io.ox/core/folder/node',
    'io.ox/core/folder/api',
    'io.ox/core/extensions',
    'io.ox/core/upsell',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (TreeNodeView, api, ext, upsell, settings, gt) {

    'use strict';

    _('mail contacts calendar tasks infostore'.split(' ')).each(function (module) {

        // skip if no capability (use capabilities from upsell to work in demo mode)
        if (module === 'mail' && !upsell.has('webmail')) return;
        if (module !== 'mail' && !upsell.has(module)) return;

        // register collection
        var id = 'virtual/favorites/' + module,
            model = api.pool.getModel(id),
            collection = api.pool.getCollection(id),
            // track folders without permission or that no longer exist
            invalid = {};

        function store(ids) {
            settings.set('favorites/' + module, ids).save();
        }

        function storeCollection() {
            var ids = _(collection.pluck('id')).filter(function (id) {
                return !invalid[id];
            });
            store(ids);
        }

        // define virtual folder
        api.virtual.add(id, function () {
            return api.multiple(settings.get('favorites/' + module, []), { errors: true }).then(function (response) {
                // remove non-existent entries
                var list = _(response).filter(function (item) {
                    // FLD-0008 -> not found
                    // FLD-0003 -> permission denied
                    // ACC-0002 -> account not found (see bug 46481)
                    // FLD-1004 -> folder storage service no longer available (see bug 47089)
                    // IMAP-1002 -> mail folder "..." could not be found on mail server (see bug 47847)
                    if (item.error && (item.code === 'FLD-0008' || item.code === 'FLD-0003' || item.code === 'ACC-0002' || item.code === 'FLD-1004' || item.code === 'IMAP-1002')) {
                        invalid[item.id] = true;
                        return false;
                    }
                    delete invalid[item.id];
                    return true;
                });
                _(list).each(api.injectIndex.bind(api, id));
                model.set('subscr_subflds', list.length > 0);
                // if there was an error we update settings
                if (list.length !== response.length) _.defer(storeCollection);
                return list;
            });
        });

        // respond to change events
        collection.on('add', function (model) {
            delete invalid[model.id];
        });

        collection.on('add remove change:id', storeCollection);

        // response to rename for mail folders
        if (module === 'mail') {

            api.on('rename', function (id, data) {
                if (data.module !== 'mail') return;
                getAffectedSubfolders(collection, id).forEach(function (model) {
                    model.set('id', data.id + model.get('id').substr(id.length));
                    storeCollection();
                });
            });

            api.on('remove:mail', function (data) {
                getAffectedSubfolders(collection, data.id).forEach(function (model) {
                    collection.remove(model);
                    storeCollection();
                });
            });

            var fetch = {
                id: 'favorites-fetch',
                index: 2,
                draw: function () {
                    // ensure getAffectedSubfolders works also when tree node extension is disabled
                    var hasIncomplete = collection.any(function (model) {
                        return !model.has('id');
                    });
                    if (hasIncomplete) api.list(id, { all: false });
                }
            };

            ext.point('io.ox/core/foldertree/mail/app').extend(_.extend({}, fetch));
            ext.point('io.ox/core/foldertree/mail/popup').extend(_.extend({}, fetch));


        } else if (module === 'infostore') {
            // Add infos for the filesview
            model.set('title', gt('Favorites'));
            model.set('folder_id', '9');
            model.set('own_rights', 1);
            model.set('standard_folder', true);
        }

        // respond to collection remove event to sync favorites
        api.on('collection:remove', function (id, model) {
            collection.remove(model);
        });

        var extension = {
            id: 'favorites',
            index: 1,
            draw: function (tree) {

                this.append(
                    new TreeNodeView({
                        empty: false,
                        folder: id,
                        indent: !api.isFlat(module),
                        open: false,
                        parent: tree,
                        sortable: true,
                        title: gt('Favorites'),
                        tree: tree,
                        icons: tree.options.icons
                    })
                    .render().$el.addClass('favorites')
                );

                // store new order
                tree.on('sort:' + id, store);
            }
        };

        ext.point('io.ox/core/foldertree/' + module + '/app').extend(_.extend({}, extension));
        ext.point('io.ox/core/foldertree/' + module + '/popup').extend(_.extend({}, extension));
    });

    function getAffectedSubfolders(collection, id) {
        return collection.filter(function (model) {
            var modelId = model.get('id');
            return (modelId || '').indexOf(id + api.getMailFolderSeparator(modelId)) === 0;
        });
    }

    //
    // Add to contextmenu
    //

    function add(e) {
        var id = e.data.id,
            module = e.data.module,
            model = api.pool.getModel(id),
            collectionId = 'virtual/favorites/' + module,
            collection = api.pool.getCollection(collectionId);
        model.set('index/' + collectionId, collection.length, { silent: true });
        collection.add(model);
        collection.sort();
    }

    function remove(e) {
        var id = e.data.id,
            module = e.data.module,
            model = api.pool.getModel(id),
            collection = api.pool.getCollection('virtual/favorites/' + module);
        collection.remove(model);
    }

    function a(action, text) {
        return $('<a href="#" role="menuitem">')
            .attr('data-action', action).text(text)
            // always prevent default
            .on('click', $.preventDefault);
    }

    function disable(node) {
        return node.attr('aria-disabled', true).removeAttr('tabindex').addClass('disabled');
    }

    function addLink(node, options) {
        var link = a(options.action, options.text);
        if (options.enabled) link.on('click', options.data, options.handler); else disable(link);
        node.append($('<li role="presentation">').append(link));
        return link;
    }

    ext.point('io.ox/core/foldertree/contextmenu/default').extend({
        id: 'toggle-favorite',
        // place after "Add new folder"
        index: 1010,
        draw: function (baton) {

            var id = baton.data.id,
                module = baton.module,
                favorites = settings.get('favorites/' + module, []),
                isFavorite = _(favorites).indexOf(id) > -1;

            // don't offer for trash folders
            if (api.is('trash', baton.data)) return;

            addLink(this, {
                action: 'toggle-favorite',
                data: { id: id, module: module },
                enabled: true,
                handler: isFavorite ? remove : add,
                text: isFavorite ? gt('Remove from favorites') : gt('Add to favorites')
            });
        }
    });
});
