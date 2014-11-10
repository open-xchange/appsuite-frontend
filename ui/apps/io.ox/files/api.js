/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 *
 */

define('io.ox/files/api', [
    'io.ox/core/http',
    'io.ox/core/api/collection-pool',
    'io.ox/core/api/collection-loader',
    'settings!io.ox/core'
], function (http, Pool, CollectionLoader, coreConfig) {

    'use strict';

    var pool = Pool.create('files');

    var allColumns = '20,23,1,5,700,702,703,704,705,707,3';

    var api = {};
    api.pool = pool;
    api.collectionLoader = new CollectionLoader({
        module: 'files',
        getQueryParams: function (params) {
            return {
                action: 'all',
                folder: params.folder || coreConfig.get('folder/infostore'),
                columns: allColumns,
                extendColumns: 'io.ox/files/api/all',
                sort: '702',
                order: params.order || 'asc'
            };
        }
    });

    api.get = function (options) {
        var model = pool.get('detail').get(_.cid(options));

        if (model) return $.when(model);

        return http.GET({
            module: 'files',
            params: {
                action: 'get',
                id: options.id,
                folder: options.folder_id || options.folder,
                timezone: 'UTC'
            }
        }).then(function (data) {
            return pool.add('detail', data).get(_.cid(data));
        });
    };

    pool.get('detail').on('add', function (model) {
        api.versions(model.attributes);
    });

    var lockToggle = function (list, action) {
        // allow single object and arrays
        list = _.isArray(list) ? list : [list];
        // pause http layer
        http.pause();
        // process all updates
        _(list).map(function (o) {
            return http.PUT({
                module: 'files',
                params: {
                    action: action,
                    id: o.id,
                    folder: o.folder_id || o.folder,
                    timezone: 'UTC'
                    // Use 10s diff for debugging purposes
                    // diff: 10000
                },
                appendColumns: false
            });
        });

        // resume & trigger refresh
        return http.resume().done(function () {
            api.collectionLoader.reload(list[0]);
        });
    };

    /**
     * unlocks files
     * @param  {array} list
     * @return { deferred }
     */
    api.unlock = function (list) {
        list = _.isArray(list) ? list : [list];
        http.pause();
        list.forEach(function (o) {
            pool.propagate('change', _.extend({
                locked_until: 0
            }, o));
        });
        return http.resume();
    };

    /**
     * locks files
     * @param  {array} list
     * @return { deferred }
     */
    api.lock = function (list) {
        return lockToggle(list, 'lock');
    };

    /**
     * returns versions
     * @param  {object} options
     * @param  {string} options.id
     * @return { deferred }
     */
    api.versions = function (options) {
        var cid = _.cid(options),
            model = pool.get('detail').get(cid);

        if (model && model.get('versions')) return $.when(model.get('versions'));

        return http.GET({
            module: 'files',
            params: _.extend({ action: 'versions', timezone: 'utc' }, options),
            appendColumns: true
        })
        .done(function (data) {
            if (model) {
                model.set('versions', data);
            } else {
                pool.add('detail', _.extend({
                    versions: data
                }, options));
            }
        });
    };

    return api;

});
