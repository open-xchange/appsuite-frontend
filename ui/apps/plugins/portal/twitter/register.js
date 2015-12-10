/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 * @author Markus Bode <markus.bode@open-xchange.com>
 */

define('plugins/portal/twitter/register', [
    'io.ox/core/extensions',
    'io.ox/core/strings',
    'io.ox/keychain/api',
    'gettext!plugins/portal',
    'io.ox/core/notifications',
    'plugins/portal/twitter/network',
    'io.ox/core/cache',
    'plugins/portal/twitter/util',
    'less!plugins/portal/twitter/style'
], function (ext, strings, keychain, gt, notifications, network, cache, util) {

    'use strict';

    var loadEntriesPerPage = 10,
        offset = 0,
        $tweets = $('<ul>').addClass('twitter list-unstyled'),
        $busyIndicator = $('<div>').html('&nbsp;'),
        tweetCache = new cache.SimpleCache('twitter-cache'),
        composeBox,
        offline = false;

    util.setup({ $tweets: $tweets, tweetCache: tweetCache });

    var setOffline = function (options) {
        if (options !== undefined && options.offline !== undefined && options.offline !== offline) {
            offline = options.offline;

            if (composeBox !== undefined && $(composeBox).is(':visible')) {
                composeBox.replaceWith(getComposeBox());
            }
        }
    };

    var loadFromTwitter = function (params) {
        var deferred = new $.Deferred();

        network.loadFromTwitter(params).then(function success(response) {
            if (response.errors && response.errors.length > 0) {
                if (response.errors[0].code === 88) {
                    tweetCache.keys().done(function (keys) {
                        var deferreds = _(keys).map(function (key) { return tweetCache.get(key); });

                        $.when.apply($, deferreds).then(function success() {
                            var values = _(arguments).toArray().filter(function (e) { return e; });

                            if (values.length > 0) {
                                setOffline({ offline: true });
                                deferred.resolve(values);
                            } else {
                                deferred.reject(response);
                            }
                        }, function fail() {
                            deferred.reject(response);
                        });
                    })
                    .fail(function () {
                        deferred.reject(response);
                    });
                } else {
                    deferred.reject(response);
                }
            } else {
                tweetCache.clear().done(function () {
                    _(response).each(function (tweet) {
                        tweetCache.add(tweet.id_str, tweet);
                    });
                    setOffline({ offline: false });
                    deferred.resolve(response);
                });
            }
        }, function fail(error) {
            deferred.reject(error);
        });

        return deferred;
    };

    var loadTweets = function (count, offset, newerThanId) {
        var params =  { 'include_entities': true };

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

    var renderTweets = function (baton) {
        var timeline = baton.data;

        if ($tweets === undefined || !$($tweets).is(':visible')) {
            return;
        }

        $tweets.empty();

        _(timeline).each(function (tweet) {
            offset = tweet.id_str;
            util.showTweet(tweet, { offline: offline }).appendTo($tweets);
        });
    };

    var getComposeBox = function () {
        if (offline) {
            composeBox = $('<div>').attr({ style: 'color: #FF0000; padding: 15px; ' }).text(gt('This widget is currently offline because the twitter rate limit exceeded.'));
        } else {
            composeBox = new util.TwitterTextBox('Tweet', {
                open: function (options) {
                    options.textArea
                        .attr({ rows: '4', placeholder: '' })
                        .removeClass('io-ox-twitter-tweet-textarea-small');
                    options.buttonContainer.removeClass('io-ox-twitter-hidden');
                },
                close: function (options) {
                    if (options.textArea.val() === '') {
                        options.textArea.attr({ rows: '1', placeholder: 'Compose new tweet...' })
                            .addClass('io-ox-twitter-tweet-textarea-small')
                            .css('height', '');
                        options.buttonContainer.addClass('io-ox-twitter-hidden');
                    }
                },
                success: function (text, options) {
                    $.when(network.sendTweet({ status: text })).then(function success(response) {
                        var jsonResponse = JSON.parse(response);

                        if (!jsonResponse.errors) {
                            $tweets.prepend(util.renderTweet(jsonResponse));
                            tweetCache.add(jsonResponse.id_str, jsonResponse);
                        } else {
                            if (_.isArray(jsonResponse.errors)) {
                                notifications.yell('error', jsonResponse.errors[0].message);
                            } else {
                                notifications.yell('error', jsonResponse.errors);
                            }
                        }

                        options.textArea.attr({ rows: '1', placeholder: 'Compose new tweet...' })
                            .addClass('io-ox-twitter-tweet-textarea-small')
                            .css('height', '');
                        options.buttonContainer.addClass('io-ox-twitter-hidden');
                    },
                    function fail() {
                        notifications.yell('error', gt('An internal error occurred'));
                    });
                }
            }).get();
        }

        return composeBox;
    };

    var onPullToRefresh = function () {
        offset = 0;
        var $first = $('li.tweet:first');
        var newestId = $first.data('entry').id_str;
        $tweets.addClass('pulltorefresh-refreshing');

        $.when(loadTweets(0, 0, newestId), _.wait(500))
            .done(function (j) {
                j.reverse();
                _(j).each(function (tweet) {
                    util.showTweet(tweet, { offline: offline }).prependTo($tweets);
                });

                var $o = $('div.io-ox-sidepopup-pane');
                var top = $o.scrollTop() - $o.offset().top + $first.offset().top;
                $o.animate({ scrollTop: top }, 250, 'swing');
                $tweets.removeClass('pulltorefresh-refreshing');
            })
            .fail(function () {
                $tweets.removeClass('pulltorefresh-refreshing');
                notifications.yell('error', gt('Could not load new Tweets.'));
            });
    };

    var drawPreview = function (baton) {
        var content = baton.contentNode;
        if (baton.data.length === 0) {
            content.append(
                $('<li class="paragraph">').text(gt('No Tweets yet.'))
            );

        } else if (baton.data.errors && baton.data.errors.length > 0) {
            content.removeClass('pointer');
            $('<div class="paragraph">').text(gt('Twitter reported the following errors:')).appendTo(content);
            _(baton.data.errors).each(function (myError) {
                $('<div class="error">').text('(' + myError.code + ') ' + myError.message).appendTo(content);
                handleError(myError.code, this, baton).appendTo(content);
            });

        } else {
            var list = baton.data.slice(0, _.device('smartphone') ? 1 : 10);
            content.addClass('pointer');
            _(list).each(function (tweet) {
                var message = String(tweet.text).replace(/((#|@)[\wäöüß]+)/ig, '<span class="accent">$1</span>');
                content.append(
                    $('<li class="paragraph">').append(
                        $('<span class="bold">').text('@' + tweet.user.name + ': '),
                        $('<span class="normal">').html(message)
                    )
                );
            });
        }
    };

    var handleError = function (errorCode) {
        if (errorCode === 32 || errorCode === 89 || errorCode === 135) {
            var account = keychain.getStandardAccount('twitter');

            return $('<a class="solution">').text(gt('Click to authorize your account again')).on('click', function () {
                keychain.submodules.twitter.reauthorize(account).done(function () {
                    console.log(gt('You have reauthorized this %s account.', 'Twitter'));
                }).fail(function () {
                    console.error(gt('Something went wrong reauthorizing the %s account.', 'Twitter'));
                });
            });
        } else if (errorCode === 88 || errorCode === 130) {
            return $('<a class="solution">').text(gt('Click to retry later.')).on('click', function () { keychain.submodules.twitter.trigger('update'); });
        }
        return $('<a class="solution">').text(gt('Click to retry')).on('click', function () { keychain.submodules.twitter.trigger('update'); });
    };

    var refreshWidget = function () {
        require(['io.ox/portal/main'], function (portal) {
            var portalApp = portal.getApp(),
                portalModels = portalApp.getWidgetCollection().filter(function (model) { return /^twitter_\d*/.test(model.id); });

            if (portalModels.length > 0) {
                portalApp.refreshWidget(portalModels[0], 0);
            }
        });
    };

    ext.point('io.ox/portal/widget/twitter').extend({

        title: gt('Twitter'),
        // prevent loading on refresh when error occurs to not bloat logs (see Bug 41740)
        stopLoadingOnError: true,

        initialize: function () {
            keychain.submodules.twitter.on('update delete', refreshWidget);

            network.fetchUserID().then(function success(id) {
                util.setCurrentUserID(id);
            });
        },

        // action: function () {
        //     window.open('https://twitter.com/', 'twitter');
        // },

        isEnabled: function () {
            return keychain.isEnabled('twitter');
        },

        requiresSetUp: function () {
            return keychain.isEnabled('twitter') && !keychain.hasStandardAccount('twitter');
        },

        drawDefaultSetup: function (baton) {
            keychain.submodules.twitter.off('create', null, this);
            keychain.submodules.twitter.on('create', function () {
                baton.model.node.find('h2 .fa-twitter').replaceWith($('<span class="title">').text(gt('Twitter')));
                baton.model.node.removeClass('requires-setup widget-color-custom color-twitter');
                refreshWidget();
            }, this);

            this.find('h2 .title').replaceWith('<i class="fa fa-twitter">');
            this.addClass('widget-color-custom color-twitter');
        },

        performSetUp: function () {
            var win = window.open(ox.base + '/busy.html', '_blank', 'height=400, width=600');

            return keychain.createInteractively('twitter', win);
        },

        load: function (baton) {

            if (!keychain.hasStandardAccount('twitter')) return $.Deferred().reject({ code: 'OAUTH-0006' });

            return loadFromTwitter({ count: loadEntriesPerPage, include_entities: true }).done(function (data) {
                baton.data = data;

                renderTweets(baton);
            });
        },

        preview: function (baton) {
            if (!baton.data) { return; }
            var content = $('<ul class="content pointer list-unstyled" tabindex="1" role="button" aria-label="' +  gt('Press [enter] to jump to the twitter feed.') + '">');
            baton.contentNode = content;
            drawPreview(baton);
            this.append(content);
        },

        draw: function (baton) {
            var timeline = baton.data;

            // Pull to refresh
            $(this).on('onResume', function () {
                $(this).on('onPullToRefresh', onPullToRefresh);
            }).on('onPause', function () {
                $(this).off('onPullToRefresh', onPullToRefresh);
                //ptr.detachEvents();
            }).on('onPullToRefreshDown', function () {
                $('li.tweet > div.text').addClass('pulltorefresh-unselectable');
                $('li.tweet > div.text > span').addClass('pulltorefresh-unselectable');
            }).on('onPullToRefreshUp', function () {
                $('li.tweet > div.text').removeClass('pulltorefresh-unselectable');
                $('li.tweet > div.text > span').removeClass('pulltorefresh-unselectable');
            }).on('onAppended', function () {
                //ptr.attachEvents($('div.io-ox-sidepopup-pane'), $(this), $tweets);
            });

            if (!timeline) {
                this.remove();
                return;
            }

            var script = document.createElement('script');
            if (!window.twttr) {
                script.onload = function () {
                    window.twttr.ready(function (twttr) {
                        twttr.events.bind('tweet', function () {
                            loadFromTwitter({ count: loadEntriesPerPage, include_entities: true }).done(function (data) {
                                baton.data = data;
                                renderTweets(baton);
                            });
                        });
                    });
                };
            }
            script.type = 'text/javascript';
            //TODO must be stored locally, even if the Twitter guys hate us
            script.src = 'https://platform.twitter.com/widgets.js';
            this.empty().append(
                $('<div>').addClass('clear-title io-ox-twitter-title').text('Twitter'),
                getComposeBox()
            );
            //need to use native methos here to trigger onload
            this[0].appendChild(script);

            this.append($tweets.empty(), $busyIndicator);

            renderTweets(baton);
        },

        loadMoreResults: function (finishFn) {
            $busyIndicator.addClass('io-ox-busy');

            $.when(loadTweets(loadEntriesPerPage, offset), _.wait(500))
                .done(function (j) {
                    j = j.slice(1);
                    _(j).each(function (tweet) {
                        offset = tweet.id_str;
                        util.showTweet(tweet, { offline: offline }).appendTo($tweets);
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

    ext.point('io.ox/portal/widget/twitter/settings').extend({
        title: gt('Twitter'),
        type: 'twitter',
        editable: false,
        unique: true
    });
});
