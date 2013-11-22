/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/core/pubsub/util',
    ['io.ox/core/api/pubsub',
     'settings!io.ox/core',
     'io.ox/core/api/folder',
     'io.ox/core/pubsub/model',
     'gettext!io.ox/mail'
    ], function (api, coreConfig, folderAPI, model, gt) {

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
            var parent = coreConfig.get('folder/' + module),
                folder = '';
            //create folder
            return folderAPI.create({
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
