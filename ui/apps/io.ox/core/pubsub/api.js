/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2013
 * Mail: info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/core/pubsub/api',
    ['io.ox/core/api/pubsub',
     'io.ox/core/config',
     'io.ox/core/api/folder',
     'io.ox/core/pubsub/model',
     'gettext!io.ox/mail'], function (api, config, folderApi, model, gt) {

    'use strict';

    var util = {
        /**
         * get publication collection (backbone)
         * @returns  {deferred} collection
         */
        getCollection: function () {
            return model.publications();
        },

        /**
         * create
         * @param  {string} module id
         * @param  {string|number} folder id
         * @param  {string} url
         * @return {deferred} subscription id
         */
        createSubscription: function (module, folder, url, options) {
            var dynkey = {}, o;
            //default values with dynamic keys (workaround)
            dynkey['com.openexchange.subscribe.microformats.' + module + '.http'] = { url: url };
            //extend
            o = $.extend({
                source: 'com.openexchange.subscribe.microformats.' + module + '.http',
                folder: folder,
                entityModule: module,
                entity: {
                    folder: folder
                }
            }, dynkey, options || {});
            //create subscription
            return api.subscriptions.create(o)
                .then(function (id) {
                    //add to collection
                    var collection = util.getCollection();
                    o.id = id;
                    collection.add(new model.Subscription(o));
                    return id;
                });
        },

        /**
         * refresh
         * @param  {object} data id and folder
         * @return {deferred} number of items
         */
        refreshSubscription: function (data) {
            return api.subscriptions.refresh(data);
        },

        /**
         * create and refresh subscription
         * @param  {string} module id
         * @param  {string|number} folder id
         * @param  {string} url
         * @param  {object} options (optional)
         * @return {deferred} subscription id and number of items
         */
        initSubscription: function (module, folder, url, options) {
            return util.createSubscription(module, folder, url, options)
                    .pipe(function (subscription) {
                        //refresh
                        return util.refreshSubscription({id: subscription, folder: folder})
                        .pipe(function (items) {
                            return {subscription: subscription, items: items};
                        });
                    });
        },

        /**
         * create folder; create and refresh subscription
         * @param  {string} module id
         * @param  {string} name of folder
         * @param  {string} url
         * @param  {object} options (optional)
         * @return {deferred} subscription id and number of items
         */
        autoSubscribe: function (module, name, url, options) {
            var parent = config.get('folder.' + module),
                folder = '';
            //create folder
            return folderApi.create({
                            folder: parent,
                            data: {
                                title: name || gt('New folder'),
                                module: module
                            }
                        })
                        .pipe(function (data) {
                            //create and refresh subscription
                            folder = data.id;
                            return util.initSubscription(module, folder, url, options);
                        });
        }
    };
    return util;
});