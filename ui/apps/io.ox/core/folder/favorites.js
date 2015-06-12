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

define('io.ox/core/folder/favorites', [
    'io.ox/core/folder/node',
    'io.ox/core/folder/api',
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (TreeNodeView, api, ext, settings, gt) {

    'use strict';

    _('mail contacts calendar tasks infostore'.split(' ')).each(function (module) {

        // register collection
        var id = 'virtual/favorites/' + module,
            model = api.pool.getModel(id),
            collection = api.pool.getCollection(id),
            favorites = settings.get('favorites/' + module, []);

        function store(ids) {
            settings.set('favorites/' + module, ids).save();
        }

        function storeCollection() {
            store(collection.pluck('id'));
        }

        // define virtual folder
        api.virtual.add(id, function () {
            return api.multiple(favorites).then(function (response) {
                // compact() removes non-existent entries
                var list = _(response).compact();
                _(list).each(api.injectIndex.bind(api, id));
                model.set('subfolders', list.length > 0);
                // if there was an error we update settings
                if (list.length !== response.length) storeCollection();
                return list;
            });
        });

        // respond to change events
        collection.on('add remove', storeCollection);

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
        return $('<a href="#" tabindex="1" role="menuitem">')
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
        node.append($('<li>').append(link));
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
