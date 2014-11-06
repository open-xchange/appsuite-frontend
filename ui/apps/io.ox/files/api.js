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
    'io.ox/core/api/collection-pool',
    'io.ox/core/api/collection-loader',
    'settings!io.ox/core'
], function (Pool, CollectionLoader, coreConfig) {

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

    return api;

});
