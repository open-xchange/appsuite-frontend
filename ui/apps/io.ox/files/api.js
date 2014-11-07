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
