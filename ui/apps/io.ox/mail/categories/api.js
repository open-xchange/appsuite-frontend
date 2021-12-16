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

define('io.ox/mail/categories/api', [
    'io.ox/core/http',
    'io.ox/mail/api',
    'settings!io.ox/mail'
], function (http, mailAPI, settings) {

    'use strict';

    function invalidateCollections(options) {
        // flag collections as expired
        var rCategory = new RegExp('categoryid=' + options.target);
        _.each(mailAPI.pool.getCollections(), function (data, id) {
            if (!rCategory.test(id) || !data.collection || !data.collection.expire) return;
            data.collection.expire();
        });
        // TODO: investigate why we have to call gc manually to get it work
        mailAPI.pool.gc();
    }

    var Model = Backbone.Model.extend({

        defaults: function () {
            return {
                unread: 0,
                enabled: true,
                permissions: []
            };
        },

        constructor: function () {
            // fix irritating naming
            Backbone.Model.apply(this, arguments);
            this.attributes.enabled = this.attributes.active;
        },

        toJSON: function () {
            // sync/store only specific properties
            return { id: this.get('id'), name: this.get('name'), active: this.get('enabled') };
        },

        getCount: function () {
            return this.get('unread') === 0 ? '' : this.get('unread');
        },

        can: function (id) {
            return this.get('permissions').indexOf(id) > -1;
        },

        isEnabled: function () {
            return this.get('enabled');
        }
    });

    var Collection = Backbone.Collection.extend({

        model: Model,

        // we don't do this in initialize() since the feature might be unavailable
        initializeRefresh: function () {
            mailAPI.on('after:refresh.unseen after:refresh.seen after:all-seen refresh.all delete move', _.debounce(this.refresh.bind(this), 200));
            this.refresh();
            this.initializeRefresh = _.noop;
        },

        refresh: function () {
            var def = $.Deferred(),
                self = this;
            // defer to ensure mail requests multiple first
            _.defer(function () {
                api.getUnread().then(function (data) {
                    data = _.map(data, function (value, key) {
                        return { id: key, unread: value };
                    });
                    self.add(data, { merge: true });
                    def.resolve();
                });
            });
            return def;
        },

        update: function (list) {
            this.set(list);
            return this.save();
        },

        save: function () {
            return settings.set('categories/list', this.toJSON())
                .save(undefined, { force: true })
                .done(function () {
                    this.trigger('save');
                    this.refresh();
                    invalidateCollections.bind(this, { target: 'general' });
                }.bind(this));
        }
    });

    // plain list of mail addresses
    function getSenderAddresses(data) {
        return _.chain(data)
            .map(function (obj) { return obj.from[0][1]; })
            .uniq()
            .value();
    }

    var api = _.extend({}, Backbone.Events, {

        collection: new Collection(settings.get('categories/list', [])),

        getUnread: function () {
            return http.GET({
                module: 'mail/categories',
                params: {
                    action: 'unread'
                }
            });
        },

        // add mail to category
        move: function (options) {

            if (!options.data || !options.data.length) return $.when();

            var data = _.map(options.data, function (obj) {
                return _.pick(obj, 'id', 'folder_id');
            });

            return http.PUT({
                module: 'mail/categories',
                params: {
                    'action': 'move',
                    'category_id': options.target
                },
                data: data
            })
            .then(function () {
                api.trigger('move', options);
                invalidateCollections(options);
                api.collection.refresh();
            });
        },

        // generate rule(s) to add mail to category
        train: function (options) {

            var opt = _.extend({ past: true, future: true }, options);

            if (!opt.target || !opt.data) return $.when();

            return http.PUT({
                module: 'mail/categories',
                params: {
                    'action': 'train',
                    'category_id': opt.target,
                    'apply-for-existing': opt.past,
                    'apply-for-future-ones': opt.future
                },
                data: {
                    from: getSenderAddresses(options.data)
                }
            })
            .then(function () {
                api.trigger('train', options);
                invalidateCollections(options);
                api.collection.refresh();
            });
        }
    });

    return api;
});
