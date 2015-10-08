/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
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
    'io.ox/core/event'
], function (http, Events) {

    'use strict';

    var api = {}, cache = null;

    Events.extend(api);

    /**
     * get all snippets
     * @return { deferred} array of snippet objects
     */
    api.getAll = function () {

        if (cache) return $.Deferred().resolve(cache);

        return http.GET({
            module: 'snippet',
            params: {
                action: 'all'
            }
        })
        .then(
            function success(data) {
                cache = _(data).map(function (sig) {
                    // robustness: snippet migration
                    sig.misc = $.extend({ insertion: 'below' }, sig.misc || {});
                    return sig;
                });
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
        .done(function () {
            cache = null;
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
            api.trigger('refresh.all');
        });
    };

    return api;
});
