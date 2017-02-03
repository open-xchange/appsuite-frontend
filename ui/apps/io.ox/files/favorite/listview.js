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
 * @author York Richter <york.richter@open-xchange.com>
 */

define('io.ox/files/favorite/listview', [
    'io.ox/core/extensions',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/tk/list',
    'io.ox/files/common-extensions',
    'settings!io.ox/core',
    'io.ox/core/folder/api',
    'less!io.ox/files/favorite/style',
    'io.ox/files/favorite/view-options'
], function (ext, BreadcrumbView, ListView, extensions, settings, FolderAPI) {

    'use strict';

    var LISTVIEW = 'io.ox/files/favorite/myfavorites/listview', ITEM = LISTVIEW + '/item';
//    var id = 'virtual/favorites/infostore';
    var MyFavoriteListView = ListView.extend({

        ref: LISTVIEW,

        initialize: function (options) {

            options.collection = this.collection = FolderAPI.pool.getCollection('virtual/favorites/infostore');

            this.folderID = settings.get('favorites/infostore', []);

            ListView.prototype.initialize.call(this, options);

            this.$el.addClass('myfavorites-list column-layout');

            this.model.set({ sort: options.app.props.get('sort'), order: options.app.props.get('order') });
            this.toggleCheckboxes(false);

            this.load();
            this.sortBy();

            this.listenTo(this.model, 'change:sort change:order', this.sortBy);

            // DoubleClick handler
            this.$el.on(
                _.device('touch') ? 'tap' : 'dblclick',
                '.list-item .list-item-content',
                function (element) {
                    var cid = $(element.currentTarget).parent().attr('data-cid');
                    options.app.folder.set(options.collection.get(cid).id);
                }
            );
        },
        load: function () {
            var self = this;
            return FolderAPI.multiple(this.folderID, { errors: true }).then(function (response) {
                self.collection.reset(response);
            });
        },
        sortBy: function () {
            var desc = this.model.get('order') === 'desc';
            switch (this.model.get('sort')) {
                case 5:
                    this.collection.comparator = function (shareA) {
                        return desc ? -shareA.get('last_modified') : shareA.get('last_modified');
                    };
                    break;
                case 702:
                    this.collection.comparator = function (shareA, shareB) {
                        var a = shareA.attributes.title.toLowerCase(),
                            b = shareB.attributes.title.toLowerCase();
                        var ret = a - b || a.localeCompare(b);
                        return desc ? -ret : ret;
                    };
                    break;
                default:
            }
            // the list view needs a proper "index" attribute for sorting
            this.collection.sort({ silent: true });
            this.collection.each(function (model, index) {
                model.set('index', index);
            });
            this.collection.trigger('sort');
            this.app.props.set(this.model.attributes);
        }
    });

    //
    // Extensions
    //

    ext.point(ITEM).extend(
        {
            id: 'default',
            index: 100,
            draw: function (baton) {
                ext.point(ITEM + '/list').invoke('draw', this, baton);
            }
        }
    );

    // list layout

    ext.point(ITEM + '/list').extend(
        {
            id: 'file-type',
            index: 10,
            draw: function () {
                this.closest('.list-item').addClass('file-type-folder');
            }
        },
        {
            id: 'col1',
            index: 100,
            draw: function () {
                var column = $('<div class="list-item-column column-1">').append('<i class="fa file-type-icon" aria-hidden="true">');
                this.append(column);
            }
        },
        {
            id: 'col2',
            index: 200,
            draw: function (baton) {
                this.append(
                    $('<div class="list-item-column column-2">').append(
                        $('<div class="filename">').text(baton.data.title)
                    )
                );
            }
        },
        {
            id: 'col3',
            index: 300,
            draw: function (baton) {

                if (_.device('smartphone')) return;

                var breadcrumb = new BreadcrumbView({
                    folder: baton.model.id,
                    exclude: ['9'],
                    notail: true,
                    isLast: true
                });

                breadcrumb.handler = function (id) {
                    // launch files and set/change folder
                    ox.launch('io.ox/files/main', { folder: id }).done(function () {
                        this.folder.set(id);
                    });
                };

                this.append(
                    $('<div class="list-item-column column-3 gray">').append(
                        breadcrumb.render().$el
                    )
                );
            }
        },
        {
            id: 'col4',
            index: 400,
            draw: function (baton) {
                if (_.device('smartphone')) return;
                var column = $('<div class="list-item-column column-4 gray">');
                extensions.smartdate.call(column, baton);
                this.append(column);
            }
        }
    );

    return MyFavoriteListView;
});
