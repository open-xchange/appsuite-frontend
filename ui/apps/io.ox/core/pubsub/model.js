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
            syncer: {
                create: function (model) {
                    console.log(model, arguments);
                    return $.when().resolve(true);
                }
            }
        }),
        Subscription = BasicModel.extend({
            ref: 'io.ox/core/pubsub/subscription/'
        }),
        PubSubItems = Backbone.Collection.extend({
            sync: function (method, collection, options) {
                if (method !== 'read') return;

                return api.publications.getAll().then(function (res) {
                    return api.publications.getList(res);
                }).then(function (res) {
                    _(res).each(function (obj) {
                        collection.add(new Publication(obj));
                    });
                    return collection;
                }).then(function (collection) {
                    return api.subscriptions.getAll().then(function (res) {
                        return api.subscriptions.getList(res);
                    }).then(function (res) {
                        _(res).each(function (obj) {
                            collection.add(new Subscription(obj));
                        });
                        return collection;
                    });
                });
            }
        });

    ext.point('io.ox/core/pubsub/publication/validation').extend({
        validate: function (obj, errors) {
            if (!obj.site) {
                errors.add(gt('Publication must have a site.'));
            }

        }
    });

    return {
        Publication: Publication,
        PubSubItems: PubSubItems
    };
});
