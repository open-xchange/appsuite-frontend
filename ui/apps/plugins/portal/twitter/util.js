/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('plugins/portal/twitter/util', [
    'plugins/portal/twitter/network',
    'gettext!plugins/portal',
    'io.ox/core/notifications'
], function (network, gt, notifications) {

    'use strict';

    var tweetCache,
        $tweets,
        limit = 280,
        currentUserID;

    var parseTweet = function (text, entities) {
        var offsets = {},
            linkMatches;

        _(entities.hashtags).each(function (hashtag) {
            var elem = $('<a target="_blank" rel="noopener">').attr('href', 'https://twitter.com/#!/search/%23' + hashtag.text).text('#' + hashtag.text);
            offsets[hashtag.indices[0]] = {
                elem: elem,
                indices: hashtag.indices
            };
        });
        _(entities.urls).each(function (url) {
            var elem = $('<a target="_blank" rel="noopener">').attr('href', url.expanded_url).text(url.display_url);
            offsets[url.indices[0]] = {
                elem: elem,
                indices: url.indices
            };
        });
        _(entities.user_mentions).each(function (user_mention) {
            var elem = $('<a target="_blank" rel="noopener">').attr('href', 'https://twitter.com/#!/' + user_mention.screen_name).text('@' + user_mention.screen_name);
            offsets[user_mention.indices[0]] = {
                elem: elem,
                indices: user_mention.indices
            };
        });

        //hack to highligh some t.co-URLs that Twitter does not identify as such:
        linkMatches = text.match(/http:\/\/t\.co\/\w+/gi);
        _(linkMatches).each(function (myLink) {
            var index = text.indexOf(myLink),
                length = myLink.length;
            //make sure there is nothing planned for this part already
            if (_(offsets).keys().indexOf(index.toString()) === -1) {
                offsets[index] = {
                    elem: $('<a>', { href: myLink }).text(myLink),
                    indices: [index, index + length]
                };
            }
        });

        var keySet = _(offsets).keys().sort(function (a, b) { return a - b; });
        var bob = $('<span>');
        var cursor = 0;
        _(keySet).each(function (key) {
            var element = offsets[key];
            bob.append(text.substring(cursor, element.indices[0])).append(element.elem);
            cursor = element.indices[1];
        });

        if (cursor < text.length) {
            bob.append(text.substr(cursor, text.length));
        }

        return bob;
    };

    var showFavoriteTweed = function (tweet, $myTweet) {
        var deferred;

        if (tweet.favorited) {
            deferred = network.unFavoriteTweed({ id: tweet.id_str });
        } else {
            deferred = network.favoriteTweed({ id: tweet.id_str });
        }

        $.when(deferred).then(
            function success(response) {
                var jsonResponse = JSON.parse(response);

                tweet.favorited = !tweet.favorited;
                if (!jsonResponse.errors) {
                    if (tweet.favorited) {
                        $myTweet.find('.io-ox-twitter-favorite')
                            .addClass('favorited')
                            .attr({ 'aria-pressed': 'true' })
                            .text(gt('Favorited'));
                    } else {
                        $myTweet.find('.io-ox-twitter-favorite')
                            .removeClass('favorited')
                            .attr({ 'aria-pressed': 'false' })
                            .text(gt('Favorite'));
                    }
                } else if (_.isArray(jsonResponse.errors)) {
                    notifications.yell('error', jsonResponse.errors[0].message);
                } else {
                    notifications.yell('error', jsonResponse.errors);
                }
            },
            function fail() {
                notifications.yell('error', gt('An internal error occurred'));
            });
    };

    var showRetweet = function (tweet, $myTweet) {
        require(['io.ox/backbone/views/modal'], function (ModalDialog) {
            new ModalDialog({ title: gt('Retweet this to your followers?') })
                .build(function () {
                    this.$body.append(
                        $('<div class="twitter">').append(
                            renderTweet(tweet, { hideLinks: true, hideFollowButton: true })
                        )
                    );
                })
                .addCancelButton()
                .addButton({ label: gt('Retweet'), action: 'retweet' })
                .on('retweet', function () {
                    $.when(network.retweet(tweet.id_str)).then(
                        function success(response) {
                            var jsonResponse = JSON.parse(response);

                            if (!jsonResponse.errors) {
                                $myTweet.find('.io-ox-twitter-retweet')
                                    .addClass('retweeted')
                                    .attr({ 'aria-pressed': 'true' })
                                    .text(gt('Retweeted'));
                                tweet.retweeted = true;
                            } else if (_.isArray(jsonResponse.errors)) {
                                notifications.yell('error', jsonResponse.errors[0].message);
                            } else {
                                notifications.yell('error', jsonResponse.errors);
                            }
                        },
                        function fail() {
                            notifications.yell('error', gt('An internal error occurred'));
                        }
                    );
                })
                .open();
        });
    };

    var showTweet = function (tweet, opt) {
        if (tweet.retweeted_status) {
            var $temp = renderTweet(tweet.retweeted_status, opt);
            $temp.find('.text').append(
                $('<div class="io-ox-twitter-retweet-source">').append(
                    $('<i class="fa fa-retweet" aria-hidden="true">'),
                    ' ',
                    $('<span>').text(gt('Retweeted by %s', tweet.user.screen_name))
                )
            );
            return $temp;
        }
        return renderTweet(tweet, opt);
    };

    var renderTweet = function (tweet, opt) {
        var tweetLink = 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str,
            profileLink = 'https://twitter.com/' + tweet.user.screen_name,
            tweeted = moment(tweet.created_at).format('l LT'),
            $myTweet = $('<li class="tweet">').data('entry', tweet),
            isCurrentUser = tweet.user.id_str === currentUserID,
            hideFollowButton = (opt === undefined || opt.hideFollowButton === undefined || !opt.hideFollowButton),
            hideLinks = (opt === undefined || opt.hideLinks === undefined || !opt.hideLinks);

        if (opt !== undefined && opt.offline) {
            hideFollowButton = true;
            hideLinks = true;
        }

        if (!isCurrentUser && hideFollowButton) {
            $myTweet.append(followButton(tweet));
        }

        $myTweet.append(
            $('<a target="_blank" rel="noopener">').attr('href', profileLink).append(
                $('<img>', { src: tweet.user.profile_image_url_https, 'class': 'profilePicture', alt: tweet.user.description })
            ),
            $('<div class="text">').append(
                $('<strong class="io-ox-twitter-name">').append($('<a target="_blank" rel="noopener">').attr('href', profileLink).text(tweet.user.name)),
                '<br />',
                $('<a class="name" target="_blank" rel="noopener">').attr('href', profileLink).text('@' + tweet.user.screen_name),
                '<br />',
                parseTweet(tweet.text, tweet.entities)
            )
        );

        if (hideLinks) {
            $myTweet.append(
                $('<div class="io-ox-twitter-details">').append(
                    $('<a class="io-ox-twitter-date" target="_blank" rel="noopener">').attr('href', tweetLink).text(tweeted),
                    getReplyLink(tweet, $myTweet),
                    isCurrentUser ? getDeleteLink(tweet, $myTweet) : getRetweetLink(tweet, $myTweet),
                    getFavoriteLink(tweet, $myTweet)
                )
            );

            if (tweet.favorited) {
                $myTweet.find('.io-ox-twitter-favorite').addClass('favorited').text(gt('Favorited'));
            }
            if (tweet.retweeted) {
                $myTweet.find('.io-ox-twitter-retweet').addClass('retweeted').text(gt('Retweeted'));
            }
        }

        return $myTweet;
    };

    var getReplyLink = function (tweet) {
        return $('<a class="io-ox-twitter-reply" role="button">').text(gt('Reply'))
            .attr('href', 'https://twitter.com/intent/tweet?in_reply_to=' + tweet.id_str);
    };

    var getRetweetLink = function (tweet, $myTweet) {
        return $('<a href="#" class="io-ox-twitter-retweet" role="button">').text(gt('Retweet'))
            .on('click', function (e) {
                e.preventDefault();

                if (tweet.retweeted) {
                    network.deleteRetweet(tweet.id_str).then(function success(data) {
                        var jsonResponse = JSON.parse(data);

                        if (!jsonResponse.errors) {
                            $myTweet.find('.io-ox-twitter-retweet')
                                .removeClass('retweeted')
                                .attr({ 'aria-pressed': 'false' })
                                .text(gt('Retweet'));
                        } else if (_.isArray(jsonResponse.errors)) {
                            notifications.yell('error', jsonResponse.errors[0].message);
                        } else {
                            notifications.yell('error', jsonResponse.errors);
                        }
                    }, function fail() {
                        notifications.yell('error', gt('An internal error occurred'));
                    });
                } else {
                    showRetweet(tweet, $myTweet);
                }
            });
    };

    var getDeleteLink = function (tweet, $myTweet) {
        return $('<a href="#" class="io-ox-twitter-delete" role="button">').append(
            $('<i class="fa fa-trash-o" aria-hidden="true">'),
            $('<span>').text(gt('Delete')).on('click', function (e) {
                e.preventDefault();
                deleteTweetDialog(tweet, $myTweet);
            })
        );
    };

    var getFavoriteLink = function (tweet, $myTweet) {
        return $('<a href="#" class="io-ox-twitter-favorite" role="button">').text(gt('Favorite')).on('click', function (e) {
            e.preventDefault();
            showFavoriteTweed(tweet, $myTweet);
        });
    };

    var updateFollowButtons = function (id_str, following) {
        var buttons = $tweets.find('div[user_id="' + id_str + '"]');

        updateFollowButton(buttons, following, false);

        tweetCache.keys().done(function (keys) {
            _(keys).each(function (key) {
                tweetCache.get(key).done(function (tweet) {
                    if (tweet.user.id_str === id_str) {
                        tweet.user.following = following;
                    }
                });
            });
        });
    };

    var updateFollowButton = function (btn, following, hover) {
        //be robust
        following = following || false;

        if (!following) {
            //display usual button
            btn.empty().append(
                //#. twitter: Follow this person
                $('<div>').text(gt('Follow'))
            ).removeClass('btn-primary btn-danger following').attr('aria-pressed', 'false');

        } else if (hover) {
            //display unfollow
            //#. twitter: Stop following this person
            btn.empty().text(gt('Unfollow'))
                .removeClass('btn-primary').addClass('btn-danger following')
                .attr({ 'aria-pressed': 'true' });
        } else {
            //display following
            //#. twitter: already following this person
            btn.empty().text(gt('Following'))
                .removeClass('btn-danger').addClass('btn-primary following')
                .attr({ 'aria-pressed': 'true' });
        }
    };

    var followButton = function (tweet) {
        var btn = $('<div class="io-ox-twitter-follow btn btn-default small" role="button">').attr('user_id', tweet.user.id_str);

        //be robust
        tweet.following = tweet.following || false;

        updateFollowButton(btn, tweet.user.following, false);

        return btn.on('click', function (e) {
            var deferred;

            e.preventDefault();

            if (btn.hasClass('following')) {
                deferred = network.unfollowUser({ user_id: tweet.user.id_str });
            } else {
                deferred = network.followUser({ user_id: tweet.user.id_str });
            }

            $.when(deferred).then(function success(response) {
                var jsonResponse = JSON.parse(response);

                if (!jsonResponse.errors) {
                    tweet.user.following = !btn.hasClass('following');

                    updateFollowButtons(tweet.user.id_str, tweet.user.following);
                } else if (_.isArray(jsonResponse.errors)) {
                    notifications.yell('error', jsonResponse.errors[0].message);
                } else {
                    notifications.yell('error', jsonResponse.errors);
                }
            },
            function fail() {
                notifications.yell('error', gt('An internal error occurred'));
            });
        })
        .hover(function mouseEnter() {
            updateFollowButton(btn, btn.hasClass('following'), true);
        },
        function mouseExit() {
            updateFollowButton(btn, btn.hasClass('following'), false);
        });
    };

    var deleteTweetDialog = function (tweet, $myTweet) {
        require(['io.ox/backbone/views/modal'], function (ModalDialog) {
            new ModalDialog({ title: gt('Are you sure you want to delete this Tweet?') })
                .build(function () {
                    this.$body.append(
                        $('<div class="twitter">').append(
                            renderTweet(tweet, { hideLinks: true, hideFollowButton: true })
                        )
                    );
                })
                .addCancelButton()
                .addButton({ label: gt('Delete'), action: 'delete' })
                .on('delete', function () {
                    $.when(network.deleteTweet(tweet.id_str)).then(
                        function success(response) {
                            var jsonResponse = JSON.parse(response);

                            if (!jsonResponse.errors) {
                                $myTweet.remove();
                                tweetCache.remove(tweet.id_str);
                            } else if (_.isArray(jsonResponse.errors)) {
                                notifications.yell('error', jsonResponse.errors[0].message);
                            } else {
                                notifications.yell('error', jsonResponse.errors);
                            }
                        },
                        function fail() {
                            notifications.yell('error', gt('An internal error occurred'));
                        });
                })
                .open();
        });
    };

    var TwitterTextBox = function (title, options) {
        var replyBoxContainer = $('<div class="io-ox-twitter-tweet-container">'),
            textArea = $('<textarea class="io-ox-twitter-tweet-textarea form-control" aria-required="true" rows="4">')
                .on('click', function (e) {
                    e.preventDefault();
                    if (options !== undefined && options.open !== undefined) {
                        options.open({
                            replyBoxContainer: replyBoxContainer,
                            textArea: textArea,
                            buttonContainer: buttonContainer
                        });
                    }
                    updateTextLength();
                })
                .on('blur', function (e) {
                    e.preventDefault();
                    if (options !== undefined && options.close !== undefined) {
                        options.close({
                            replyBoxContainer: replyBoxContainer,
                            textArea: textArea,
                            buttonContainer: buttonContainer
                        });
                    }
                })
                .on('keyup', function (e) {
                    e.preventDefault();
                    updateTextLength();
                }),
            buttonContainer = $('<div class="io-ox-twitter-tweet-button">'),
            tweetCounter = $('<div class="io-ox-twitter-tweet-counter">').text(limit),
            tweetButton = $('<a class="btn btn-default disabled" role="button">').text(title)
                .on('click', function (e) {
                    var text = textArea.val();

                    if (text.length > 0) {
                        e.preventDefault();
                        textArea.val('');

                        if (success !== undefined) {
                            success(text, {
                                replyBoxContainer: replyBoxContainer,
                                textArea: textArea,
                                buttonContainer: buttonContainer
                            });
                        }
                    }
                }),
            success = options !== undefined ? options.success : undefined;

        replyBoxContainer.append(
            textArea,
            buttonContainer.append(
                tweetCounter,
                tweetButton
            )
        );

        applyOptions();

        function applyOptions() {
            if (options === undefined) return;
            if (options.isOpen && options.open !== undefined) {
                options.open({
                    replyBoxContainer: replyBoxContainer,
                    textArea: textArea,
                    buttonContainer: buttonContainer
                });
            } else if (!options.isOpen && options.close !== undefined) {
                options.close({
                    replyBoxContainer: replyBoxContainer,
                    textArea: textArea,
                    buttonContainer: buttonContainer
                });
            }
        }

        function updateTextLength() {
            var linkRegexp = /\b(https?:\/\/|www.)\S+\.\S+\b/gi,
                //calculate the length of links (twitter makes every link 22 chars long)
                linkLength = (textArea.val().match(linkRegexp) || []).length * 22,
                //cut out links
                nonLinkLength = textArea.val().replace(linkRegexp, '').length;

            tweetCounter.text((limit - (linkLength + nonLinkLength)));

            if (linkLength + nonLinkLength > limit) {
                tweetCounter.addClass('limit-exceeded');
            } else {
                tweetCounter.removeClass('limit-exceeded');
            }

            if (textArea.val().length === 0) {
                tweetButton.addClass('disabled').removeClass('btn-primary');
            } else {
                tweetButton.removeClass('disabled').addClass('btn-primary');
            }
        }

        function appendTo(element, baton) {
            if (replyBoxContainer.parent()[0] === element[0]) {
                replyBoxContainer.remove();
            } else {
                if (baton) {
                    success = baton.callback;
                } else {
                    success = undefined;
                }

                textArea.val('');
                updateTextLength();

                element.append(replyBoxContainer);
                textArea.focus();

                if (options.open !== undefined) {
                    options.open({
                        replyBoxContainer: replyBoxContainer,
                        textArea: textArea,
                        buttonContainer: buttonContainer,
                        baton: baton
                    });
                }
            }
        }

        function get() {
            return replyBoxContainer;
        }

        return { appendTo: appendTo, get: get };
    };

    var setup = function (options) {
        $tweets = options.$tweets;
        tweetCache = options.tweetCache;
    };

    var setCurrentUserID = function (id) {
        currentUserID = id;
    };

    return {
        setup: setup,
        showTweet: showTweet,
        TwitterTextBox: TwitterTextBox,
        renderTweet: renderTweet,
        setCurrentUserID: setCurrentUserID
    };
});
