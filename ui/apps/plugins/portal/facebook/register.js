/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author  Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/portal/facebook/register',
    ['io.ox/core/extensions',
     'io.ox/oauth/proxy',
     'io.ox/keychain/api',
     'io.ox/core/date',
     'gettext!plugins/portal',
     'less!plugins/portal/facebook/style'
    ], function (ext, proxy, keychain, date, gt) {

    'use strict';

    var fnToggle = function () {
        var self = $(this);
        self.data('unfolded', !self.data('unfolded'))
            .text(self.data('unfolded') ? gt('Hide comments') : gt('Show comments'))
            .parent().find('.wall-comment, .comment-link').toggle('fast');
    };

    var createCommentIterator = function (profiles, node) {
        return function (comment) {
            var from = getProfile(profiles, comment.fromid),
                comment = $('<div class="wall-comment">').append(
                    $('<a class="profile-picture">').attr('href', from.url).append(
                        $('<img class="picture">').attr('src', from.pic_square)),
                    $('<div class="wall-comment-content">').append(
                        $('<a class="from">').text(from.name).attr('href', from.url),
                        $('<div class="wall-comment-text">').text(comment.text),
                        $('<span class="datetime">').text(new date.Local(comment.time * 1000)),
                        addLikeInfo({user_likes: comment.user_likes, like_count: comment.likes}))
                    )
                    .appendTo($(node));
            //only hide if comments are hidden
            if ($(node).find('.wall-comment:visible').length === 0) {
                comment.hide();
            }
        };
    };
    var addLikeInfo = function (likeInfo) {
            if (likeInfo.like_count === 0) {
                return '';
            } else {
                return $('<span class="likeinfo">').append(
                           $('<span class="youlike">').text(likeInfo.user_likes ? gt('You like this') : ''),
                           $('<i class="fa fa-thumbs-o-up">'),
                           $('<span class="count">').text(likeInfo.like_count)
                       );
            }
        },
        //Renderer that should be able to draw most posts correctly
        generalRenderer = function (post) {
            var media = post.attachment.media ? post.attachment.media[0] : false,
                link = post.attachment.href;

            return [
                $('<div>').append(parseMessageText(post.description || post.message || '')),
                media ? $('<a>', {href: media.href}).append(
                    $('<img class="wall-img-left">').attr({src: media.src}),
                    $('<span class="caption">').text(post.attachment.description)
                ) : '',
                (!media && link) ? $('<a>', {href: link}).text(post.attachment.name || link) : ''
            ];
        };

    var addCommentlink = function (postComments, nextIndex, profiles, wall_content) {
        var link = $('<button tabindex=1 class="comment-link btn-link", nextIndex=' + nextIndex + '>').text(gt('Show more comments')).hide().click(function () {
            //remove link from dom but don't delete it yet
            link.detach();
            var tempIndex = parseInt(link.attr('nextIndex'));
            //render next 25 comments
            _(postComments.slice(tempIndex, tempIndex + 25)).each(createCommentIterator(profiles, wall_content));
            if (postComments[tempIndex + 25]) {
                //add link again
                link.attr('nextIndex', tempIndex + 25);
                wall_content.append(link);
            } else {
                //link not needed anymore
                link.off();
                link = null;
            }

        });
        wall_content.append(link);
    };

    //parses text to filter links and wraps them in <a> nodes
    //non link text is wrapped in spans
    //returns array of nodes
    var parseMessageText = function (text) {
        var linkRegexp = /\b(https?:\/\/|www.)\S+\.\S+\b/gi,
            //extract links
            links = (text.match(linkRegexp) || [] ),
            nodes = [],
            tempText = text;

        _(links).each(function (link) {
            var splitText = tempText.split(link, 1);
            if(splitText[0]) {
                nodes.push($('<span>').text(splitText[0]));
            }
            nodes.push($('<a href="' + link + '">').text(link));
        });

        if (!nodes.length) {
            return $('<span>').text(text);
        } else {
            return nodes;
        }
    };

    var getProfile = function (profiles, actor_id) {
        return _.find(profiles, function (profile) { return profile.id === actor_id; });
    };

    var getHelpFromUser = function (post) {
        console.log('Little was known about this type of post (#' + post.type + ') when we wrote this program. Maybe you can send us the following information so we can improve it?',
            JSON.stringify(post));
    };

    var loadFromFacebook = function () {
        return proxy.request({
                api: 'facebook',
                url: 'https://graph.facebook.com/v2.0/fql?q=' + JSON.stringify({
                    newsfeed: 'SELECT post_id, actor_id, message, type, description, like_info, comments, action_links, app_data, attachment, created_time, source_id FROM stream WHERE filter_key in (SELECT filter_key FROM stream_filter WHERE uid=me() AND type = \'newsfeed\') AND is_hidden = 0',
                    profiles: 'SELECT id, name, url, pic_square FROM profile WHERE id IN (SELECT actor_id, source_id FROM #newsfeed) OR id IN (SELECT fromid FROM comment WHERE post_id IN (SELECT post_id FROM #newsfeed))',
                    comment: 'SELECT id, post_id, attachment, fromid, is_private, likes, user_likes, text, time, user_likes FROM comment WHERE post_id IN (SELECT post_id FROM #newsfeed)'
                })
            })
            .pipe(JSON.parse).fail(require('io.ox/core/notifications').yell);
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
            profiles = resultsets.data[2].fql_result_set;

        if (!wall || wall.length === 0) {
            content.append(
                $('<li class="paragraph">').text(gt('No wall posts yet.')));
        } else {
            wall = wall.slice(0, _.device('smartphone') ? 1 : 10);
            _(wall).each(function (post) {
                var message = _.ellipsis(post.message || post.description || post.attachment.caption || '', {max: 150});
                content.append(
                    $('<li class="paragraph">').append(
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
                    console.error(gt('Something went wrong reauthorizing the %s account.', 'Facebook'));
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

    var refreshWidget = function () {
        require(['io.ox/portal/main'], function (portal) {
            var portalApp = portal.getApp(),
                portalModels = portalApp.getWidgetCollection().filter(function (model) { return /^facebook_\d*/.test(model.id); });

            if (portalModels.length > 0) {
                portalApp.refreshWidget(portalModels[0], 0);
            }
        });
    };

    ext.point('io.ox/portal/widget/facebook').extend({

        title: gt('Facebook'),

        initialize: function (baton) {
            keychain.submodules.facebook.on('update', function () {
                loadFromFacebook().done(function (data) {
                    baton.data = data;
                    if (baton.contentNode) {
                        baton.contentNode.empty();
                        drawPreview(baton);
                    }
                });
            });
            keychain.submodules.facebook.on('delete', refreshWidget);
        },

        isEnabled: function () {
            return keychain.isEnabled('facebook');
        },

        requiresSetUp: function () {
            return keychain.isEnabled('facebook') && !keychain.hasStandardAccount('facebook');
        },

        drawDefaultSetup: function (baton) {
            keychain.submodules.facebook.off('create', null, this);
            keychain.submodules.facebook.on('create', function () {
                baton.model.node.find('h2 .fa-facebook').replaceWith($('<span class="title">').text(gt('Facebook')));
                baton.model.node.removeClass('requires-setup widget-color-custom color-facebook');
                refreshWidget();
            }, this);

            this.find('h2 .title').replaceWith('<i class="fa fa-facebook">');
            this.addClass('widget-color-custom color-facebook');
        },

        performSetUp: function () {
            var win = window.open(ox.base + '/busy.html', '_blank', 'height=400, width=600');
            return keychain.createInteractively('facebook', win);
        },

        preview: function (baton) {
            var content = $('<ul class="content list-unstyled" tabindex="1" role="button" aria-label="' + gt('Press [enter] to jump to the facebook stream.') + '">');
            baton.contentNode = content;
            drawPreview(baton);
            this.append(content);
        },

        load: function (baton) {

            if (!keychain.hasStandardAccount('facebook'))
                return $.Deferred().reject({ code: 'OAUTH-0006' });

            return proxy.request({
                api: 'facebook',
                url: 'https://graph.facebook.com/v2.0/fql?q=' + JSON.stringify({
                    newsfeed: 'SELECT post_id, actor_id, message, type, description, like_info, comments, action_links, app_data, attachment, created_time, source_id FROM stream WHERE filter_key in (SELECT filter_key FROM stream_filter WHERE uid=me() AND type = \'newsfeed\') AND is_hidden = 0',
                    profiles: 'SELECT id, name, url, pic_square FROM profile WHERE id IN (SELECT actor_id, source_id FROM #newsfeed) OR id IN (SELECT fromid FROM comment WHERE post_id IN (SELECT post_id FROM #newsfeed))',
                    comment: 'SELECT id, post_id, attachment, fromid, is_private, likes, user_likes, text, time, user_likes FROM comment WHERE post_id IN (SELECT post_id FROM #newsfeed)'
                })
            })
            .pipe(JSON.parse)
            .done(function (data) {
                baton.data = data;
            }).fail(require('io.ox/core/notifications').yell);
        },

        draw: function (baton) {
            var resultsets = baton.data,
                wall = resultsets.data[0].fql_result_set,
                profiles = resultsets.data[2].fql_result_set,
                comments = resultsets.data[1].fql_result_set;

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
                        //add expand link for long content
                        $('<button class="facebook-content-expand btn-link">').hide().text(gt('expand')).on('click', function () {
                            var content = wall_content.find('.wall-post-content');
                            if (content.css('max-height') !== content.prop('scrollHeight') + 'px') {
                                //sliding animation
                                content.animate({'max-height': content.prop('scrollHeight') + 'px'}, 'fast');
                                $(this).text(gt('collapse'));
                            } else {
                                //sliding animation
                                content.animate({'max-height': '350px'}, 'fast');
                                $(this).text(gt('expand'));
                            }
                        }),
                        $('<span class="datetime">').text(new date.Local(post.created_time * 1000)),
                        addLikeInfo(post.like_info)
                    ));

                ext.point('io.ox/plugins/portal/facebook/renderer').each(function (renderer) {
                    var content_container = wall_content.find('div.wall-post-content');
                    if (renderer.accepts(post) && !foundHandler) {
                        //for better identifing the contenttype later on
                        content_container.attr('renderer', renderer.id);
                        //this is too useful to delete it, just uncomment it
                        //console.log(profile.name, ' Renderer: ', renderer.id, post);
                        renderer.draw.apply(content_container, [post]);
                        foundHandler = true;
                    }
                });
                //not used as long as there is a catch-all handler! TODO: Should work in production code.
                if (!foundHandler) {
                    return;
                }

                //comments
                if (post.comments && post.comments.comment_list.length > 0) {
                    //toggle comments on/off
                    $('<button class="btn-link comment-toggle">')
                        .text(gt('Show comments'))
                        .on('click', fnToggle)
                        .data('unfolded', false)
                        .appendTo(wall_content);
                    var postComments = _(comments).filter(function (comment) {
                            return comment.post_id === post.post_id;
                        });
                    //render comments in blocks of 25
                    _(postComments.slice(0, 25)).each(createCommentIterator(profiles, wall_content));
                    if (postComments.length > 25) {
                        addCommentlink(postComments, 25, profiles, wall_content);
                    }
                }

                //make all outgoing links open new tabs/windows
                wall_content.find('a').attr('target', '_blank');

                wall_content.find('img').one('load', function () {
                    //parseInt cuts of the px part too
                    if (parseInt(wall_content.find('.wall-post-content').css('height')) >= 350) {
                        wall_content.find('.facebook-content-expand').show();
                    }
                });
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
                    $('<i class="fa fa-times io-ox-portal-action">'))
            );
        }
    });

    /* index >= 128 for all plugins with a clearly defined purpose (meaning: I exactly know what I'm doing) */
    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'photo',
        index: 128,
        accepts: function (post) {
            return (post.type === 247);
        },
        draw: function (post) {
            var self = $(this);
            $('<div class="message">').append(parseMessageText(post.message || post.attachment.name)).appendTo($(this));
            _(post.attachment.media).each(function (media) {
                $('<a class = facebook-image>').attr({href: media.href})
                    .append($('<img>').attr({src: media.src}).css({height: '150px', width: 'auto'}))
                    .append($('<div>').text(post.attachment.caption))
                    .appendTo(self);
            });
        }
    });

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'status',
        index: 128,
        accepts: function (post) {
            return (post.type === 46);
        },
        draw: function (post) {
            this.append(parseMessageText(post.message));
        }
    });

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'friends',
        index: 128,
        accepts: function (post) {
            return (post.type === 8);
        },
        draw: function (post) {
            this.append(parseMessageText(post.message));
        }
    });

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'tagged-in-photo',
        index: 128,
        accepts: function (post) {
            return (post.type === 65);
        },
        draw: function (post) {
            this.append(parseMessageText(post.description));
            getHelpFromUser(post);
        }
    });

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'reply-on-wallpost',
        index: 128,
        accepts: function (post) {
            return (post.type === 56);
        },
        draw: function (post) {
            this.append(parseMessageText(post.message));
        }
    });

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'location',
        index: 128,
        accepts: function (post) {
            return (post.type === 285 && post.attachment && post.attachment.caption);
        },
        draw: function (post) {
            this.text(post.attachment.caption);
        }
    });

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
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

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
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

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
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

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'photo-share',
        index: 128,
        accepts: function (post) {
            return post.type === 80 && post.attachment.fb_object_type === 'photo';
        },
        draw: function (post) {
            $('<div class="message">').append(parseMessageText(post.attachment.name || post.message)).appendTo($(this));
            var self = $(this);
            _(post.attachment.media).each(function (media) {
                $('<a class = facebook-image>').attr({href: media.href})
                    .append($('<img>').attr({src: media.src}).css({height: '150px', width: 'auto'}))
                    .append($('<div>').text(post.attachment.caption))
                    .appendTo(self);
            });
        }
    });

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'life-event',
        index: 128,
        accepts: function (post) {
            return post.type === 424;
        },
        draw: function (post) {
            $(this).append(
                    $('<div>').text(post.description),
                    $('<div class="message">').append(parseMessageText(post.message)));
            var self = $(this);
            _(post.attachment.media).each(function (media) {
                $('<a class = facebook-image>').attr({href: media.href})
                    .append($('<img>').attr({src: media.src}).css({height: '150px', width: 'auto'}))
                    .append($('<div>').text(post.attachment.caption))
                    .appendTo(self);
            });
        }
    });

    //special renderer for undocumented types
    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'Undocumented',
        index: 128,
        accepts: function (post) {
            //maybe an event
            return post.type === 55;
        },
        draw: function (post) {
            $(this).append(
                    $('<div>').text(post.description),
                    $('<div class="message">').append(parseMessageText(post.message)));
            var self = $(this);
            _(post.attachment.media).each(function (media) {
                $('<a class = facebook-image>').attr({href: media.href})
                    .append($('<img>').attr({src: media.src}).css({height: '150px', width: 'auto'}))
                    .append($('<div>').text(post.attachment.caption))
                    .appendTo(self);
            });
        }
    });

    /* index >= 196 for plugins handling generic stuff (like the common comment) */

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'link',
        index: 196,
        accepts: function (post) {
            return post.type === 80 &&
                post.attachment.caption !== 'www.youtube.com' &&
                ((post.attachment.media && post.attachment.media[0]) || post.attachment.href);
        },
        draw: function (post) {
            this.append(generalRenderer(post));
        }
    });

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'video',
        index: 196,
        accepts: function (post) {
            return (post.type === 128) || (post.type === 80 && post.attachment.caption === 'www.youtube.com');
        },
        draw: function (post) {
            var media = post.attachment.media ? post.attachment.media[0] : false;

            $('<div class="message">').append(parseMessageText(post.attachment.name || post.message)).appendTo($(this));
            if (media) {
                $('<a>').attr({href: media.href})
                    .append($('<img>').attr({src: media.src}).css({height: '150px', width: 'auto'}))
                    .appendTo($(this));
            }
        }
    });

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'app-story',
        index: 196,
        accepts: function (post) {
            return (post.type === 237);
        },
        draw: function (post) {
            $('<div class="message">').append(parseMessageText(post.message)).appendTo($(this));
            if (post.attachment && post.attachment.media && post.attachment.media[0]) {
                var media = post.attachment.media[0];
                $('<a class="app-story">').attr('href', media.href || post.attachment.href).append(
                    $('<img class="wall-img-left">').attr('src', media.src),
                    $('<span class="caption title">').text(post.attachment.name),
                    $('<br>'),
                    $('<span class="caption">').text(post.attachment.description)).appendTo($(this));
            }
        }
    });

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        //really strange type
        id: 'friend-timeline-post-to-other-friend',
        index: 196,
        accepts: function (post) {
            return post.type === 295;
        },
        draw: function (post) {
            this.append(generalRenderer(post));
        }
    });

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'new-cover-photo',
        index: 196,
        accepts: function (post) {
            return post.type === 373 && post.attachment.media && post.attachment.media[0];
        },
        draw: function (post) {
            var media = post.attachment.media[0];
            this.append(
                $('<div>').append(parseMessageText(post.description || post.message || '')),
                $('<a>', { href: media.href }).append(
                    $('<img class="wall-img-left">').attr({ src: media.src })
                )
            );
        }
    });

    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'group-post',
        index: 196,
        accepts: function (post) {
            return post.type === 308;
        },
        draw: function (post) {
            this.append(generalRenderer(post));
        }
    });

    /* index >224 for fallback solutions */
    ext.point('io.ox/plugins/portal/facebook/renderer').extend({
        id: 'fallback',
        index: 256,
        accepts: function () {
            return true;
        },
        draw: function (post) {
            console.log('This message is of the type "' + post.type + '". We do not know how to render this yet. Please tell us about it! Here is some additional data:', JSON.stringify(post));
            this.append(generalRenderer(post));
        }
    });

    ext.point('io.ox/portal/widget/facebook/settings').extend({
        title: gt('Facebook'),
        type: 'facebook',
        editable: false,
        unique: true
    });
});
