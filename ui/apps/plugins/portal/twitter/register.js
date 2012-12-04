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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 * @author Markus Bode <markus.bode@open-xchange.com>
 */

define('plugins/portal/twitter/register',
    ['io.ox/core/extensions',
     'io.ox/oauth/proxy',
     'io.ox/core/flowControl',
     'io.ox/core/strings',
     'io.ox/portal/pulltorefresh',
     'io.ox/keychain/api',
     'gettext!plugins/portal',
     'io.ox/core/notifications',
     'io.ox/core/date',
     'less!plugins/portal/twitter/style.css'], function (ext, proxy, control, strings, ptr, keychain, gt, notifications, date) {

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
        if (tweet.retweeted_status) {
            var $temp = renderTweet(tweet.retweeted_status);
            $temp.find('.text').append(
                $('<div class="io-ox-twitter-retweet-source">').append(
                    $('<i class="icon-retweet">'),
                    " ",
                    $('<span>').text(gt('Retweeted by %s', tweet.user.screen_name))
                )
            );
            return $temp;
        }
        return renderTweet(tweet);
    };

    function parseDate(str) {
        var v = str.split(' ');
        return new Date(Date.parse(v[1] + ' ' + v[2] + ', ' + v[5] + ' ' + v[3] + ' UTC'));
        // thx for having exactly the same problem:
        // http://stackoverflow.com/questions/3243546/problem-with-javascript-date-function-in-ie-7-returns-nan
    }

    var renderTweet = function (tweet) {
        var tweetLink = 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;
        var profileLink = 'https://twitter.com/' + tweet.user.screen_name;
        console.log('date', tweet.created_at);
        var tweeted = new date.Local(parseDate(tweet.created_at)).format(date.DATE_TIME);
        var $myTweet = $('<div class="tweet">').data('entry', tweet).append(
            $('<a class="io-ox-twitter-follow btn btn-small" href="https://twitter.com/intent/user">').append(
                '<i>&nbsp;</i>',
                $('<span>').text(gt('Follow'))
            ),
            $('<a>').attr({href: profileLink}).append(
                $('<img>', {src: tweet.user.profile_image_url, 'class': 'profilePicture', alt: tweet.user.description})
            ),
            $('<div class="text">').append(
                $('<strong class="io-ox-twitter-name">').text(tweet.user.name),
                '<br />',
                $('<a>', {'class': 'name', href: profileLink, target: '_blank'}).text('@' + tweet.user.screen_name),
                '<br />',
                parseTweet(tweet.text, tweet.entities)
            ),
            $('<div class="io-ox-twitter-details">').append(
                $('<a>').attr({'class': 'io-ox-twitter-date', 'href': tweetLink, 'target': '_blank'}).text(tweeted),
                $('<a>').attr({'class': 'io-ox-twitter-reply', 'href': 'https://twitter.com/intent/tweet?in_reply_to=' + tweet.id_str}).text(gt('Reply')),
                $('<a>').attr({'class': 'io-ox-twitter-retweet', 'href': "https://twitter.com/intent/retweet?tweet_id=" + tweet.id_str}).text(gt('Retweet')),
                $('<a>').attr({'class': 'io-ox-twitter-favorite', 'href': "https://twitter.com/intent/favorite?tweet_id=" + tweet.id_str}).text(gt('Favorite'))
            )
        );
        if (tweet.favorited) {
            $myTweet.find('.io-ox-twitter-favorite').addClass('favorited').text(gt('Favorited'));
        }
        if (tweet.retweeted) {
            $myTweet.find('.io-ox-twitter-retweet').addClass('retweeted').text(gt('Retweeted'));
        }
        return $myTweet;
    };

    var onPullToRefresh = function () {
        offset = 0;
        var $first = $('div.tweet:first');
        var newestId = $first.data('entry').id_str;
        $tweets.addClass('pulltorefresh-refreshing');

        $.when(loadTweets(0, 0, newestId), _.wait(500))
            .done(function (j) {
                j.reverse();
                _(j).each(function (tweet) {
                    showTweet(tweet).prependTo($tweets);
                });

                var $o = $('div.io-ox-sidepopup-pane');
                var top = $o.scrollTop() - $o.offset().top + $first.offset().top;
                $o.animate({scrollTop: top}, 250, 'swing');
                $tweets.removeClass('pulltorefresh-refreshing');
            })
            .fail(function () {
                $tweets.removeClass('pulltorefresh-refreshing');
                notifications.yell('error', gt('Could not load new tweets.'));
            });
    };

    ext.point('io.ox/portal/widget/twitter').extend({

        title: "Twitter",

        action: function (baton) {
            window.open('https://twitter.com/', 'twitter');
        },

        isEnabled: function () {
            return keychain.isEnabled('twitter');
        },

        requiresSetUp: function () {
            return keychain.isEnabled('twitter') && ! keychain.hasStandardAccount('twitter');
        },

        performSetUp: function () {
            var win = window.open(ox.base + "/busy.html", "_blank", "height=400, width=600");
            return keychain.createInteractively('twitter', win);
        },

        load: function (baton) {
            return loadFromTwitter({ count: loadEntriesPerPage, include_entities: true }).done(function (data) {
                baton.data = data;
            });
        },

        preview: function (baton) {

            if (!baton.data) { return; }

            var content = $('<div class="content pointer">');

            if (baton.data.length === 0) {
                content.append(
                    $('<div class="paragraph">').text(gt('No tweets yet.'))
                );
            } else {
                _(baton.data).each(function (tweet) {
                    var message = String(tweet.text).replace(/((#|@)\w+)/g, '<span class="accent">$1</span>');
                    content.append(
                        $('<div class="paragraph">').append(
                            $('<span class="bold">').text('@' + tweet.user.name + ': '),
                            $('<span class="normal">').html(message)
                        )
                    );
                });
            }

            this.append(content);
        },


        draw: function (baton) {

            var timeline = baton.data;

            // Pull to refresh
            $(this).on('onResume', function () {
                $(this).on('onPullToRefresh', onPullToRefresh);
            }).on('onPause', function () {
                $(this).off('onPullToRefresh', onPullToRefresh);
                ptr.detachEvents();
            }).on('onPullToRefreshDown', function () {
                $('div.tweet > div.text').addClass('pulltorefresh-unselectable');
                $('div.tweet > div.text > span').addClass('pulltorefresh-unselectable');
            }).on('onPullToRefreshUp', function () {
                $('div.tweet > div.text').removeClass('pulltorefresh-unselectable');
                $('div.tweet > div.text > span').removeClass('pulltorefresh-unselectable');
            }).on('onAppended', function () {
                ptr.attachEvents($('div.io-ox-sidepopup-pane'), $(this), $tweets);
            });

            if (!timeline) {
                this.remove();
                return;
            }

            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://platform.twitter.com/widgets.js'; //TODO must be stored locally, even if the Twitter guys hate us

            this.empty().append(
                $('<a>').text(gt('Tweet')).attr({
                    href: 'https://twitter.com/intent/tweet',
                    target: '_blank',
                    'class': 'twitter-share-button io-ox-twitter-action-tweet',
                    'data-count': 'none',
                    'data-size': 'large'
                }),
                $('<div>').addClass('clear-title').text('Twitter'),
                script
            );

            this.append($tweets.empty(), $busyIndicator);

            _(timeline).each(function (tweet) {
                offset = tweet.id_str;
                showTweet(tweet).appendTo($tweets);
            });
        },

        loadMoreResults: function (finishFn) {
            $busyIndicator.addClass('io-ox-busy');

            $.when(loadTweets(loadEntriesPerPage, offset), _.wait(500))
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
        },

        drawCreationDialog: function () {
            var $node = $(this);
            $node.append(
                $('<h1>').text('Twitter'),
                $('<div class="io-ox-portal-preview centered">').append(
                    $('<div>').text(gt('Add your account'))
                )
            );
        }
    });
});
