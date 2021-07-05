/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/*
    {
        id: 12, // Set by the backend
        type: 'signature',   // The type of snippet, for easy lookup
        module: 'io.ox/mail', // The module that created the snippet
        displayname: 'My Signature', // A display name
        content: 'This email contains the absolute unchangeable truth, questioning its content is discouraged. \n The Mgt.', // The content of the snippet
        misc: { insertion: above } // Object with misc options
    }
*/
define('io.ox/core/api/snippets', [
    'io.ox/core/http',
    'io.ox/core/event',
    'settings!io.ox/mail'
], function (http, Events, settings) {

    'use strict';

    var api = {}, cache = null, collection = new Backbone.Collection();

    Events.extend(api);

    /**
     * get all snippets
     * @return { deferred} array of snippet objects
     */

    // ensure sig.misc.insertion (migration)
    function fixOutdated(sig) {
        if (_.isString(sig.misc)) sig.misc = JSON.parse(sig.misc);
        sig.misc = $.extend({ insertion: settings.get('defaultSignaturePosition', 'below') }, sig.misc || {});
        return sig;
    }

    api.getCollection = function () {
        return collection;
    };

    api.getAll = function (options) {
        var opt = _.extend({ timeout: 15000 }, options);
        if (cache) return $.Deferred().resolve(cache);

        return http.GET({
            module: 'snippet',
            params: {
                action: 'all'
            },
            // See: bug 62222, OXUIB-823
            timeout: opt.timeout
        })
        .then(
            function success(data) {
                cache = _(data).map(fixOutdated);
                collection.reset(cache);
                return cache;
            },
            function fail() {
                cache = null;
                return [];
            }
        );
    };

    /**
     * create snippet
     * @param  {object} snippet
     * @fires  api#refresh.all
     * @return { deferred} returns snippet id
     */
    api.create = function (snippet) {
        return http.PUT({
            module: 'snippet',
            params: {
                action: 'new'
            },
            data: snippet
        })
        .done(function (id) {
            cache = null;
            collection.add(_({}, snippet, { id: id }));
            api.trigger('refresh.all');
        });
    };

    /**
     * update snippet
     * @param  {object} snippet
     * @fires  api#refresh.all
     * @return { deferred} returns snippet object
     */
    api.update = function (snippet) {
        return http.PUT({
            module: 'snippet',
            params: {
                action: 'update',
                id: snippet.id
            },
            data: snippet
        })
        .done(function () {
            cache = null;
            collection.add(snippet, { merge: true });
            api.trigger('refresh.all');
        });
    };

    /**
     * get snippet
     * @param  {string} id
     * @return { deferred }
     */
    api.get = function (id) {
        return http.GET({
            module: 'snippet',
            params: {
                action: 'get',
                id: id
            }
        });
    };

    /**
     * get snippets
     * @param  {array} ids
     * @return { deferred }
     */
    api.list = function (ids) {
        return http.PUT({
            module: 'snippet',
            params: {
                action: 'list'
            },
            data: ids
        });
    };

    // TODO: Attachment Handling

    /**
     * remove snippets
     * @param  {string} id
     * @fires  api#refresh.all
     * @return { deferred} returns empty object
     */
    api.destroy = function (id) {
        return http.GET({
            module: 'snippet',
            params: {
                action: 'delete',
                id: id
            }
        })
        .done(function () {
            cache = null;
            collection.remove(id);
            api.trigger('refresh.all');
        });
    };

    return api;
});
