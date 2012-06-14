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
 */

define('plugins/portal/twitter/register',
    ['io.ox/core/extensions',
     'io.ox/oauth/proxy',
     'less!plugins/portal/twitter/style.css'], function (ext, proxy) {

    'use strict';

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
            var elem = $('<a>', {href: 'https://twitter.com/#!/' + user_mention.screen_name.text, target: '_blank'}).text('@' + user_mention.screen_name);
            offsets[user_mention.indices[0]] = {
                elem: elem,
                indices: user_mention.indices
            };
        });

        var keySet = _(offsets).keys().sort(function (a, b) {return a - b; });

        var bob = $('<div>');
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

    ext.point('io.ox/portal/widget').extend({
        id: 'twitter',
        index: 140,
        loadTile: function () {
            var def = proxy.request({api: 'twitter', url: 'https://api.twitter.com/1/statuses/home_timeline.json', params: {count: 1, include_entities: true}});
            return def.pipe(function (response) { return (response) ? JSON.parse(response) : null; });
        },
        drawTile: function (tweets) {
            $(this)
                .append($('<img>').attr({src: 'apps/plugins/portal/twitter/twitter-bird-dark-bgs.png', alt: '', width: '50px', height: 'auto'}).css({'float': 'left'}))
                .append($('<h1>').text('Twitter').css({color: '#fff'}))
                .append($('<span>').html('&nbsp;').css({clear: 'both'}))
                .css({background: '#49f', padding: '10px', color: '#fff'});
            
            if (tweets.length === 0) {
                $(this).append(
                    $('<div>').text('No tweets yet.'));
            } else {
                var tweet = tweets[0];
                var message = $('<div>').html(tweet.text).text();
                if (message.length > 75) {
                    message = message.substring(0, 72) + '...';
                }
                $(this).append(
                    $('<div>').text('Latest tweet:'),
                    $('<div>').append($('<b>').text('@' + tweet.user.name + ':')),
                    $('<div>').text(message));
            }
        },
        load: function () {
            var def = proxy.request({api: 'twitter', url: 'https://api.twitter.com/1/statuses/home_timeline.json', params: {count: 10, include_entities: true}});
            return def.pipe(function (response) { return (response) ? JSON.parse(response) : null; });
        },
        draw: function (timeline) {
            if (!timeline) {
                this.remove();
                return $.Deferred().resolve();
            }
            var self = this;
            self.append($('<div>').addClass('clear-title').text('Twitter'));

            var count = 0;
            var tweets = $('<div class="twitter">').appendTo(self);
            _(timeline).each(function (tweet) {
                var tweetLink = 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id;
                var profileLink = 'https://twitter.com/' + tweet.user.screen_name;
                
                $('<div class="tweet">')
                    .append($('<a>', {href: tweetLink, target: '_blank'})
                        .append($('<img>', {src: tweet.user.profile_image_url, 'class': 'profilePicture', alt: tweet.user.description})))
                    .append($('<div class="text">')
                        .append($('<a>', {'class': 'name', href: profileLink, target: '_blank'}).text(tweet.user.name))
                        .append('<br />')
                        .append(parseTweet(tweet.text, tweet.entities)))
                    .appendTo(tweets);
            });

            return $.Deferred().resolve();
        }
    });


});
