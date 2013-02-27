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

define('io.ox/pubsub/util',
    ['io.ox/core/api/pubsub',
     'io.ox/core/config',
     'io.ox/core/api/folder',
     'gettext!io.ox/mail'], function (api, config, folderApi, gt) {

    'use strict';

    var util = {
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
            return api.subscription.create(o);
        },

        /**
         * refresh
         * @param  {string|number} subscription id
         * @param  {string|number} folder id
         * @return {deferred} number of items
         */
        refreshSubscription: function (subscription, folder) {
            return api.subscription.refresh(subscription, folder);
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
                    return util.refreshSubscription(subscription, folder)
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