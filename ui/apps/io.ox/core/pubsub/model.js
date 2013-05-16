/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2013
 * Mail: info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/pubsub/model',
    ['io.ox/core/extensions',
     'io.ox/backbone/basicModel',
     'io.ox/core/api/pubsub',
     'gettext!io.ox/core/pubsub'
    ],
    function (ext, BasicModel, api, gt) {

    'use strict';

    function createSyncer(api) {
        return {
            create: function (model) {
                return api.create(model.attributes);
            },
            read: function (model) {
                return api.get({id: model.id, folder: model.get('folder')});
            },
            update: function (model) {
                return api.update(model.attributes);
            },
            destroy: function (model) {
                return api.destroy(model.id);
            }
        };
    }

    var Publication = BasicModel.extend({
            ref: 'io.ox/core/pubsub/publication/',
            defaults: {
                entity: {},
                entityModule: '',
                target: ''
            },
            url: function () {
                return this.attributes[this.attributes.target].url;
            },
            syncer: createSyncer(api.publications)
        }),
        Subscription = BasicModel.extend({
            ref: 'io.ox/core/pubsub/subscription/',
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
             * @return {string} - the state
             */
            refreshState: function () {
                return this._refresh ? this._refresh.state() : 'ready';
            },
            performRefresh: function () {
                if (this.refreshState() === 'ready') {
                    return (this._refresh = _.wait(5000));
                }  else {
                    return this._refresh;
                }
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
                        this.on('change:enabled', function (model, value, opt) {
                            model.collection.sort();
                        });
                    },
                    sync: function (method, collection, options) {
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
                                if (_(res).where({id: model.id}).length === 0) {
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
                     *   model.collection.forFolder({folder_id: 2342});
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
        Publications = PubSubCollection.factory(api.publications).extend({
            model: Publication
        }),
        Subscriptions = PubSubCollection.factory(api.subscriptions).extend({
            model: Subscription
        }),
        //singleton instances
        publications, subscriptions;

    function filterFolder(folder) {
        var filter = String(folder.folder_id || folder.folder || '');

        if (!filter) { return this.toArray(); }

        return this.filter(function (e) {
            return (e.get('entity') || {folder: e.get('folder')}).folder === filter;
        });
    }

    ext.point('io.ox/core/pubsub/publication/validation').extend({
        validate: function (obj, errors) {
            if (!obj.target) {
                errors.add(gt('Publication must have a target.'));
                return;
            }
            if ((obj[obj.target] || {}).siteName === '') {
                errors.add(gt('Publication must have a site.'));
            }
        }
    });

    ext.point('io.ox/core/pubsub/subscription/validation').extend({
        validate: function (obj, errors) {
            var ref = obj[obj.source];
            if (!ref) { errors.add(gt('Model is incomplete.')); return; }
            if (ref === {} || (!ref.login || !ref.password) && !ref.account && !ref.url) {
                errors.add(gt('You have to enter a username and password to subscribe.'));
                return;
            }
        }
    });

    return {
        Publication: Publication,
        publications: function () {
            if (!publications) {
                publications = new Publications();
            }
            publications.fetch();

            return publications;
        },
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
