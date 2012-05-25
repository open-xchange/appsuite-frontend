/* EXAMPLE:
{
    "data": [{
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
            var def = proxy.request({api: "facebook", url: "https://graph.facebook.com/me/feed"});
            return def;
        },

        draw: function (wall) {
            var self = this;
            console.log(wall);
            self.append($("<div>").addClass("clear-title").text("Facebook"));
            _(wall).each(function (post) {
                var entry_id = "facebook-" + post.id;
                var elem = $("<div>").addClass("facebook wall-entry").attr("id", entry_id);
                //user pic and name
                elem.append(
                    $("<a>").addClass("from").text(post.from.name).attr("href", "https://graph.facebook.com/" + post.from.id)
                    .append($("<img>").addClass("picture").attr("src", "https://graph.facebook.com/" + post.from.id + "/picture"))
                    );
                    
                //message
                elem.append($("<div>").addClass("wall-post").text(post.message || post.story));
                
                //image post
                if (post.picture) {
                    elem.append(
                        $("<a>").attr("href", post.link).addClass("picture").append($("<img>").addClass("picture").attr("src", post.picture)));
                }
                
                //actions like "like"
/*                _(post.actions).each(function (action) {
                    elem.append($("<a>").addClass("action").text(action.name).attr("href", action.link));
                });*/
                
                //post date
                elem.append($("<span>").addClass("datetime").text(post.created_time));
                
                //comments
                if (post.comments && post.comments.data) {
                    //display comments on/off
                    var comment_toggler = $("<a>").addClass("comment-toggle").text("Hide comments");
                    comment_toggler.click(function () {
                        var comment_id = "#" + entry_id + " .wall-comment";
                        $(comment_id).toggle('fast', function () {});
                        if (comment_toggler.text() === "Show comments") { comment_toggler.text("Hide comments"); } else { comment_toggler.text("Show comments"); }

                    });
                    elem.append(comment_toggler);
                    
                    _(post.comments.data).each(function (comment) {
                        var comm = $("<div>").addClass("wall-comment");

                        comm.append(
                            $("<a>").addClass("from").text(post.from.name).attr("href", "https://graph.facebook.com/" + post.from.id)
                            .append($("<img>").addClass("picture").attr("src", "https://graph.facebook.com/" + post.from.id + "/picture"))
                            );

                        comm.append($("<div>").addClass("wall-post").text(comment.message));
                        elem.append(comm);
                    });
                }
                
                self.append(elem);
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
