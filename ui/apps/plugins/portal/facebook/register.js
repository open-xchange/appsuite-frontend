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
            console.log(this);
            $('<div class="wall-comment">').append(
                $('<img class="picture">').attr('src', 'https://graph.facebook.com/' + comment.from.id + '/picture'),
                $('<div class="wall-comment-content">').append(
                    $('<a class="from">').text(comment.from.name).attr('href', 'http://www.facebook.com/profile.php?id=' + comment.from.id)).append(
                        $('<div class="wall-comment-text">').text(comment.message)))
                .hide()
                .appendTo($(node));
        };
    };

    ext.point('io.ox/portal/widget').extend({

        id: 'facebook',
        index: 150,

        load: function () {
            return proxy.request({
                api: 'facebook',
                url: 'https://graph.facebook.com/fql?q=' + JSON.stringify({
                    newsfeed: "SELECT post_id, actor_id, message, type, description, likes, comments, action_links, app_data, attachment FROM stream WHERE filter_key in (SELECT filter_key FROM stream_filter WHERE uid=me() AND type='newsfeed') AND is_hidden = 0",
                    profiles: "SELECT name, url, pic FROM profile WHERE id IN (SELECT actor_id FROM #newsfeed)"
                })
            }).pipe(JSON.parse);
        },

        draw: function (resultsets) {
            var wall = resultsets.data[0].fql_result_set;
            var profiles = resultsets.data[1].fql_result_set;
            console.log("Wall entries:", wall.length);
            this.append($('<div>').addClass('clear-title').text('Facebook'));
            _(wall).each(function (post) {
                var entry_id = 'facebook-' + post.post_id;
                var wall_content = $('<div class="facebook wall-entry">').attr('id', entry_id);
                var profile_link = 'http://www.facebook.com/profile.php?id=' + post.actor_id;
                var foundHandler = false;
                
                // basic wall post skeleton
                wall_content.append(
                    $('<a class="profile-picture">').attr('href', profile_link).append(
                        $('<img class="picture">').attr('src', 'https://graph.facebook.com/' + post.actor_id + '/picture')),
                    $('<div class="wall-post">').append(
                        $('<a class="from">').text('Find me! Also, this is type=' + post.type).attr('href', profile_link),
                        $('<div class="wall-post-content">'),
                        $('<span class="datetime">').text(post.created_time)
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
            /watch\?v=(.+)/.exec(post.attachment.href);
            var vid_id = RegExp.$1;
            var media = post.attachment.media[0];
            
            this.text(post.message).append(
                $('<a>', {'class': "video", 'href': media.href}).append(
                    $('<img class="video-preview">').attr('src', 'http://img.youtube.com/vi/' + vid_id + '/2.jpg'),
                    $('<span class="caption">').text(post.attachment.description)));
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
            console.log("link", post);
            this.append(
                $('<div>').text(post.description),
                $('<a>', {href: media.href}).append(
                    $('<img>', {src: media.src}),
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
            console.log("video:", post);
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
            this.html('<em style="color: red;">This message is of the type <b>' + post.type + '</b>. We do not know how to render this yet. Please write a e-mail to <a href="mailto:tobias.prinz@open-xchange.com?subject=Unkown Facebook type: ' + post.type + '">tobias.prinz@open-xchange.com</a></em>');
        }
    });
});
