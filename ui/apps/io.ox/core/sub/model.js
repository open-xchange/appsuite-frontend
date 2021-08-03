/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/sub/model', [
    'io.ox/core/extensions',
    'io.ox/backbone/basicModel',
    'io.ox/core/api/sub',
    'io.ox/core/folder/api',
    'io.ox/settings/util',
    'gettext!io.ox/core/sub'
], function (ext, BasicModel, api, folderAPI, settingsUtil, gt) {

    'use strict';

    function createSyncer(api) {
        return {
            create: function (model) {
                return settingsUtil.yellOnReject(
                    api.create(model.attributes)
                );
            },
            read: function (model) {
                return api.get({ id: model.id, folder: model.get('folder') });
            },
            update: function (model) {
                return settingsUtil.yellOnReject(
                    api.update(model.attributes)
                );
            },
            destroy: function (model) {
                return settingsUtil.yellOnReject(
                    api.destroy(model.id)
                );
            }
        };
    }

    var Subscription = BasicModel.extend({
            ref: 'io.ox/core/sub/subscription/',
            url: function () {
                return this.attributes[this.attributes.source].url;
            },
            source: function () {
                return this.attributes[this.attributes.source];
            },
            setSource: function (source, obj) {
                delete this.attributes[this.attributes.source];
                this.attributes.source = source.id;
                this.attributes[this.attributes.source] = obj || {};
            },
            /**
             * Get the state concerning refresh.
             *
             * Knows three different states:
             * - 'ready' - ready to perform a refresh
             * - 'pending' - performing a refresh at the moment
             * - 'done' - refresh is already done
             *
             * @return { string} - the state
             */
            refreshState: function () {
                return this._refresh ? this._refresh.state() : 'ready';
            },
            performRefresh: function () {
                var self = this;
                if (this.refreshState() === 'ready') {
                    api.subscriptions.refresh(this)
                    .always(function (data) {
                        self.set('errors', data.error ? 'true' : 'false');
                        folderAPI.refresh();
                    });
                    return (this._refresh = _.wait(5000));
                }
                return this._refresh;
            },
            syncer: createSyncer(api.subscriptions)
        }),
        PubSubCollection = {
            factory: function (api) {
                return Backbone.Collection.extend({
                    initialize: function () {
                        var collection = this;
                        api.on('refresh:all', function () {
                            collection.fetch();
                        });
                        this.on('change:enabled', function (model) {
                            model.collection.sort();
                        });
                    },
                    sync: function (method, collection) {
                        if (method !== 'read') return;
                        var self = this;

                        return api.getAll().then(function (res) {
                            _(res).each(function (obj) {
                                var my_model = new self.model(obj);
                                my_model.fetch().then(function (my_model) {
                                    return collection.add(my_model);
                                });
                            });
                            collection.each(function (model) {
                                if (model && _(res).where({ id: model.id }).length === 0) {
                                    collection.remove(model);
                                }
                            });
                            return collection;
                        });
                    },
                    /**
                     * get a list of items for a folder
                     *
                     * If no folder is provided, all items will be returned.
                     *
                     * Use it like:
                     * <code>
                     *   model.collection.forFolder({ folder_id: 2342 });
                     * </code>
                     *
                     * @param {object} - an object containing a folder_id attribute
                     * @return [model] - an array containing matching model objects
                     */
                    forFolder: filterFolder,
                    comparator: function (publication) {
                        return !publication.get('enabled') + String(publication.get('displayName')).toLowerCase();
                    }
                });
            }
        },
        Subscriptions = PubSubCollection.factory(api.subscriptions).extend({
            model: Subscription
        }),
        //singleton instances
        subscriptions;

    function filterFolder(folder) {
        var filter = String(folder.folder_id || folder.folder || '');

        if (!filter) { return this.toArray(); }

        return this.filter(function (e) {
            return (e.get('entity') || { folder: e.get('folder') }).folder === filter;
        });
    }

    ext.point('io.ox/core/sub/subscription/validation').extend({
        validate: function (obj, errors) {
            var ref = obj[obj.source];
            if (!ref) return errors.add(obj.source, gt('Model is incomplete.'));

            _((obj.service || {}).formDescription).each(function (field) {
                if (!field.mandatory || ref[field.name]) return;
                //#. %1$s is a name/label of an input field (for example: URL or Login)
                //#, c-format
                errors.add(obj.source, gt('%1$s must not be empty.', field.displayName));
            });
        }
    });

    return {
        subscriptions: function () {
            if (!subscriptions) {
                subscriptions = new Subscriptions();
            }
            subscriptions.fetch();

            return subscriptions;
        },
        Subscription: Subscription
    };
});
