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
    'io.ox/files/share/view-options',
    'less!io.ox/files/share/style'
], function (api, ext, sModel, BreadcrumbView, ListView, extensions) {

    'use strict';

    var LISTVIEW = 'io.ox/files/share/myshares/listview', ITEM = LISTVIEW + '/item';

    var MyShareListView = ListView.extend({

        ref: LISTVIEW,

        initialize: function (options) {

            options.collection = this.collection = new sModel.Shares();

            ListView.prototype.initialize.call(this, options);

            this.$el.addClass('myshares-list');

            this.getShares();
        },

        getShares: function () {
            var self = this;
            return api.all().then(function (data) {
                self.collection.reset(data);
            });
        },
        sortBy: function (model) {
            var desc = model.get('order') === 'desc';
            switch (model.get('sort')) {
                case 'date':
                    this.collection.comparator = function (shareA) {
                        return desc ? shareA.get('created') : -shareA.get('created');
                    };
                    break;
                case 'name':
                    this.collection.comparator = function (shareA, shareB) {
                        var ret = (shareA.getDisplayName().toLowerCase() > shareB.getDisplayName().toLowerCase()) ? 1 : -1;
                        return desc ? -ret : ret;
                    };
                    break;
                case 'type':
                    this.collection.comparator = function (shareA) {
                        var ret = shareA.isFolder() ? 1 : -1;
                        return desc ? ret : -ret;
                    };
                    break;
                default:
            }
            this.collection.sort();
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
                // We only have a list layout, if we add more layouts this needs to be changed
                var layout = 'list';
                if (!baton.model) {
                    baton.model = new sModel.Shares();
                }
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
            id: 'date',
            index: 500,
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
