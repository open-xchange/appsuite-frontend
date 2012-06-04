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
/* EXAMPLE:
{
    'data': [{
        'id': '100000510769600_397839420255304',
        'from': {
            'name': 'Ewald Bartkowiak',
            'id': '100000510769600'
        },
        'message': 'A message from Burt Gummer: http:\/\/www.youtube.com\/watch?v=rDQ8J_HJ7iw',
        'picture': 'http:\/\/external.ak.fbcdn.net\/safe_image.php?d=AQCmH9VAOrHny4KP&w=130&h=130&url=http\u00253A\u00252F\u00252Fi3.ytimg.com\u00252Fvi\u00252FrDQ8J_HJ7iw\u00252Fhqdefault.jpg',
        'link': 'http:\/\/www.youtube.com\/watch?v=rDQ8J_HJ7iw',
        'source': 'http:\/\/www.youtube.com\/v\/rDQ8J_HJ7iw?version=3&autohide=1&autoplay=1',
        'name': 'A Message From Burt Gummer',
        'caption': 'www.youtube.com',
        'description': 'A Promo for the show Tremors: The Series. This played before different episodes during a Tremors the series Marathon back when the show aired on Scifi (SyFy).',
        'icon': 'http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/yj\/r\/v2OnaTyTQZE.gif',
        'actions': [{
            'name': 'Comment',
            'link': 'http:\/\/www.facebook.com\/100000510769600\/posts\/397839420255304'
        },
        {
            'name': 'Like',
            'link': 'http:\/\/www.facebook.com\/100000510769600\/posts\/397839420255304'
        }],
        'privacy': {
            'description': 'Public',
            'value': 'EVERYONE'
        },
        'type': 'video',
        'created_time': '2012-05-25T14:14:05+0000',
        'updated_time': '2012-05-25T14:14:05+0000',
        'comments': {
            'count': 0
        }
    },
    {
        'id': '100000510769600_466646893362332',
        'from': {
            'name': 'Ewald Bartkowiak',
            'id': '100000510769600'
        },
        'story': 'Ewald Bartkowiak added a new photo.',
        'picture': 'http:\/\/photos-b.ak.fbcdn.net\/hphotos-ak-ash3\/559582_466646870029001_100000510769600_1849523_1665212338_s.jpg',
        'link': 'http:\/\/www.facebook.com\/photo.php?fbid=466646870029001&set=a.466646866695668.127206.100000510769600&type=1',
        'icon': 'http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/yz\/r\/StEh3RhPvjk.gif',
        'actions': [{
            'name': 'Comment',
            'link': 'http:\/\/www.facebook.com\/100000510769600\/posts\/466646893362332'
        },
        {
            'name': 'Like',
            'link': 'http:\/\/www.facebook.com\/100000510769600\/posts\/466646893362332'
        }],
        'privacy': {
            'description': 'Public',
            'value': 'EVERYONE'
        },
        'type': 'photo',
        'object_id': '466646870029001',
        'created_time': '2012-05-21T14:22:29+0000',
        'updated_time': '2012-05-21T14:22:29+0000',
        'comments': {
            'count': 0
        }
    },
    {
        'id': '100000510769600_466519373375084',
        'from': {
            'name': 'Ewald Bartkowiak',
            'id': '100000510769600'
        },
        'message': 'Hey, ich benutze jetzt Facebook! Facebook ist cool. Jetzt muss ich noch Freunde finden!',
        'actions': [{
            'name': 'Comment',
            'link': 'http:\/\/www.facebook.com\/100000510769600\/posts\/466519373375084'
        },
        {
            'name': 'Like',
            'link': 'http:\/\/www.facebook.com\/100000510769600\/posts\/466519373375084'
        }],
        'privacy': {
            'description': 'Public',
            'value': 'EVERYONE'
        },
        'type': 'status',
        'created_time': '2012-05-21T09:57:02+0000',
        'updated_time': '2012-05-21T14:19:54+0000',
        'comments': {
            'data': [{
                'id': '100000510769600_466519373375084_5788194',
                'from': {
                    'name': 'Ewald Bartkowiak',
                    'id': '100000510769600'
                },
                'message': 'Hm. Ich kenne immer noch niemanden',
                'created_time': '2012-05-21T14:19:17+0000',
                'likes': 1
            },
            {
                'id': '100000510769600_466519373375084_5788199',
                'from': {
                    'name': 'Ewald Bartkowiak',
                    'id': '100000510769600'
                },
                'message': 'Immer noch nicht...',
                'created_time': '2012-05-21T14:19:54+0000'
            }],
            'count': 2
        }
    }],
    'paging': {
        'previous': 'https:\/\/graph.facebook.com\/me\/feed?access_token=AAAAADOoW7OkBAKIwvixUNrIfPhGZAlitW5I3uwCKsbbDMODUsJARfOb3e63yISxnC57tNG68H2moGXMpp66gLEVpHZAxS1sVtlpLGMwQZDZD&limit=25&since=1337610149&__previous=1',
        'next': 'https:\/\/graph.facebook.com\/me\/feed?access_token=AAAAADOoW7OkBAKIwvixUNrIfPhGZAlitW5I3uwCKsbbDMODUsJARfOb3e63yISxnC57tNG68H2moGXMpp66gLEVpHZAxS1sVtlpLGMwQZDZD&limit=25&until=1291995039'
    }
}
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
            return proxy.request({ api: 'facebook', url: 'https://graph.facebook.com/me/feed?limit=5'}).pipe(JSON.parse);
        },

        draw: function (wall) {
            console.log(wall, wall.length);
            this.append($('<div>').addClass('clear-title').text('Facebook'));

            _(wall.data).each(function (post) {
                var entry_id = 'facebook-' + post.id;
                var wall_content = $('<div class="facebook wall-entry">').attr('id', entry_id);
                var profile_link = 'http://www.facebook.com/profile.php?id=' + post.from.id;
                var foundHandler = false;
                
                // basic wall post skeleton
                wall_content.append(
                    $('<a class="profile-picture">').attr('href', profile_link).append(
                        $('<img class="picture">').attr('src', 'https://graph.facebook.com/' + post.from.id + '/picture')),
                    $('<div class="wall-post">').append(
                        $('<a class="from">').text(post.from.name).attr('href', profile_link),
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
            return (post.type === 'photo');
        },
        draw: function (post) {
            this.text(post.story || post.message).append(
                $('<a class="posted-image">').attr('href', post.link)
                    .append($('<img class="posted-image">').attr('src', post.picture)));
        }
    });
    
    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'youtube',
        index: 128,
        accepts: function (post) {
            return (post.type === 'video' && post.caption === 'www.youtube.com');
        },
        draw: function (post) {
            /watch\?v=(.+)/.exec(post.link);
            var vid_id = RegExp.$1;
            
            this.text(post.message).append(
                $('<a class="video">').attr('href', post.link).append(
                    $('<img class="video-preview">').attr('src', 'http://img.youtube.com/vi/' + vid_id + '/2.jpg'),
                    $('<span class="caption">').text(post.description)));
        }
    });
    
    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'status',
        index: 128,
        accepts: function (post) {
            return (post.type === 'status');
        },
        draw: function (post) {
            this.text(post.message);
        }
    });
    
    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'link',
        index: 128,
        accepts: function (post) {
            return (post.type === 'link');
        },
        draw: function (post) {
//            this.text(post.message);
            var result = $.linkSplit(post.message);
            this.append.apply(this, result);
            console.log("Finding links", result);
        }
    });

    ext.point('plugins/portal/facebook/renderer').extend({
        id: 'other_video',
        index: 196,
        accepts: function (post) {
            return (post.type === 'video');
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
            this.html('<em style="color: red;">This message is of the type <b>' + post.type + '</b>. We do not know how to render this yet. Please write a e-mail to <a href="mailto:tobias.prinz@open-xchange.com?subject=Unkown Facebook type: ' + post.type + '">tobias.prinz@open-xchange.com</a></em>');
        }
    });
});
