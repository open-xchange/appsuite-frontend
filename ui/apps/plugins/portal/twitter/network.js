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

define('plugins/portal/twitter/network', ['io.ox/oauth/proxy'], function (proxy) {

    'use strict';

    var network = {};

    network.sendTweet = function (params) {
        return proxy.request({ api: 'com.openexchange.oauth.twitter', url: 'https://api.twitter.com/1.1/statuses/update.json', params: params, type: 'POST' });
    };

    network.favoriteTweed = function (params) {
        return proxy.request({ api: 'com.openexchange.oauth.twitter', url: 'https://api.twitter.com/1.1/favorites/create.json', params: params, type: 'POST' });
    };

    network.unFavoriteTweed = function (params) {
        return proxy.request({ api: 'com.openexchange.oauth.twitter', url: 'https://api.twitter.com/1.1/favorites/destroy.json', params: params, type: 'POST' });
    };

    network.retweet = function (tweet_id_str) {
        return proxy.request({ api: 'com.openexchange.oauth.twitter', url: 'https://api.twitter.com/1.1/statuses/retweet/' + tweet_id_str + '.json', type: 'POST' });
    };

    network.deleteRetweet = function (tweet_id_str) {
        return proxy.request({ api: 'com.openexchange.oauth.twitter', url: 'https://api.twitter.com/1.1/statuses/show.json', params: { id: tweet_id_str, include_my_retweet: true }, type: 'GET' }).then(function success(data) {
            var obj = JSON.parse(data);

            return network.deleteTweet(obj.current_user_retweet.id_str);
        });
    };

    network.followUser = function (params) {
        return proxy.request({ api: 'com.openexchange.oauth.twitter', url: 'https://api.twitter.com/1.1/friendships/create.json', params: params, type: 'POST' });
    };

    network.unfollowUser = function (params) {
        return proxy.request({ api: 'com.openexchange.oauth.twitter', url: 'https://api.twitter.com/1.1/friendships/destroy.json', params: params, type: 'POST' });
    };

    network.deleteTweet = function (tweet_id_str) {
        return proxy.request({ api: 'com.openexchange.oauth.twitter', url: 'https://api.twitter.com/1.1/statuses/destroy/' + tweet_id_str + '.json', type: 'POST' });
    };

    network.loadFromTwitter = function (params) {
        var def = proxy.request({ api: 'com.openexchange.oauth.twitter', url: 'https://api.twitter.com/1.1/statuses/home_timeline.json', params: params });
        return def.then(function (response) {
            if (response) {
                var jsonResponse = JSON.parse(response);

                if (!jsonResponse.error) {
                    return jsonResponse;
                }
                return {};
            }
            return {};
        });
    };

    network.fetchUserID = function () {
        return proxy.request({ api: 'com.openexchange.oauth.twitter', url: 'https://api.twitter.com/1.1/account/verify_credentials.json', type: 'GET' }).then(function success(response) {
            var jsonResponse = JSON.parse(response);

            if (!jsonResponse.errors) {
                return jsonResponse.id_str;
            }
        });
    };

    return network;
});
