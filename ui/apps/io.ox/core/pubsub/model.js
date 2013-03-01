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
                    return api.publications.update(model);
                },
                destroy: function (model) {
                    return api.publications.remove(model.id);
                }
            }
        }),
        Subscription = BasicModel.extend({
            ref: 'io.ox/core/pubsub/subscription/',
            syncer: {
                create: function (model) {
                    return api.subscriptions.create(model.attributes);
                },
                read: function (model) {
                    return api.subscriptions.get({id: model.id});
                },
                update: function (model) {
                    return api.subscriptions.update(model);
                },
                destroy: function (model) {
                    return api.subscriptions.remove(model.id);
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
            }
        });

    ext.point('io.ox/core/pubsub/publication/validation').extend({
        validate: function (obj, errors) {
            if (!obj.target) {
                errors.add(gt('Publication must have a target.'));
                return;
            }
            if (!(obj[obj.target] || {}).siteName) {
                errors.add(gt('Publication must have a site.'));
            }
        }
    });

    return {
        Publication: Publication,
        publications: function () {
            var publications = new Publications();

            return publications.fetch();
        },
        subscriptions: function () {
            var subscriptions = new Subscriptions();

            return subscriptions.fetch();
        },
        Subscription: Subscription
    };
});
