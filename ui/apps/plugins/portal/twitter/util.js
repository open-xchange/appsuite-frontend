define('plugins/portal/twitter/util',
    ['plugins/portal/twitter/network',
    'gettext!plugins/portal',
    'io.ox/core/notifications',
    'io.ox/core/date'
    ], function (network, gt, notifications, date) {

    'use strict';

    var replyBox,
        tweetCache,
        $tweets,
        currentUserID;

    var parseTweet = function (text, entities) {
        var offsets = {},
            linkMatches;

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

        //hack to highligh some t.co-URLs that Twitter does not identify as such:
        linkMatches = text.match(/http:\/\/t\.co\/\w+/gi);
        _(linkMatches).each(function (myLink) {
            var index = text.indexOf(myLink),
                length = myLink.length;
            if (_(offsets).keys().indexOf(index.toString()) === -1) { //make sure there is nothing planned for this part already
                offsets[index] = {
                    elem: $('<a>', {href: myLink}).text(myLink),
                    indices: [index, index + length]
                };
            }
        });

        var keySet = _(offsets).keys().sort(function (a, b) {return a - b; });
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
            deferred = network.unFavoriteTweed({ id: tweet.id_str});
        } else {
            deferred = network.favoriteTweed({ id: tweet.id_str});
        }

        $.when(deferred).then(
        function success(response) {
            var jsonResponse = JSON.parse(response);

            tweet.favorited = !tweet.favorited;
            if (!jsonResponse.errors) {
                if (tweet.favorited) {
                    $myTweet.find('.io-ox-twitter-favorite')
                        .addClass('favorited')
                        .attr({'aria-pressed': 'true'})
                        .text(gt('Favorited'));
                } else {
                    $myTweet.find('.io-ox-twitter-favorite')
                        .removeClass('favorited')
                        .attr({'aria-pressed': 'false'})
                        .text(gt('Favorite'));
                }
            } else {
                if (_.isArray(jsonResponse.errors)) {
                    notifications.yell('error', jsonResponse.errors[0].message);
                } else {
                    notifications.yell('error', jsonResponse.errors);
                }
            }
        },
        function fail() {
            notifications.yell('error', gt('An internal error occured'));
        });
    };

    var showRetweet = function (tweet, $myTweet) {
        require(['io.ox/core/tk/dialogs'], function (dialogs) {
            new dialogs.ModalDialog()
            .header(
                $('<h4>').text(gt('Retweet this to your followers?'))
            )
            .build(function () {
                this.getContentNode().append(
                    $('<div>').addClass('twitter').append(
                        renderTweet(tweet, { hideLinks: true, hideFollowButton: true })
                    )
                );
            })
            .addPrimaryButton('retweet', gt('Retweet'))
            .addButton('cancel', gt('Cancel'))
            .show()
            .done(function (action) {
                if (action === 'retweet') {
                    $.when(network.retweet(tweet.id_str)).then(
                    function success(response) {
                        var jsonResponse = JSON.parse(response);

                        if (!jsonResponse.errors) {
                            $myTweet.find('.io-ox-twitter-retweet')
                                .addClass('retweeted')
                                .attr({'aria-pressed': 'true'})
                                .text(gt('Retweeted'));
                            tweet.retweeted = true;
                        } else {
                            if (_.isArray(jsonResponse.errors)) {
                                notifications.yell('error', jsonResponse.errors[0].message);
                            } else {
                                notifications.yell('error', jsonResponse.errors);
                            }
                        }
                    },
                    function fail() {
                        notifications.yell('error', gt('An internal error occured'));
                    }
                    );
                }
            });
        });
    };

    function parseDate(str) {
        var v = str.split(' ');
        return new Date(Date.parse(v[1] + ' ' + v[2] + ', ' + v[5] + ' ' + v[3] + ' UTC'));
        // thx for having exactly the same problem:
        // http://stackoverflow.com/questions/3243546/problem-with-javascript-date-function-in-ie-7-returns-nan
    }

    var showTweet = function (tweet, opt) {
        if (tweet.retweeted_status) {
            var $temp = renderTweet(tweet.retweeted_status, opt);
            $temp.find('.text').append(
                $('<div class="io-ox-twitter-retweet-source">').append(
                    $('<i class="icon-retweet">'),
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
            tweeted = new date.Local(parseDate(tweet.created_at)).format(date.DATE_TIME),
            $myTweet = $('<div class="tweet">').data('entry', tweet),
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
            $('<a>').attr({href: profileLink, target: '_blank'}).append(
                $('<img>', {src: tweet.user.profile_image_url_https, 'class': 'profilePicture', alt: tweet.user.description})
            ),
            $('<div class="text">').append(
                $('<strong class="io-ox-twitter-name">').append($('<a>', {href: profileLink, target: '_blank'}).text(tweet.user.name)),
                '<br />',
                $('<a>', {'class': 'name', href: profileLink, target: '_blank'}).text('@' + tweet.user.screen_name),
                '<br />',
                parseTweet(tweet.text, tweet.entities)
            )
        );

        if (hideLinks) {
            $myTweet.append($('<div class="io-ox-twitter-details">').append(
                $('<a>').attr({'class': 'io-ox-twitter-date', 'href': tweetLink, 'target': '_blank'}).text(tweeted),
                    getReplyLink(tweet, $myTweet),
                    isCurrentUser ? getDeleteLink(tweet, $myTweet) : getRetweetLink(tweet, $myTweet),
                    getFavoriteLink(tweet, $myTweet)
                ));

            if (tweet.favorited) {
                $myTweet.find('.io-ox-twitter-favorite').addClass('favorited').text(gt('Favorited'));
            }
            if (tweet.retweeted) {
                $myTweet.find('.io-ox-twitter-retweet').addClass('retweeted').text(gt('Retweeted'));
            }
        }

        return $myTweet;
    };

    var getReplyLink = function (tweet, $myTweet) {
        return $('<a>').attr({'class': 'io-ox-twitter-reply',
                'href': '#',
                role: 'button'})
            .text(gt('Reply'))
            .on('click', function (e) {
                e.preventDefault();

                replyBox = replyBox || new TwitterTextBox(gt('Reply'), {
                    open: function (options) {
                        options.textArea
                            .attr({rows: '4', placeholder: ''});
                        options.buttonContainer.removeClass('io-ox-twitter-hidden');

                        if (options.baton !== undefined) {
                            options.textArea.val('@' + options.baton.tweet.user.screen_name + ' ');
                        }
                    },
                    close: function (options) {
                        if (options.textArea.val() === '') {
                            options.textArea.attr({rows: '1', placeholder: 'Reply to'})
                                .css('height', '');
                            options.buttonContainer.addClass('io-ox-twitter-hidden');
                        }
                    },
                    isOpen: true
                });
                replyBox.appendTo($myTweet, {tweet: tweet,
                    callback: function (text, options) {
                        $.when(network.sendTweet({ status: text, in_reply_to_status_id: tweet.id_str })).then(function success(response) {
                            var jsonResponse = JSON.parse(response);

                            if (!jsonResponse.errors) {
                                $tweets.prepend(renderTweet(jsonResponse));
                                tweetCache.add(jsonResponse.id_str, jsonResponse);
                            } else {
                                if (_.isArray(jsonResponse.errors)) {
                                    notifications.yell('error', jsonResponse.errors[0].message);
                                } else {
                                    notifications.yell('error', jsonResponse.errors);
                                }
                            }

                            options.replyBoxContainer.remove();
                        },
                        function fail() {
                            notifications.yell('error', gt('An internal error occured'));
                        });
                    }
                });
            });
    };

    var getRetweetLink = function (tweet, $myTweet) {
        return $('<a>').attr({'class': 'io-ox-twitter-retweet',
                'href': '#',
                role: 'button'})
            .text(gt('Retweet'))
            .on('click', function (e) {
                e.preventDefault();

                if (tweet.retweeted) {
                    network.deleteRetweet(tweet.id_str).then(function success(data) {
                        var jsonResponse = JSON.parse(data);

                        if (!jsonResponse.errors) {
                            $myTweet.find('.io-ox-twitter-retweet')
                                .removeClass('retweeted')
                                .attr({'aria-pressed': 'false'})
                                .text(gt('Retweet'));
                        } else {
                            if (_.isArray(jsonResponse.errors)) {
                                notifications.yell('error', jsonResponse.errors[0].message);
                            } else {
                                notifications.yell('error', jsonResponse.errors);
                            }
                        }
                    }, function fail() {
                        notifications.yell('error', gt('An internal error occured'));
                    });
                } else {
                    showRetweet(tweet, $myTweet);
                }
            });
    };

    var getDeleteLink = function (tweet, $myTweet) {
        return $('<a>').attr({'class': 'io-ox-twitter-delete',
                'href': '#',
                role: 'button'})
            .append(
                $('<i>').addClass('icon-trash'),
                $('<span>').text(gt('Delete'))
                .on('click', function (e) {
                    e.preventDefault();

                    deleteTweetDialog(tweet, $myTweet);
                })
            );
    };

    var getFavoriteLink = function (tweet, $myTweet) {
        return $('<a>').attr({'class': 'io-ox-twitter-favorite',
                'href': '#',
                role: 'button'})
            .text(gt('Favorite'))
            .on('click', function (e) {
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
                    $('<div>').text(gt('Follow'))
                )
                .removeClass('btn-primary btn-danger following')
                .attr({'aria-pressed': 'false'});
        } else {
            if (hover) {
                //display unfollow
                btn.empty().text(gt('Unfollow'))
                    .removeClass('btn-primary').addClass('btn-danger following')
                    .attr({'aria-pressed': 'true'});
            } else {
                //display following
                btn.empty().text(gt('Following'))
                    .removeClass('btn-danger').addClass('btn-primary following')
                    .attr({'aria-pressed': 'true'});
            }
        }
    };

    var followButton = function (tweet) {
        var btn = $('<div>').addClass('io-ox-twitter-follow btn small')
            .attr({'user_id': tweet.user.id_str,
                'role': 'button'});

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
                } else {
                    if (_.isArray(jsonResponse.errors)) {
                        notifications.yell('error', jsonResponse.errors[0].message);
                    } else {
                        notifications.yell('error', jsonResponse.errors);
                    }
                }
            },
            function fail() {
                notifications.yell('error', gt('An internal error occured'));
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
        require(['io.ox/core/tk/dialogs'], function (dialogs) {
            new dialogs.ModalDialog()
            .header(
                $('<h4>').text(gt('Are you sure you want to delete this Tweet?'))
            )
            .build(function () {
                this.getContentNode().append(
                    $('<div>').addClass('twitter').append(
                        renderTweet(tweet, { hideLinks: true, hideFollowButton: true })
                    )
                );
            })
            .addPrimaryButton('delete', gt('Delete'))
            .addButton('cancel', gt('Cancel'))
            .show()
            .done(function (action) {
                if (action === 'delete') {
                    $.when(network.deleteTweet(tweet.id_str)).then(
                    function success(response) {
                        var jsonResponse = JSON.parse(response);

                        if (!jsonResponse.errors) {
                            $myTweet.remove();
                            tweetCache.remove(tweet.id_str);
                        } else {
                            if (_.isArray(jsonResponse.errors)) {
                                notifications.yell('error', jsonResponse.errors[0].message);
                            } else {
                                notifications.yell('error', jsonResponse.errors);
                            }
                        }
                    },
                    function fail() {
                        notifications.yell('error', gt('An internal error occured'));
                    });
                }
            });
        });
    };

    var TwitterTextBox = function (title, options) {
        var replyBoxContainer = $('<div>').attr({'class': 'io-ox-twitter-tweet-container'}),
            textArea = $('<textarea>').attr({
                    'class': 'io-ox-twitter-tweet-textarea',
                    'aria-required': 'true',
                    maxlength: 140,
                    rows: '4'
                })
                .on('click', function (e) {
                    e.preventDefault();
                    if (options !== undefined && options.open !== undefined) {
                        options.open({replyBoxContainer: replyBoxContainer,
                            textArea: textArea,
                            buttonContainer: buttonContainer});
                    }
                    updateTextLength();
                })
                .on('blur', function (e) {
                    e.preventDefault();
                    if (options !== undefined && options.close !== undefined) {
                        options.close({replyBoxContainer: replyBoxContainer,
                            textArea: textArea,
                            buttonContainer: buttonContainer});
                    }
                })
                .on('keyup', function (e) {
                    e.preventDefault();
                    updateTextLength();
                }),
            buttonContainer = $('<div>').attr({'class': 'io-ox-twitter-tweet-button'}),
            tweetCounter = $('<div>').attr({'class': 'io-ox-twitter-tweet-counter'}).text(140),
            tweetButton = $('<a>').attr({'class': 'btn disabled', role: 'button'})
                .text(title)
                .on('click', function (e) {
                    var text = textArea.val();

                    if (text.length > 0) {
                        e.preventDefault();
                        textArea.val('');

                        if (success !== undefined) {
                            success(text, {replyBoxContainer: replyBoxContainer,
                                textArea: textArea,
                                buttonContainer: buttonContainer});
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
            if (options !== undefined) {
                if (options.isOpen) {
                    if (options.open !== undefined) {
                        options.open({replyBoxContainer: replyBoxContainer,
                            textArea: textArea,
                            buttonContainer: buttonContainer});
                    }
                } else {
                    if (options.close !== undefined) {
                        options.close({replyBoxContainer: replyBoxContainer,
                            textArea: textArea,
                            buttonContainer: buttonContainer});
                    }
                }
            }
        }

        function updateTextLength() {
            tweetCounter.text((140 - textArea.val().length));

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
                    options.open({replyBoxContainer: replyBoxContainer,
                        textArea: textArea,
                        buttonContainer: buttonContainer,
                        baton: baton });
                }
            }
        }

        function get() {
            return replyBoxContainer;
        }

        return {appendTo: appendTo, get: get};
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
