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
     'io.ox/core/strings',
     'io.ox/keychain/api',
     'gettext!plugins/portal',
     'less!plugins/portal/facebook/style.css'], function (ext, proxy, strings, keychain, gt) {

    'use strict';

    var fnToggle = function () {
        var self = $(this);
        self.data('unfolded', !self.data('unfolded'))
            .text(self.data('unfolded') ? gt('Hide comments') : gt('Show comments'))
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

    var getHelpFromUser = function (post) {
        console.log('Little was known about this type of post (#' + post.type + ') when we wrote this program. Maybe you can send us the following information so we can improve it?',
            JSON.stringify(post));
    };

    var loadFromFacebook = function (baton) {
        return proxy.request({
                api: 'facebook',
                url: 'https://graph.facebook.com/fql?q=' + JSON.stringify({
                    newsfeed: "SELECT post_id, actor_id, message, type, description, likes, comments, action_links, app_data, attachment, created_time, source_id FROM stream WHERE filter_key in (SELECT filter_key FROM stream_filter WHERE uid=me() AND type = 'newsfeed') AND is_hidden = 0",
                    profiles: "SELECT id, name, url, pic_square FROM profile WHERE id IN (SELECT actor_id, source_id FROM #newsfeed)"
                })
            })
            .pipe(JSON.parse);
    };

    var drawPreview = function (baton) {
        var resultsets = baton.data,
            content = baton.contentNode;

        if (resultsets.error) {
            handleError(content, baton);
            return content;
        }

        content.addClass('pointer');
        var wall = resultsets.data[0].fql_result_set,
            profiles = resultsets.data[1].fql_result_set;

        if (!wall || wall.length === 0) {
            content.append(
                $('<div class="paragraph">').text(gt('No wall posts yet.')));
        } else {
            _(wall).each(function (post) {
                var message = strings.shorten(post.message || post.description || post.attachment.caption || '', 150);
                content.append(
                    $('<div class="paragraph">').append(
                        $('<span class="bold">').text(getProfile(profiles, post.actor_id).name + ': '),
                        $('<span class="normal">').text(message)
                    )
                );
            });
        }
        return content;
    };

    var handleError = function (node, baton) {
        var resultsets = baton.data,
            account = keychain.getStandardAccount('facebook'),
            $reauthorizeLink = $('<a class="solution">').text(gt('Click to authorize your account again')).on('click', function () {
                keychain.submodules.facebook.reauthorize(account).done(function () {
                    keychain.submodules.facebook.trigger('update');
                }).fail(function () {
                    console.error(gt("Something went wrong reauthorizing the %s account.", 'Facebook'));
                });
            });
        console.error('Facebook reported an error', resultsets.error);
        node.append(
            $('<div class="error bold">').text(gt('Facebook reported an error:')),
            $('<div class="errormessage">').text(resultsets.error.message),
            '<br />'
        ).addClass('error-occurred error');

        if (resultsets.error.message.indexOf('authorize') !== -1 || resultsets.error.message.indexOf('changed the password') !== -1 || resultsets.error.type === 'OAuthException' || resultsets.error.message.indexOf('606') !== -1) {
            node.append($reauthorizeLink);
        }
    };

    ext.point('io.ox/portal/widget/facebook').extend({

        title: 'Facebook',

        initialize: function (baton) {
            keychain.submodules.facebook.on('update create delete', function () {
                loadFromFacebook().done(function (data) {
                    baton.data = data;
                    if (baton.contentNode) {
                        baton.contentNode.empty();
                        drawPreview(baton);
                    }
                });
            });
        },

        action: function (baton) {
            window.open('https://www.facebook.com/me', 'facebook');
        },

        isEnabled: function () {
            return keychain.isEnabled('facebook');
        },

        requiresSetUp: function () {
            return keychain.isEnabled('facebook') && ! keychain.hasStandardAccount('facebook');
        },

        performSetUp: function () {
            var win = window.open(ox.base + "/busy.html", "_blank", "height=400, width=600");
            return keychain.createInteractively('facebook', win);
        },

        preview: function (baton) {
            var content = $('<div class="content">');
            baton.contentNode = content;
            drawPreview(baton);
            this.append(content);
        },

        load: function (baton) {
            return proxy.request({
                api: 'facebook',
                url: 'https://graph.facebook.com/fql?q=' + JSON.stringify({
                    newsfeed: "SELECT post_id, actor_id, message, type, description, likes, comments, action_links, app_data, attachment, created_time, source_id FROM stream WHERE filter_key in (SELECT filter_key FROM stream_filter WHERE uid=me() AND type = 'newsfeed') AND is_hidden = 0",
                    profiles: "SELECT id, name, url, pic_square FROM profile WHERE id IN (SELECT actor_id, source_id FROM #newsfeed)"
                })
            })
            .pipe(JSON.parse)
            .done(function (data) {
                baton.data = data;
            });
        },

        draw: function (baton) {
            var resultsets = baton.data,
                wall = resultsets.data[0].fql_result_set,
                profiles = resultsets.data[1].fql_result_set;

            if (!wall) {
                this.remove();
                return $.Deferred().resolve();
            }

            this.append(
                $('<h1>').addClass('facebook clear-title').text('Facebook')
            );

            _(wall).each(function (post) {
                var profile = getProfile(profiles, post.actor_id);
                var source = getProfile(profiles, post.source_id);
                var onOwnWall = post.actor_id === post.source_id;
                var entry_id = 'facebook-' + post.post_id;
                var wall_content = $('<div class="facebook wall-entry">').attr('id', entry_id);
                var foundHandler = false;
                // basic wall post skeleton
                wall_content.append(
                    $('<a class="profile-picture">').attr('href', profile.url).append(
                        $('<img class="picture">').attr('src', profile.pic_square)),
                    $('<div class="wall-post">').append(
                        $('<a class="from">').text(profile.name).attr('href', profile.url),
                        !onOwnWall ? $('<span class="io-ox-facebook-onOwnWall">').html(' &#9654; ') : '',
                        !onOwnWall ? $('<a class="io-ox-facebook-onWall">').attr('href', source.url).text(source.name) : '',
                        $('<div class="wall-post-content">'),
                        $('<span class="datetime">').text(new Date(post.created_time * 1000))
                    ));

                //use extension mechanism to enable rendering of different contents
                var extPoints = ext.point('plugins/portal/facebook/renderer'),
                    sortedExtPoints = _(extPoints).sortBy(function (elem) {return elem.index; });

                ext.point('plugins/portal/facebook/renderer').each(function (renderer) {
                    var content_container = wall_content.find('div.wall-post-content');
                    if (renderer.accepts(post) && ! foundHandler) {
                        //console.log(profile.name, ' Renderer: ', renderer.id, post); //this is too useful to delete it, just uncomment it
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
                        .text(gt('Show comments'))
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
        },

        drawCreationDialog: function () {
            var $node = $(this);
            $node.append(
                $('<div class="io-ox-portal-title">').append(
                    $('<h1>').text('Facebook')),
                $('<div class="io-ox-portal-content centered">').append(
                    $('<span>').text(gt('Add your account'))),
                $('<div class="io-ox-portal-actions"').append(
                    $('<i class="icon-remove io-ox-portal-action">'))
            );
        }
    });


    /* index >= 128 for all plugins with a clearly defined purpose (meaning: I exactly know what I'm doing) */
    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'photo',
        index: 128,
        accepts: function (post) {
            return (post.type === 247);
        },
        draw: function (post) {
            var media = post.attachment.media[0];
            this.append(
                $('<a>', {'class': "posted-image", 'href': media.href}).append(
                    $('<img>', {'class': "posted-image", 'src': media.src, alt: media.alt, title: media.alt}),
                    $('<div>').text(post.description || ''),
                    $('<div>').text(post.message || '')
                )
            );
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
        id: 'friends',
        index: 128,
        accepts: function (post) {
            return (post.type === 8);
        },
        draw: function (post) {
            this.text(post.message);
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'tagged-in-photo',
        index: 128,
        accepts: function (post) {
            return (post.type === 65);
        },
        draw: function (post) {
            this.text(post.description);
            getHelpFromUser(post);
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'reply-on-wallpost',
        index: 128,
        accepts: function (post) {
            return (post.type === 56);
        },
        draw: function (post) {
            this.text(post.message);
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'location',
        index: 128,
        accepts: function (post) {
            return (post.type === 285 && post.attachment && post.attachment.caption);
        },
        draw: function (post) {
            this.text(post.attachment.caption);
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'like',
        index: 128,
        accepts: function (post) {
            return (post.type === 161);
        },
        draw: function (post) {
            this.append(
                $('<div>').text(post.description));
            if (post.attachment && post.attachment.name && post.attachment.href) {
                var attachment = post.attachment;
                $('<a>', {href: attachment.href}).text(attachment.name);
            }
            getHelpFromUser(post);
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'photo-comment',
        index: 128,
        accepts: function (post) {
            return (post.type === 257);
        },
        draw: function (post) {
            this.text(post.description);
            getHelpFromUser(post);
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'link-like',
        index: 128,
        accepts: function (post) {
            return (post.type === 347);
        },
        draw: function (post) {
            if (post.attachment.href && post.attachment.name) {
                var $link = $('<a>', {href: post.attachment.href}).text(post.attachment.name);
                this.text(gt('Liked a link: %s', $link));
            }
            getHelpFromUser(post);
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'photo-share',
        index: 128,
        accepts: function (post) {
            return post.type === 80 && post.attachment.fb_object_type === 'photo';
        },
        draw: function (post) {
            var media = post.attachment.media[0];

            $('<div class="message">').text(post.attachment.name || post.message).appendTo($(this));
            if (media !== undefined) {
                $('<a>').attr({href: media.href})
                    .append($('<img>').attr({src: media.src}).css({height: '150px', width: 'auto'}))
                    .append($('<div>').text(post.attachment.caption))
                    .appendTo($(this));
            }
        }
    });

    /* index >= 196 for plugins handling generic stuff (like the common comment) */

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'link',
        index: 196,
        accepts: function (post) {
            return post.type === 80 &&
                post.attachment.caption !== "www.youtube.com" &&
                post.attachment.media[0];
        },
        draw: function (post) {
            var media = post.attachment.media[0];
            this.append(
                $('<div>').text(post.description || post.message || ''),
                $('<a>', {href: media.href}).append(
                    $('<img class="wall-img-left">', {src: media.src}),
                    $('<span class="caption">').text(post.attachment.description)
                )
            );
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'video',
        index: 196,
        accepts: function (post) {
            return (post.type === 128) || (post.type === 80 && post.attachment.caption === "www.youtube.com");
        },
        draw: function (post) {
            var media = post.attachment.media[0];

            $('<div class="message">').text(post.attachment.name || post.message).appendTo($(this));
            if (media !== undefined) {
                $('<a>').attr({href: media.href})
                    .append($('<img>').attr({src: media.src}).css({height: '150px', width: 'auto'}))
                    .appendTo($(this));
            }
        }
    });


    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'app-story',
        index: 196,
        accepts: function (post) {
            return (post.type === 237);
        },
        draw: function (post) {
            $('<div class="message">').text(post.message).appendTo($(this));
            if (post.attachment && post.attachment.media && post.attachment.media[0]) {
                var media = post.attachment.media[0];
                $('<a class="app-story">').attr('href', media.href).append(
                    $('<img class="wall-img-left">').attr('src', media.src),
                    $('<span class="caption title">').text(post.attachment.name),
                    $('<br>'),
                    $('<span class="caption">').text(post.attachment.description)).appendTo($(this));
            }
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'new-cover-photo',
        index: 196,
        accepts: function (post) {
            return post.type === 373 && post.attachment.media[0];
        },
        draw: function (post) {
            var media = post.attachment.media[0];
            this.append(
                $('<div>').text(post.description || post.message || ''),
                $('<a>', { href: media.href }).append(
                    $('<img class="wall-img-left">').attr({ src: media.src })
                )
            );
        }
    });

    /* index >224 for fallback solutions */
    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'fallback',
        index: 256,
        accepts: function (post) {
            return true;
        },
        draw: function (post) {
            console.log('This message is of the type "' + post.type + '". We do not know how to render this yet. Please tell us about it! Here is some additional data:', JSON.stringify(post));
            this.text(post.message);
        }
    });

    ext.point('io.ox/portal/widget/facebook/settings').extend({
        title: gt('Facebook'),
        type: 'facebook',
        editable: false,
        unique: true
    });
});
