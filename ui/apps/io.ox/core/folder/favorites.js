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
    'gettext!io.ox/core',
    'io.ox/files/favorites'
], function (TreeNodeView, api, ext, upsell, settings, gt) {

    'use strict';

    _('mail contacts calendar tasks'.split(' ')).each(function (module) {

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
            settings.set(getSettingsKey(module), ids).save();
        }

        function storeCollection() {
            var ids = _(collection.pluck('id')).filter(function (id) {
                return !invalid[id];
            });
            store(ids);
        }

        // define virtual folder
        api.virtual.add(id, function () {
            var cache = !collection.expired && collection.fetched;
            return api.multiple(getFavorites(module), { errors: true, cache: cache }).then(function (response) {
                // remove non-existent entries
                var list = _(response).filter(function (item) {
                    // FLD-0008 -> not found
                    // FLD-0003 -> permission denied
                    // ACC-0002 -> account not found (see bug 46481)
                    // FLD-1004 -> folder storage service no longer available (see bug 47089)
                    // IMAP-1002 -> mail folder "..." could not be found on mail server (see bug 47847)
                    // FILE_STORAGE-0004 -> The associated (infostore) account no longer exists
                    if (item.error && /^(FLD-0008|FLD-0003|ACC-0002|FLD-1004|IMAP-1002|FILE_STORAGE-0004)$/.test(item.code)) {
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
            }).then(api.renameDefaultCalendarFolders);
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
        } else if (module === 'infostore') {
            // Add infos for the filesview
            model.set('title', gt('Favorites'));
            model.set('folder_id', '9');
            model.set('own_rights', 1);
            model.set('standard_folder', true);
        }

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

    function getFavorites(module) {
        // migrate to chronos API?
        if (module === 'calendar' && settings.get('favorites/chronos') === undefined) migrateCalendar();
        return settings.get(getSettingsKey(module), []);
    }

    // since 7.10 we use another path for calendar not to lose favorites (see bug 58508)
    function getSettingsKey(module) {
        return 'favorites/' + (module === 'calendar' ? 'chronos' : module);
    }

    function migrateCalendar() {
        var ids = _(settings.get('favorites/calendar', [])).map(function (id) { return 'cal://0/' + id; });
        settings.set('favorites/chronos', ids).save();
    }

    function getAffectedSubfolders(collection, id) {
        return collection.filter(function (model) {
            var modelId = model.get('id');
            if (!modelId) return;
            return modelId.indexOf(id + api.getMailFolderSeparator(modelId)) === 0;
        });
    }

    function remove(id, model, module) {
        model = model || api.pool.getModel(id);
        module = module || model.get('module');
        if (!module) return;
        var collectionId = 'virtual/favorites/' + module,
            collection = api.pool.getCollection(collectionId);
        collection.remove(model);
        api.trigger('favorite:remove');
    }

    function add(id, model) {
        model = model || api.pool.getModel(id);
        if (!model.get('module')) return;
        var collectionId = 'virtual/favorites/' + model.get('module'),
            collection = api.pool.getCollection(collectionId);
        model.set('index/' + collectionId, true, { silent: true });
        collection.add(model);
        collection.sort();
        api.trigger('favorite:add');
    }

    //
    // Folder API listeners
    //

    api.on('collection:remove', function (id, model) {
        remove(id, model);
    });

    //
    // Add to contextmenu
    //

    function onAdd(e) {
        add(e.data.id);
    }

    function onRemove(e) {
        remove(e.data.id, undefined, e.data.module);
    }

    function a(action, text) {
        return $('<a href="#" role="menuitem" tabindex="-1">')
            .attr('data-action', action).text(text)
            // always prevent default
            .on('click', $.preventDefault);
    }

    function disable(node) {
        return node.attr('aria-disabled', true).removeAttr('tabindex').addClass('disabled');
    }

    function addLink(node, options) {
        if (options.data.module === 'infostore') return;
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
                favorites = getFavorites(module),
                isFavorite = _(favorites).indexOf(id) > -1;

            // don't offer for trash folders
            if (api.is('trash', baton.data)) return;

            addLink(this, {
                action: 'toggle-favorite',
                data: { id: id, module: module },
                enabled: true,
                handler: isFavorite ? onRemove : onAdd,
                text: isFavorite ? gt('Remove from favorites') : gt('Add to favorites')
            });
        }
    });

    return {
        add: add,
        remove: remove
    };
});
