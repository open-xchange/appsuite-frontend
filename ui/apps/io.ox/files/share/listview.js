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
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/files/share/listview', [
    'io.ox/files/share/api',
    'io.ox/core/extensions',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/tk/list',
    'io.ox/files/common-extensions',
    'io.ox/files/api',
    'io.ox/core/capabilities',
    'gettext!io.ox/files',
    'less!io.ox/files/share/style',
    'io.ox/files/share/view-options'
], function (api, ext, BreadcrumbView, ListView, extensions, filesAPI, capabilities, gt) {

    'use strict';

    var LISTVIEW = 'io.ox/files/share/myshares/listview', ITEM = LISTVIEW + '/item';

    var MyShareListView = ListView.extend({

        ref: LISTVIEW,

        initialize: function (options) {

            options.collection = this.collection = api.collection;

            ListView.prototype.initialize.call(this, options);

            this.$el.addClass('myshares-list column-layout');

            this.contextMenu = arguments[0].contextMenu;

            this.load();

            this.model.set({ sort: options.app.props.get('sort'), order: options.app.props.get('order') });
            this.toggleCheckboxes(false);

            this.listenTo(this.collection, 'reset', this.redraw);
            this.listenTo(ox, 'refresh^', this.reload);
            this.listenTo(this.model, 'change:sort change:order', this.sortBy);

            this.sortBy();
            var self = this;

            // Doubleclick handler
            this.$el.on(
                _.device('touch') ? 'tap' : 'dblclick',
                '.list-item .list-item-content',
                function () {
                    // using defere for "tap"; otherwise the selection is not yet ready
                    _.defer(function () { self.openPermissionsDialog(); });
                }
            );

            // Keydown handler (only Enter) on selection
            (function () {
                if (_.device('smartphone')) return;
                self.$el.on('keydown', '.list-item', function (e) {
                    if (e.which === 13) self.openPermissionsDialog();
                });
            })();

        },

        load: function () {
            var self = this;
            return api.all().then(function (data) {
                self.collection.reset(data);
            });
        },

        reload: function () {
            return this.load();
        },

        openPermissionsDialog: function () {
            var model = this.collection.get(this.selection.get()[0]);
            return require(['io.ox/files/share/permissions'], function (permissions) {
                permissions.show(model);
            });
        },

        sortBy: function () {
            var desc = this.model.get('order') === 'desc';
            switch (this.model.get('sort')) {
                case 5:
                    this.collection.comparator = function (shareA) {
                        var ret = shareA.get('last_modified');
                        if (shareA.isFolder()) {
                            ret = (desc ? '1' : '0') + ret;
                        } else {
                            ret = (desc ? '0' : '1') + ret;
                        }
                        return desc ? -ret : ret;
                    };
                    break;
                case 702:
                    this.collection.comparator = function (shareA, shareB) {
                        var a = shareA.getDisplayName().toLowerCase(),
                            b = shareB.getDisplayName().toLowerCase();
                        if (shareA.isFolder()) {
                            a = (desc ? '1' : '0') + a;
                        } else {
                            a = (desc ? '0' : '1') + a;
                        }
                        if (shareB.isFolder()) {
                            b = (desc ? '1' : '0') + b;
                        } else {
                            b = (desc ? '0' : '1') + b;
                        }
                        var ret = a > b ? 1 : -1;
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
        },

        /**
         * Function to create the context menu for the myshare viewList.
         * @param {jQuery.Event} event
         */
        onContextMenu: function (event) {
            var view = this,
                app = view.app,
                list = view.selection.get(),
                // the link to render the context menu with it's entries
                link = 'io.ox/core/file/contextmenu/myshares';

            if (!list) return;

            // turn cids into proper objects
            var cids = list,
                cidList = view.collection.get(cids),
                modelList = cidList ? [cidList] : [],
                models = (/^folder\./).test(cids) ? filesAPI.resolve(cids, false) : modelList;

            list = _(models).invoke('toJSON');
            // extract single object if length === 1
            var data = list.length === 1 ? list[0] : list;
            var baton = new ext.Baton({ data: data, model: app.mysharesListView.collection.get(app.mysharesListView.selection.get()), models: models, collection: app.listView.collection, app: app, allIds: [], view: view, linkContextMenu: link, share: true });

            view.contextMenu.showContextMenu(event, baton);
        }
    });

    var getPermissions = function (baton) {
            return _.chain(baton.model.getPermissions())
                    // ignore current user - only necessary for folders
                    .reject(function (data) { return data.type === 'user' && data.entity === ox.user_id; })
                    .pluck('type')
                    .uniq()
                    .value();
        },
        hasGuests = function (baton) {
            return _(getPermissions(baton)).contains('guest');
        },

        isPublic = function (baton) {
            return _(getPermissions(baton)).contains('anonymous');
        },

        hasUser = function (baton) {
            return _(getPermissions(baton)).contains('user') || _(getPermissions(baton)).contains('group');
        };

    //
    // Extensions
    //

    ext.point(ITEM).extend(
        {
            id: 'default',
            index: 100,
            draw: function (baton) {
                // We only have a list layout, if we add more layouts this needs to be changed
                var layout = 'list';
                ext.point(ITEM + '/' + layout).invoke('draw', this, baton);
            }
        }
    );

    // list layout

    ext.point(ITEM + '/list').extend(
        {
            id: 'file-type',
            index: 100,
            draw: extensions.fileTypeClass
        },
        {
            id: 'icon',
            index: 200,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-1">');
                extensions.fileTypeIcon.call(column, baton);
                this.append(column);
            }
        },
        {
            id: 'displayname',
            index: 300,
            draw: function (baton) {
                this.append(
                    $('<div class="list-item-column column-2">').append(
                        $('<div class="displayname">').text(baton.model.getDisplayName())
                    )
                );
            }
        },
        {
            id: 'breadcrumb',
            index: 400,
            draw: function (baton) {

                if (_.device('smartphone')) return;

                var model = baton.model,
                    breadcrumb = new BreadcrumbView({
                        folder: model.getFolderID(),
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
            id: 'user',
            index: 600,
            draw: function (baton) {
                if (_.device('smartphone')) return;
                // show also when gab isn't accessible but shares for users still exists
                if (capabilities.has('!gab || alone') && !hasUser(baton)) return;
                this.append(
                    $('<div class="list-item-column type">').append(
                        $('<i class="fa">')
                            .addClass(hasUser(baton) ? 'fa-user' : 'fa-circle-thin')
                            .attr('title', gt('Internal users'))
                    )
                );
            }
        },
        {
            id: 'guest',
            index: 700,
            draw: function (baton) {
                if (_.device('smartphone')) return;
                this.append(
                    $('<div class="list-item-column type">').append(
                        $('<i class="fa">')
                            .addClass(hasGuests(baton) ? 'fa-user-plus' : 'fa-circle-thin')
                            .attr('title', gt('External guests'))
                    )
                );
            }
        },
        {
            id: 'external',
            index: 800,
            draw: function (baton) {
                if (_.device('smartphone')) return;
                this.append(
                    $('<div class="list-item-column type">').append(
                        $('<i class="fa">')
                            .addClass(isPublic(baton) ? 'fa-link' : 'fa-circle-thin')
                            .attr('title', gt('Public link'))
                    )
                );
            }
        },
        {
            id: 'date',
            index: 1000,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-4 gray">');
                extensions.smartdate.call(column, baton);
                this.append(column);
            }
        }
    );

    return MyShareListView;
});
