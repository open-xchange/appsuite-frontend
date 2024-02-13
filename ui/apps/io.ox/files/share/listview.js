/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/files/share/listview', [
    'io.ox/files/share/api',
    'io.ox/core/extensions',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/tk/list',
    'io.ox/core/tk/list-contextmenu',
    'io.ox/files/common-extensions',
    'io.ox/files/api',
    'io.ox/core/capabilities',
    'io.ox/core/yell',
    'gettext!io.ox/files',
    'less!io.ox/files/share/style',
    'io.ox/files/share/view-options'
], function (api, ext, BreadcrumbView, ListView, ContextMenu, extensions, filesAPI, capabilities, yell, gt) {

    'use strict';

    var LISTVIEW = 'io.ox/files/share/myshares/listview', ITEM = LISTVIEW + '/item';

    var MyShareListView = ListView.extend(ContextMenu).extend({

        ref: LISTVIEW,

        initialize: function (options) {

            var self = this;

            options.collection = this.collection = api.collection;

            ListView.prototype.initialize.call(this, options);

            this.$el.addClass('myshares-list column-layout');

            this.load();

            this.model.set({ sort: options.app.props.get('sort'), order: options.app.props.get('order') });
            this.toggleCheckboxes(false);

            this.listenTo(this.collection, 'reset', this.redraw);

            this.listenTo(ox, 'refresh^', this.reload);
            this.listenTo(this.model, 'change:sort change:order', this.sortBy);

            this.sortBy();

            // Doubleclick handler
            this.$el.on(
                _.device('touch') ? 'tap' : 'dblclick',
                '.list-item .list-item-content',
                function () {
                    // using defere for "tap"; otherwise the selection is not yet ready
                    _.defer(function () {
                        self.openPermissionsDialog();
                    });
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
            }, yell);
        },

        reload: function () {
            return this.load();
        },

        openPermissionsDialog: function () {
            var model = this.collection.get(this.selection.get()[0]);
            var elem = this.$el.find('.list-item.selected[data-cid="' + (model.cid ? model.cid : _.cid(model)) + '"]');
            ox.load(['io.ox/files/actions/share']).done(function (action) {
                if (elem.length) {
                    var shareType = elem.attr('data-share-type');
                    if (shareType === 'invited-people') {
                        action.invite([model]);
                    } else if (shareType === 'public-link') {
                        action.invite([model], { share: false, hasLinkSupport: true, supportsInvites: false });
                    }
                }
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
         * Does overwrite the original method of the `ListView` base class.
         *
         * While iterating its `queue` it will render in dependency of the
         * processed `model` up to 2 shared-link items. Every model that
         * for instance features both properties "invite people" and
         * "public shared link" will be split into exactly 2 separate
         * items, each promoting exactly one state.
         */
        onReset: function () {
            this.empty();
            this.$el.append(
                this.collection.reduce(collectListItemsFromSharingModel, { target: this, itemList: [] }).itemList
            );
            this.trigger('reset', this.collection, this.firstReset);
            if (this.firstReset) {
                this.trigger('first-reset', this.collection);
                this.firstReset = false;
            }
            if (this.firstContent && this.collection.length) {
                this.trigger('first-content', this.collection);
                this.firstContent = false;
            }
            this.trigger('listview:reset');
        },

        /**
         * Does overwrite the original method of the `ListView` base class.
         *
         * While iterating the new "my shares" view
         */
        redraw: function () {
            var
                baton,

                model,
                view = this,
                collection = view.collection,

                point = ext.point(view.ref + '/item'),
                sharedItemElementList = view.getItems().toArray();

            sharedItemElementList.forEach(function (elmLi/*, idx, list*/) {
                model = collection.get(elmLi.getAttribute('data-cid'));

                if (elmLi.getAttribute('data-share-type') === 'public-link') {

                    model = makePublicLinkOnlySharingModel(model);
                } else {
                    model = makeInvitationOnlySharingModel(model);
                }
                baton = view.getBaton(model);

                point.invoke('draw', $(elmLi).children().eq(1).empty(), baton);
            });
        },

        /**
         * Does overwrite the original method of the `ListView` base class.
         *
         * "share" and "invitation" related data-set types will be rendered
         * in order to enable a "share" specific `redraw` method as well.
         */
        renderListItem: function (model) {
            var
                li = this.createListItem(),
                baton = this.getBaton(model),
                shareType = ((isPublic(baton) && 'public-link') || 'invited-people'),
                invitationType = ((hasUser(baton) && 'invited-user') || ((hasGuests(baton) && 'invited-guest') || 'not-invited'));

            // add cid and full data
            li.attr({ 'data-cid': this.getCompositeKey(model), 'data-index': model.get('index'), 'data-share-type': shareType, 'data-invitation-type': invitationType });

            // draw via extensions
            ext.point(this.ref + '/item').invoke('draw', li.children().eq(1), baton);

            return li;
        },

        /**
         * Does overwrite the original method of the `ListView` base class.
         *
         * While iterating its `queue` it will render in dependency of the
         * processed `model` up to 2 shared-link items. Every model that
         * for instance features both properties "invite people" and
         * "public shared link" will be split into exactly 2 separate
         * items, each promoting exactly one state.
         */
        renderListItems: function () {

            this.idle();

            // do this line once (expensive)
            var children = this.getItems();

            this.queue.iterate(function (model) {
                var
                    index     = model.has('index') ? model.get('index') : this.collection.indexOf(model),

                    // in order to split a model's data into two separate view items if necessary.
                    itemList  = [model].reduce(collectListItemsFromSharingModel, { target: this, itemList: [] }).itemList,

                    li        = itemList[0]; // `itemList.length` always is either 1 or 2.

                // insert or append
                if (index < children.length) {
                    children.eq(index).before(itemList);
                    // scroll position might have changed due to insertion
                    if (li[0].offsetTop <= this.el.scrollTop) {
                        this.el.scrollTop += (li.outerHeight(true) * itemList.length);
                    }
                } else {
                    this.$el.append(itemList);
                }

                // forward event
                this.trigger('add', model, index);
                // use raw cid here for non-listview listeners (see custom getCompositeKey)
                this.trigger('add:' + model.cid, model, index);

            });

            // needs to be called manually cause drawing is debounced
            this.onSort();
        },

        getContextMenuData: function (selection) {
            return this.app.getContextualData(selection, 'shares');
        }
    });

    //
    // helper
    //

    function makeInvitationOnlySharingModel(model) {
        // new 'io.ox/files/share/api' model
        model = (new api.Model(model.toJSON()));
        var
            permissionList = model.getPermissions().filter(function (item/*, idx, arr*/) {
                return (item.type !== 'anonymous');
            });

        model.setPermissions(permissionList);

        return model;
    }

    function makePublicLinkOnlySharingModel(model) {
        // new 'io.ox/files/share/api' model
        model = (new api.Model(model.toJSON()));
        var permissionList = model.getPermissions().filter(function (item) {
            return (item.type === 'anonymous' && item.isInherited !== true);
        });

        model.setPermissions(permissionList);

        return permissionList.length ? model : false;
    }

    function collectListItemsFromSharingModel(collector, model) {
        var
            target  = collector.target,
            baton   = target.getBaton(model),

            isInvitation = hasUser(baton) || hasGuests(baton),  // in order to split
            isPublicLink = isPublic(baton),                     // a model's data
            //                                                  // into two separate
            itemList = collector.itemList;                      // view items if necessary.

        if (isInvitation) {
            var invModel = makeInvitationOnlySharingModel(model);
            if (invModel) { itemList.push(target.renderListItem(invModel)); }
        }
        if (isPublicLink) {
            var pubModel = makePublicLinkOnlySharingModel(model);
            if (pubModel) { itemList.push(target.renderListItem(pubModel)); }
        }
        return collector;
    }

    // attributes: {
    //     "com.openexchange.share.extendedPermissions": [
    //         {entity: 23, bits: 4227332, type: "user", display_name: "Olaf Felka", contact: {…}},
    //         {entity: 24, bits: 403710016, type: "user", display_name: "Peter Seliger", contact: {…}},
    //         {entity: 102, bits: 257, type: "guest", contact: {…}}
    //     ]
    // }
    //
    // 0 : {entity: 23,  bits: 4227332,   type: "user",      display_name: "Olaf Felka", contact: {…}}
    // 1 : {entity: 24,  bits: 403710016, type: "user",      display_name: "Peter Seliger", contact: {…}}
    // 2 : {entity: 101, bits: 257,       type: "anonymous", share_url: "http://192.168.56.104/ajax/share/0e3f10b701b69a26e3f10b61b69a43a29b74e4e7d5eca223/1/8/MjQ5", expiry_date: 1516889830676}
    // 3 : {entity: 102, bits: 257,       type: "guest",     contact: {…}}

    function getPermissions(baton) {
        return _.chain(
            baton.model.getPermissions()
        )
        // ignore current user - only necessary for folders
        .reject(function (data) { return data.type === 'user' && data.entity === ox.user_id; })
        .pluck('type')
        .uniq()
        .value();
    }

    function hasUser(baton) {
        return _(getPermissions(baton)).contains('user') || _(getPermissions(baton)).contains('group');
    }

    function hasGuests(baton) {
        return _(getPermissions(baton)).contains('guest');
    }

    function isPublic(baton) {
        return _(getPermissions(baton)).contains('anonymous');
    }

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
            id: 'share-icon',
            index: 400,
            draw: function (baton) {
                if (_.device('smartphone')) return;

                if (capabilities.has('!gab || alone') && !hasUser(baton)) return;

                var iconClass = 'fa-link',
                    iconTitle = gt('Public link');
                if (hasGuests(baton) && hasUser(baton)) {
                    iconClass = 'fa-user-plus';
                    iconTitle = gt('Internal and external users');
                } else if (hasGuests(baton)) {
                    iconClass = 'fa-user-plus';
                    iconTitle = gt('External users');
                } else if (hasUser(baton)) {
                    iconClass = 'fa-user';
                    iconTitle = gt('Internal users');
                }

                this.append(
                    $('<div class="list-item-column type">').append(
                        $('<i class="fa">')
                            .addClass(iconClass)
                            .attr('title', iconTitle)
                    )
                );
            }
        },
        {
            id: 'breadcrumb',
            index: 800,
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
