/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author  Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/portal/facebook/register',
    ['io.ox/core/extensions',
     'io.ox/oauth/proxy',
     'less!plugins/portal/facebook/style.css'], function (ext, proxy) {

    'use strict';

    var fnToggle = function () {
        var self = $(this);
        self.data('unfolded', !self.data('unfolded'))
            .text(self.data('unfolded') ? 'Hide comments' : 'Show comments')
            .parent().find('.wall-comment').toggle('fast');
    };

    var createCommentIterator = function (id, node) {
        return function (comment) {
            $('<div class="wall-comment">').append(
                $('<img class="picture">').attr('src', 'https://graph.facebook.com/' + comment.from.id + '/picture'),
                $('<div class="wall-comment-content">').append(
                    $('<a class="from">').text(comment.from.name).attr('href', 'http://www.facebook.com/profile.php?id=' + comment.from.id)).append(
                        $('<div class="wall-comment-text">').text(comment.message)))
                .hide()
                .appendTo($(node));
        };
    };
    
    var getProfile = function (profiles, actor_id) {
        return _.find(profiles, function (profile) { return profile.id === actor_id; });
    };

    ext.point('io.ox/portal/widget').extend({

        id: 'facebook',
        index: 150,

        load: function () {
            return proxy.request({
                api: 'facebook',
                url: 'https://graph.facebook.com/fql?q=' + JSON.stringify({
                    newsfeed: "SELECT post_id, actor_id, message, type, description, likes, comments, action_links, app_data, attachment, created_time FROM stream WHERE filter_key in (SELECT filter_key FROM stream_filter WHERE uid=me() AND type = 'newsfeed') AND is_hidden = 0",
                    profiles: "SELECT id, name, url, pic_square FROM profile WHERE id IN (SELECT actor_id FROM #newsfeed)"
                })
            }).pipe(JSON.parse);
        },

        draw: function (resultsets) {
            var wall = resultsets.data[0].fql_result_set;
            var profiles = resultsets.data[1].fql_result_set;

            if (!wall) {
                this.remove();
                return $.Deferred().resolve();
            }

            this.append($('<div>').addClass('clear-title').text('Facebook'));
            _(wall).each(function (post) {
                var profile = getProfile(profiles, post.actor_id);
                var entry_id = 'facebook-' + post.post_id;
                var wall_content = $('<div class="facebook wall-entry">').attr('id', entry_id);
                var foundHandler = false;

                // basic wall post skeleton
                wall_content.append(
                    $('<a class="profile-picture">').attr('href', profile.url).append(
                        $('<img class="picture">').attr('src', profile.pic_square)),
                    $('<div class="wall-post">').append(
                        $('<a class="from">').text(profile.name).attr('href', profile.url),
                        $('<div class="wall-post-content">'),
                        $('<span class="datetime">').text(new Date(post.created_time * 1000))
//                        $('<span class="debugging-info">').text('Message type: ' + post.type + ', actor_id: ' + post.actor_id)
                    ));

                //use extension mechanism to enable rendering of different contents
                ext.point('plugins/portal/facebook/renderer').each(function (renderer) {
                    var content_container = wall_content.find('div.wall-post-content');
                    if (renderer.accepts(post) && ! foundHandler) {
                        renderer.draw.apply(content_container, [post]);
                        foundHandler = true;
                    }
                });
                //not used as long as there is a catch-all handler! TODO: Should work in production code.
                if (!foundHandler) {
                    return;
                }

                //comments
                if (post.comments && post.comments.data) {
                    //toggle comments on/off
                    $('<a class="comment-toggle">')
                        .text('Show comments')
                        .on('click', fnToggle)
                        .data('unfolded', false)
                        .appendTo(wall_content);
                    //render comments
                    _(post.comments.data).each(createCommentIterator(post.id, wall_content));
                }

                //make all outgoing links open new tabs/windows
                wall_content.find('a').attr('target', '_blank');

                wall_content.appendTo(this);
            }, this);

            return $.when();
        }
    });


    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'photo',
        index: 128,
        accepts: function (post) {
            return (post.type === 247);
        },
        draw: function (post) {
            var media = post.attachment.media[0];
            this.text(post.story || post.message).append(
                $('<a>', {'class': "posted-image", 'href': media.href})
                    .append($('<img>', {'class': "posted-image", 'src': media.src, alt: media.alt, title: media.alt})));
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'youtube',
        index: 128,
        accepts: function (post) {
            return (post.type === 80 && post.attachment.caption === 'www.youtube.com');
        },
        draw: function (post) {
            var vid_id = /[?&]v=(.+)/.exec(post.link);
            if (!vid_id) {
                this.text(post.message).append(
                    $('<br>'),
                    $('<a class="video">').attr('href', post.link).append(
                        $('<span class="caption">').text(post.description)));
            } else {
                this.text(post.message).append(
                    $('<a class="video">').attr('href', post.link).append(
                        $('<img class="video-preview wall-img-left">').attr('src', 'http://img.youtube.com/vi/' + vid_id[1] + '/2.jpg'),
                        $('<span class="caption">').text(post.description)));
            }
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'status',
        index: 128,
        accepts: function (post) {
            return (post.type === 46);
        },
        draw: function (post) {
            this.text(post.message);
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'link',
        index: 196,
        accepts: function (post) {
            return (post.type === 80);
        },
        draw: function (post) {
            var media = post.attachment.media[0];
            this.append(
                $('<div>').text(post.description),
                $('<a>', {href: media.href}).append(
                    $('<img class="wall-img-left">', {src: media.src}),
                    $('<span class="caption">').text(post.attachment.description)
                )
            );
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'other_video',
        index: 196,
        accepts: function (post) {
            return (post.type === 128);
        },
        draw: function (post) {
            this.text(post.message);
        }
    });


    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'fallback',
        index: 256,
        accepts: function (post) {
            return true;
        },
        draw: function (post) {
            console.log("Please attach when reporting missing type " + post.type, post);
            this.html('<em style="color: red;">This message is of the type <b>' + post.type + '</b>. We do not know how to render this yet. Please tell us about it!</em>');
        }
    });
    
    
    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'app_story',
        index: 196,
        accepts: function (post) {
            return (post.type === 237);
        },
        draw: function (post) {
            var media = post.attachment.media[0];
            this.append(
                $('<div class="message">').text(post.message),
                $('<a class="app-story">').attr('href', media.href).append(
                    $('<img class="wall-img-left">').attr('src', media.src),
                    $('<span class="caption title">').text(post.attachment.name),
                    $('<br>'),
                    $('<span class="caption">').text(post.attachment.description)));
        }
    });
});
