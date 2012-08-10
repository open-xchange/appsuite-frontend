/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author  Tobias Prinz <tobias.prinz@open-xchange.com>
 * @author  Markus Bode <markus.bode@open-xchange.com>
 */

define('plugins/portal/twitter/register',
    ['io.ox/core/extensions',
     'io.ox/oauth/proxy',
     'io.ox/core/flowControl',
     'io.ox/core/strings',
     'io.ox/portal/pulltorefresh',
     'gettext!plugins/portal/twitter',
     'less!plugins/portal/twitter/style.css'], function (ext, proxy, control, strings, ptr, gt) {

    'use strict';

    var extensionId = 'twitter';
    var loadEntriesPerPage = 20;
    var offset = 0;
    var $tweets = $('<div>').addClass('twitter');
    var $busyIndicator = $('<div>').html('&nbsp;');

    var parseTweet = function (text, entities) {
        var offsets = {};

        _(entities.hashtags).each(function (hashtag) {
            var elem = $('<a>', {href: 'https://twitter.com/#!/search/%23' + hashtag.text, target: '_blank'}).text('#' + hashtag.text);
            offsets[hashtag.indices[0]] = {
                elem: elem,
                indices: hashtag.indices
            };
        });
        _(entities.urls).each(function (url) {
            var elem = $('<a>', {href: url.expanded_url, target: '_blank'}).text(url.display_url);
            offsets[url.indices[0]] = {
                elem: elem,
                indices: url.indices
            };
        });
        _(entities.user_mentions).each(function (user_mention) {
            var elem = $('<a>', {href: 'https://twitter.com/#!/' + user_mention.screen_name, target: '_blank'}).text('@' + user_mention.screen_name);
            offsets[user_mention.indices[0]] = {
                elem: elem,
                indices: user_mention.indices
            };
        });

        var keySet = _(offsets).keys().sort(function (a, b) {return a - b; });

        var bob = $('<span>');
        var cursor = 0;
        _(keySet).each(function (key) {
            var element = offsets[key];
            bob.append(_.escape(text.substring(cursor, element.indices[0]))).append(element.elem);
            cursor = element.indices[1];
        });

        if (cursor < text.length) {
            bob.append(_.escape(text.substr(cursor, text.length)));
        }

        return bob;
    };
    var loadFromTwitter = function (params) {
        var def = proxy.request({api: 'twitter', url: 'https://api.twitter.com/1/statuses/home_timeline.json', params: params});
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
    var loadTile = function () {
        return loadFromTwitter({count: 1, include_entities: true});
    };
    var drawTile = function (tweets, $node) {
        if (!tweets) {
            return;
        }
        if (tweets.length === 0) {
            $node.append(
                $('<div class="io-ox-portal-preview">').text(gt('No tweets yet.')));
        } else {
            var tweet = tweets[0];
            var message = $('<div>').html(tweet.text).text();
            $node.append(
                $('<div>').append($('<b>').text('@' + tweet.user.name + ':')),
                $('<div class="io-ox-portal-preview">').text(strings.shorten(message, 120)));
        }
    };

    var loadTweets = function (count, offset, newerThanId) {
        var params = {'include_entities': true};
        if (offset) {
            params.max_id = offset;
            // increment because max_id is inclusive and we're going to ignore the first tweet in our result
            params.count = count + 1;
        }

        if (newerThanId) {
            params.since_id = newerThanId;
        } else {
            params.count = count;
        }

        return loadFromTwitter(params);
    };

    var showTweet = function (tweet) {
        var tweetLink = 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;
        var profileLink = 'https://twitter.com/' + tweet.user.screen_name;

        return $('<div class="tweet">')
            .data('entry', tweet)
            .append($('<a>', {href: tweetLink, target: '_blank'})
                .append($('<img>', {src: tweet.user.profile_image_url, 'class': 'profilePicture', alt: tweet.user.description})))
            .append($('<div class="text">')
                .append($('<a>', {'class': 'name', href: profileLink, target: '_blank'}).text(tweet.user.name))
                .append('<br />')
                .append(parseTweet(tweet.text, tweet.entities)));
    };

    var onPullToRefresh = function () {
        offset = 0;
        var $first = $('div.tweet:first');
        var newestId = $first.data('entry').id_str;
        $tweets.addClass('pulltorefresh-refreshing');

        loadTweets(0, 0, newestId)
            .done(function (j) {
                console.log("New Tweets: " + j.length);
                j.reverse();
                _(j).each(function (tweet) {
                    showTweet(tweet).prependTo($tweets);
                });

                var $o = $('div.window-content');
                var top = $o.scrollTop() - $o.offset().top + $first.offset().top;
                $o.animate({scrollTop: top}, 250, 'swing');
                $tweets.removeClass('pulltorefresh-refreshing');
            })
            .fail(function () {
                $tweets.removeClass('pulltorefresh-refreshing');
            });
    };

    ext.point('io.ox/portal/widget').extend({
        id: extensionId,
        index: 140,
        tileHeight: 2,
        title: "Twitter",
        icon: 'apps/plugins/portal/twitter/twitter-bird-dark-bgs.png',
        background: '#49f',
        color: 'bright',
        preview: function () {
            var deferred = $.Deferred();
            loadTile().done(function (tweets) {
                if (!tweets) {
                    deferred.resolve(control.CANCEL);
                    return;
                }
                var $node = $('<div>');
                drawTile(tweets, $node);
                deferred.resolve($node);
            }).fail(function () {
                deferred.resolve(control.CANCEL);
                return;
            });
            return deferred;
        },

        load: function () {
            return loadFromTwitter({count: loadEntriesPerPage, include_entities: true});
        },
        draw: function (timeline) {
            // Pull to refresh
            $(this).on('onResume', function () {
                $(this).on('onPullToRefresh', onPullToRefresh);
                ptr.attachEvents($('div.window-content'), $(this), $tweets);
            }).on('onPause', function () {
                $(this).off('onPullToRefresh', onPullToRefresh);
                ptr.detachEvents();
            }).on('onPullToRefreshDown', function () {
                $('div.tweet > div.text').addClass('pulltorefresh-unselectable');
                $('div.tweet > div.text > span').addClass('pulltorefresh-unselectable');
            }).on('onPullToRefreshUp', function () {
                $('div.tweet > div.text').removeClass('pulltorefresh-unselectable');
                $('div.tweet > div.text > span').removeClass('pulltorefresh-unselectable');
            });

            if (!timeline) {
                this.remove();
                return $.Deferred().resolve();
            }
            var self = this;

            self.empty().append($('<div>').addClass('clear-title').text('Twitter'));
            $tweets.empty();

            $tweets.appendTo(self);
            $busyIndicator.appendTo(self);

            _(timeline).each(function (tweet) {
                offset = tweet.id_str;
                showTweet(tweet).appendTo($tweets);
            });

            return $.Deferred().resolve();
        },
        loadMoreResults: function (finishFn) {
            $busyIndicator.addClass('io-ox-busy');

            loadTweets(loadEntriesPerPage, offset)
                .done(function (j) {
                    j = j.slice(1);
                    _(j).each(function (tweet) {
                        offset = tweet.id_str;
                        showTweet(tweet).appendTo($tweets);
                    });
                    finishFn($busyIndicator);
                })
                .fail(function () {
                    finishFn($busyIndicator);
                });
        }
    });
});
