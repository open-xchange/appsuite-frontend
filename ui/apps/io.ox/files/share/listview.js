/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/files/share/listview', [
    'io.ox/files/share/api',
    'io.ox/core/extensions',
    'io.ox/files/share/model',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/tk/list',
    'io.ox/files/common-extensions',
    'gettext!io.ox/files',
    'less!io.ox/files/share/style',
    'io.ox/files/share/view-options'
], function (api, ext, sModel, BreadcrumbView, ListView, extensions, gt) {

    'use strict';

    var LISTVIEW = 'io.ox/files/share/myshares/listview', ITEM = LISTVIEW + '/item';

    var MyShareListView = ListView.extend({

        ref: LISTVIEW,

        initialize: function (options) {

            options.collection = this.collection = api.collection;

            ListView.prototype.initialize.call(this, options);

            this.$el.addClass('myshares-list column-layout');

            this.load();

            this.model.set({ sort: 'name', order: 'asc' });
            this.toggleCheckboxes(false);

            this.listenTo(this.collection, 'reset', this.redraw);
            this.listenTo(ox, 'refresh^', this.reload);
            this.listenTo(this.model, 'change:sort change:order', this.sortBy);

            var self = this;

            // Doubleclick handler
            this.$el.on(
                _.device('touch') ? 'tap' : 'dblclick',
                '.list-item .list-item-content',
                function () {
                    self.openPermissionsDialog();
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
                case 'date':
                    this.collection.comparator = function (shareA) {
                        return desc ? shareA.get('last_modified') : -shareA.get('last_modified');
                    };
                    break;
                case 'name':
                    this.collection.comparator = function (shareA, shareB) {
                        var a = (shareA.isFolder() ? '0' : '1') + shareA.getDisplayName().toLowerCase(),
                            b = (shareB.isFolder() ? '0' : '1') + shareB.getDisplayName().toLowerCase();
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
        }
    });

    var getPermissions = function (baton) {
            return _(_(baton.model.getPermissions()).pluck('type')).uniq();
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
                var model = baton.model,
                    breadcrumb = new BreadcrumbView({
                        folder: model.getFolderID(),
                        exclude: ['9'],
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
                this.append(
                    $('<div class="list-item-column type gray">').append(
                        $('<i class="fa fa-user">')
                            .toggleClass('gray', !hasUser(baton))
                            .attr('title', gt('Internal users'))
                    )
                );
            }
        },
        {
            id: 'guest',
            index: 700,
            draw: function (baton) {
                this.append(
                    $('<div class="list-item-column type gray">').append(
                        $('<i class="fa fa-user-plus">')
                            .toggleClass('gray', !hasGuests(baton))
                            .attr('title', gt('External guests'))
                    )
                );
            }
        },
        {
            id: 'external',
            index: 800,
            draw: function (baton) {
                this.append(
                    $('<div class="list-item-column type gray">').append(
                        $('<i class="fa fa-link">')
                            .toggleClass('gray', !isPublic(baton))
                            .attr('title', gt('Public link'))
                    )
                );
            }
        },
        {
            id: 'date',
            index: 1000,
            draw: function (baton) {
                var created = moment(baton.model.get('last_modified'));
                this.append(
                    $('<div class="list-item-column column-4 gray">').append(
                        $('<time class="date">')
                            .attr('datetime', created.toISOString())
                            .text(_.noI18n(created.format('L')))
                    )
                );
            }
        }
    );

    return MyShareListView;
});
