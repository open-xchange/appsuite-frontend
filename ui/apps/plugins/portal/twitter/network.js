define('plugins/portal/twitter/network', ['io.ox/oauth/proxy'], function (proxy) {

    'use strict';

    var network = {};

    network.sendTweet = function (params) {
        return proxy.request({ api: 'twitter', url: 'https://api.twitter.com/1.1/statuses/update.json', params: params, type: 'POST' });
    };

    network.favoriteTweed = function (params) {
        return proxy.request({ api: 'twitter', url: 'https://api.twitter.com/1.1/favorites/create.json', params: params, type: 'POST' });
    };

    network.unFavoriteTweed = function (params) {
        return proxy.request({ api: 'twitter', url: 'https://api.twitter.com/1.1/favorites/destroy.json', params: params, type: 'POST' });
    };

    network.retweet = function (tweet_id_str) {
        return proxy.request({ api: 'twitter', url: 'https://api.twitter.com/1.1/statuses/retweet/' + tweet_id_str + '.json', type: 'POST' });
    };

    network.deleteRetweet = function (tweet_id_str) {
        return proxy.request({ api: 'twitter', url: 'https://api.twitter.com/1.1/statuses/show.json', params: { id: tweet_id_str, include_my_retweet: true }, type: 'GET' }).then(function success(data) {
            var obj = JSON.parse(data);

            return network.deleteTweet(obj.current_user_retweet.id_str);
        }, function fail(error) {
            return error;
        });
    };

    network.followUser = function (params) {
        return proxy.request({ api: 'twitter', url: 'https://api.twitter.com/1.1/friendships/create.json', params: params, type: 'POST' });
    };

    network.unfollowUser = function (params) {
        return proxy.request({ api: 'twitter', url: 'https://api.twitter.com/1.1/friendships/destroy.json', params: params, type: 'POST' });
    };

    network.deleteTweet = function (tweet_id_str) {
        return proxy.request({ api: 'twitter', url: 'https://api.twitter.com/1.1/statuses/destroy/' + tweet_id_str + '.json', type: 'POST' });
    };

    network.loadFromTwitter = function (params) {
        var def = proxy.request({ api: 'twitter', url: 'https://api.twitter.com/1.1/statuses/home_timeline.json', params: params });
        return def.pipe(function (response) {
            if (response) {
                var jsonResponse = JSON.parse(response);

                if (!jsonResponse.error) {
                    return jsonResponse;
                } else {
                    return {};
                }
            } else {
                return {};
            }
        });
    };

    network.fetchUserID = function () {
        return proxy.request({ api: 'twitter', url: 'https://api.twitter.com/1.1/account/verify_credentials.json', type: 'GET' }).then(function success(response) {
            var jsonResponse = JSON.parse(response);

            if (!jsonResponse.errors) {
                return jsonResponse.id_str;
            }
        }, function fail(error) {
            return error;
        });
    };

    return network;
});
