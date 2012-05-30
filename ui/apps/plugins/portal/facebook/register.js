/* EXAMPLE:
{
    "data": [{
        "id": "100000510769600_397839420255304",
        "from": {
            "name": "Ewald Bartkowiak",
            "id": "100000510769600"
        },
        "message": "A message from Burt Gummer: http:\/\/www.youtube.com\/watch?v=rDQ8J_HJ7iw",
        "picture": "http:\/\/external.ak.fbcdn.net\/safe_image.php?d=AQCmH9VAOrHny4KP&w=130&h=130&url=http\u00253A\u00252F\u00252Fi3.ytimg.com\u00252Fvi\u00252FrDQ8J_HJ7iw\u00252Fhqdefault.jpg",
        "link": "http:\/\/www.youtube.com\/watch?v=rDQ8J_HJ7iw",
        "source": "http:\/\/www.youtube.com\/v\/rDQ8J_HJ7iw?version=3&autohide=1&autoplay=1",
        "name": "A Message From Burt Gummer",
        "caption": "www.youtube.com",
        "description": "A Promo for the show Tremors: The Series. This played before different episodes during a Tremors the series Marathon back when the show aired on Scifi (SyFy).",
        "icon": "http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/yj\/r\/v2OnaTyTQZE.gif",
        "actions": [{
            "name": "Comment",
            "link": "http:\/\/www.facebook.com\/100000510769600\/posts\/397839420255304"
        },
        {
            "name": "Like",
            "link": "http:\/\/www.facebook.com\/100000510769600\/posts\/397839420255304"
        }],
        "privacy": {
            "description": "Public",
            "value": "EVERYONE"
        },
        "type": "video",
        "created_time": "2012-05-25T14:14:05+0000",
        "updated_time": "2012-05-25T14:14:05+0000",
        "comments": {
            "count": 0
        }
    },
    {
        "id": "100000510769600_466646893362332",
        "from": {
            "name": "Ewald Bartkowiak",
            "id": "100000510769600"
        },
        "story": "Ewald Bartkowiak added a new photo.",
        "picture": "http:\/\/photos-b.ak.fbcdn.net\/hphotos-ak-ash3\/559582_466646870029001_100000510769600_1849523_1665212338_s.jpg",
        "link": "http:\/\/www.facebook.com\/photo.php?fbid=466646870029001&set=a.466646866695668.127206.100000510769600&type=1",
        "icon": "http:\/\/static.ak.fbcdn.net\/rsrc.php\/v2\/yz\/r\/StEh3RhPvjk.gif",
        "actions": [{
            "name": "Comment",
            "link": "http:\/\/www.facebook.com\/100000510769600\/posts\/466646893362332"
        },
        {
            "name": "Like",
            "link": "http:\/\/www.facebook.com\/100000510769600\/posts\/466646893362332"
        }],
        "privacy": {
            "description": "Public",
            "value": "EVERYONE"
        },
        "type": "photo",
        "object_id": "466646870029001",
        "created_time": "2012-05-21T14:22:29+0000",
        "updated_time": "2012-05-21T14:22:29+0000",
        "comments": {
            "count": 0
        }
    },
    {
        "id": "100000510769600_466519373375084",
        "from": {
            "name": "Ewald Bartkowiak",
            "id": "100000510769600"
        },
        "message": "Hey, ich benutze jetzt Facebook! Facebook ist cool. Jetzt muss ich noch Freunde finden!",
        "actions": [{
            "name": "Comment",
            "link": "http:\/\/www.facebook.com\/100000510769600\/posts\/466519373375084"
        },
        {
            "name": "Like",
            "link": "http:\/\/www.facebook.com\/100000510769600\/posts\/466519373375084"
        }],
        "privacy": {
            "description": "Public",
            "value": "EVERYONE"
        },
        "type": "status",
        "created_time": "2012-05-21T09:57:02+0000",
        "updated_time": "2012-05-21T14:19:54+0000",
        "comments": {
            "data": [{
                "id": "100000510769600_466519373375084_5788194",
                "from": {
                    "name": "Ewald Bartkowiak",
                    "id": "100000510769600"
                },
                "message": "Hm. Ich kenne immer noch niemanden",
                "created_time": "2012-05-21T14:19:17+0000",
                "likes": 1
            },
            {
                "id": "100000510769600_466519373375084_5788199",
                "from": {
                    "name": "Ewald Bartkowiak",
                    "id": "100000510769600"
                },
                "message": "Immer noch nicht...",
                "created_time": "2012-05-21T14:19:54+0000"
            }],
            "count": 2
        }
    }],
    "paging": {
        "previous": "https:\/\/graph.facebook.com\/me\/feed?access_token=AAAAADOoW7OkBAKIwvixUNrIfPhGZAlitW5I3uwCKsbbDMODUsJARfOb3e63yISxnC57tNG68H2moGXMpp66gLEVpHZAxS1sVtlpLGMwQZDZD&limit=25&since=1337610149&__previous=1",
        "next": "https:\/\/graph.facebook.com\/me\/feed?access_token=AAAAADOoW7OkBAKIwvixUNrIfPhGZAlitW5I3uwCKsbbDMODUsJARfOb3e63yISxnC57tNG68H2moGXMpp66gLEVpHZAxS1sVtlpLGMwQZDZD&limit=25&until=1291995039"
    }
}
*/

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
define("plugins/portal/facebook/register", ["io.ox/core/extensions", "io.ox/oauth/proxy"], function (ext, proxy) {

    "use strict";
    ext.point("io.ox/portal/widget").extend({
        id: "facebook",
        index: 150,

        load: function () {
            var def = proxy.request({api: "facebook", url: "https://graph.facebook.com/me/feed?limit=10"});
            return def.pipe(function (response) { return JSON.parse(response); });
        },

        draw: function (wall) {
            var self = this;
            self.append($("<div>").addClass("clear-title").text("Facebook"));

            var count = 0;
            _(wall.data).each(function (post) {
                var entry_id = "facebook-" + post.id;
                var wall_content = $("<div>").addClass("facebook wall-entry").attr("id", entry_id);
                //user pic
                wall_content.append($("<img>").addClass("picture").attr("src", "https://graph.facebook.com/" + post.from.id + "/picture"));
                                    
                var wall_post = $("<div>").addClass("wall-post");
                
                //user name
                wall_post.append($("<a>").addClass("from").text(post.from.name).attr("href", "http://www.facebook.com/profile.php?id=" + post.from.id));
                
                //status message
                if (post.type === "status" || (post.type === "video" && post.caption !== "www.youtube.com")) {
                    wall_post.append($("<div>").addClass("wall-post-text").text(post.message));
                }
                
                //image post
                if (post.type === "photo") {
                    wall_post.append($("<div>").addClass("wall-post-text").text(post.story));
                    wall_post.append(
                        $("<a>").attr("href", post.link).addClass("picture").append($("<img>").addClass("picture").attr("src", post.picture)));
                }
                
                //youtube video post
                if (post.type === "video" && post.caption === "www.youtube.com") {
                    wall_post.append($("<div>").addClass("wall-post-text").text(post.name));
                    /watch\?v=(.+)/.exec(post.link);
                    var vid_id = RegExp.$1;
                    wall_post.append(
                        $("<a>").attr("href", post.link).addClass("video")
                            .append($("<img>").addClass("video-preview").attr("src", "http://img.youtube.com/vi/" + vid_id + "/2.jpg"))
                            .append($("<span>").addClass("caption").text(post.description)));
                }
                
                wall_content.append(wall_post);
                
                //actions like "like"
/*                _(post.actions).each(function (action) {
                    wall_post.append($("<a>").addClass("action").text(action.name).attr("href", action.link));
                });*/
                
                //post date
                wall_post.append($("<span>").addClass("datetime").text(post.created_time));
                
                wall_content.append(wall_post);
                
                //comments
                if (post.comments && post.comments.data) {
                    //display comments on/off
                    var comment_id = "#" + entry_id + " .wall-comment";
                    var comment_toggler = $("<a>").addClass("comment-toggle").text("Show comments");
                    
                    comment_toggler.click(function () {
                        comment_toggler.data("unfolded", !comment_toggler.data("unfolded"));
                        $(comment_id).toggle('fast');
                        if (comment_toggler.data("unfolded")) { comment_toggler.text("Hide comments"); } else { comment_toggler.text("Show comments"); }

                    });
                    wall_content.append(comment_toggler);
                    
                    _(post.comments.data).each(function (comment) {
                        var comm = $("<div>").addClass("wall-comment");
                        var name = $("<a>").addClass("from").text(post.from.name).attr("href", "http://www.facebook.com/profile.php?id=" + post.from.id);
                        var msg = $("<div>").addClass("wall-comment-text").text(comment.message);

                        comm.append($("<img>").addClass("picture").attr("src", "https://graph.facebook.com/" + post.from.id + "/picture"));
                        comm.append($("<div>").addClass("wall-comment-content").append(name).append(msg));
                        wall_content.append(comm);
                        comm.hide();
                    });
                    
                    comment_toggler.data("unfolded", false);
                }
                wall_content.find("a").each(function (index, elem) {
                    $(elem).attr("target", "_blank");
                });
                self.append(wall_content);
            });
/*            if (wall.paging.previous) {
                self.append($("<a>").addClass("paging previous").text("Previous").attr("href", wall.paging.previous));
            }
            if (wall.paging.next) {
                self.append($("<a>").addClass("paging next").text("Next").attr("href", wall.paging.next));
            }*/

            return $.Deferred().resolve();
        }
    });
    
    
});
