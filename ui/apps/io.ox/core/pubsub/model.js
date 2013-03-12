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
            syncer: {
                create: function (model) {
                    return api.publications.create(model.attributes);
                },
                read: function (model) {
                    return api.publications.get({id: model.id});
                },
                update: function (model) {
                    return api.publications.update(model.attributes);
                },
                destroy: function (model) {
                    return api.publications.destroy(model.id);
                }
            }
        }),
        Subscription = BasicModel.extend({
            ref: 'io.ox/core/pubsub/subscription/',
            url: function () {
                return this.attributes[this.attributes.source].url;
            },
            syncer: {
                create: function (model) {
                    return api.subscriptions.create(model.attributes);
                },
                read: function (model) {
                    return api.subscriptions.get({id: model.id});
                },
                update: function (model) {
                    return api.subscriptions.update(model.attributes);
                },
                destroy: function (model) {
                    return api.subscriptions.destroy(model.id);
                }
            }
        }),
        Publications = Backbone.Collection.extend({
            model: Publication,
            initialize: function () {
                this.on('remove', function (model, collection, opt) {
                    model.destroy();
                });
            },
            sync: function (method, collection, options) {
                if (method !== 'read') return;

                return api.publications.getAll().then(function (res) {
                    _(res).each(function (obj) {
                        var pub = new Publication(obj);
                        pub.fetch().then(function (pub) {
                            return collection.add(pub);
                        });
                    });
                    return collection;
                });
            },
            /**
             * get a list of items for a folder
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
                return publication.get('displayName');
            }
        }),
        Subscriptions = Backbone.Collection.extend({
            model: Subscription,
            initialize: function () {
                this.on('remove', function (model, collection, opt) {
                    model.destroy();
                });
            },
            sync: function (method, collection, options) {
                if (method !== 'read') return;

                return api.subscriptions.getAll().then(function (res) {
                    _(res).each(function (obj) {
                        var sub = new Subscription(obj);
                        sub.fetch().then(function (sub) {
                            return collection.add(sub);
                        });
                    });
                    return collection;
                });
            },
            /**
             * get a list of items for a folder
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
            comparator: function (subscription) {
                return subscription.get('displayName');
            }
        }),
        //singleton instances
        publications, subscriptions;

    function filterFolder(folder) {
        return this.where({folder: folder.folder_id});
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

    return {
        Publication: Publication,
        publications: function () {
            if (!publications) {
                publications = new Publications();
                publications.fetch();
            }

            return publications;
        },
        subscriptions: function () {
            if (!subscriptions) {
                subscriptions = new Subscriptions();
                subscriptions.fetch();
            }

            return subscriptions;
        },
        Subscription: Subscription
    };
});
