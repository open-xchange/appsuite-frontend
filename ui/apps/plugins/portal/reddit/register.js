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
 * @author Markus Bode <markus.bode@open-xchange.com>
 */

define('plugins/portal/reddit/register',
    ['io.ox/portal/mediaplugin',
     'io.ox/mail/util',
     'gettext!io.ox/portal/mediaplugin'], function (MediaPlayer, mailUtil, gt) {

    'use strict';
    var mp = new MediaPlayer();
    var apiUrl = "http://www.reddit.com/r/##subreddit##/new.json?sort=new";

    mp.addFeed({
        id: "reddit-funny",
        description: "Funny",
        url: apiUrl.split("##subreddit##").join("funny") + "&jsonp=",
        index: 110
    });

    mp.setOptions({bigPreview: true});

    var extractThumbnail = function (entry) {
        var thumbUrl = "",
            big = mp.getOption('bigPreview');

        if (entry.domain === "imgur.com" || entry.domain === "i.imgur.com") {
            if (big) {
                if (entry.domain === "imgur.com") {
                    thumbUrl = entry.url.replace(/http:\/\/imgur/g, 'http://i.imgur') + ".jpg";
                } else {
                    thumbUrl = entry.url;
                }
            } else if (entry.thumbnail) {
                thumbUrl = entry.thumbnail;
            }
        }

        return thumbUrl;
    };

    mp.init({
        appendLimitOffset: function (myurl, count, offset) {
            if (count) {
                myurl += "&limit=" + count;
            }

            if (offset) {
                myurl += "&offset=" + count * offset;
            }

            return myurl;
        },
        determineSuccessfulResponse: function (j) {
            return j && j.data ? j.data : {};
        },
        getDataArray: function (j) {
            return j.children;
        },
        elementPreview: function ($node, entry) {
            var thumbUrl = "",
                big = mp.getOption('bigPreview');

            entry = entry.data;

            if (entry.domain === "imgur.com" || entry.domain === "i.imgur.com") {
                if (big) {
                    if (entry.domain === "imgur.com") {
                        thumbUrl = entry.url.replace(/http:\/\/imgur/g, 'http://i.imgur') + ".jpg";
                    } else {
                        thumbUrl = entry.url;
                    }
                } else if (entry.thumbnail) {
                    thumbUrl = entry.thumbnail;
                }
            } else if (entry.title) {
                $node.append($("<div>").addClass("mediaplugin-title mediaplugin-textbackground").text(entry.title));
            } else {
                $node.append($("<div>").addClass("mediaplugin-title mediaplugin-textbackground").text(gt("No title.")));
            }

            // TODO timezone
            $node.append($("<div>").addClass("mediaplugin-content mediaplugin-textbackground").html(entry.created_utc ? mailUtil.getDateTime(entry.created_utc * 1000) : ""));

            if (thumbUrl !== "") {
                var $img = $('<img/>', {'data-original': thumbUrl});//, height: thumbHeight, width: thumbWidth});
                return $img;
//                mp.resizeImage($img, 64, 64);
//                $node.append($img);
            }
            return false;
        },
        popupContent: function ($popup, entry, $busyIndicator) {
            var maxWidth = $popup.width();
            var maxHeight = $popup.height();

            var willDisableBusyIndicator = false;

            entry = entry.data;
            console.log(entry);

            if (entry.title) {
                $popup.append($("<div>").addClass("mediaplugin-title").text(entry.title));
            }
//            if (entry.description) {
//                // TODO xss
//                var $description = $("<div/>").html(entry.description);
//                $popup.append($description);
//                maxHeight -= $description.height();
//            }

//            if (entry.body) {
//                // TODO xss
//                var $body = $("<div/>").html(entry.body);
//                $popup.append($body);
//                maxHeight -= $body.height();
//            }

//            if (entry.player) {
//                $popup.append($("<div/>").html(entry.player[0].embed_code));
//            } else if (entry.photos) {
//                willDisableBusyIndicator = true;
//
//                _(entry.photos).each(function (p) {
//                    var photo = p.original_size;
//                    var $img = $("<img/>", {'src': photo.url, height: photo.height, width: photo.width}).css({display: 'none'})
//                        .load(function () {
//                            if ($busyIndicator) {
//                                $busyIndicator.detach();
//                                $(this).fadeIn();
//                            }
//                        });
//
//                    mp.resizeImage($img, maxWidth, maxHeight);
//                    $popup.append($img);
//                });
//            } else {
//                $popup.append($("<a/>", {href: entry.post_url, target: "_blank"}).text(entry.post_url)
//                        .on("click", function (e) {
//                            e.stopPropagation();
//                        }));
//            }
//
//            if (entry.caption) {
//                // TODO xss
//                $popup.append(entry.caption);
//            }

            if ($busyIndicator && !willDisableBusyIndicator) {
                $busyIndicator.detach();
            }
        },
        getImagesFromEntry: function (entry, imageCollection) {
            if (entry.photos) {
                _(entry.photos).each(function (p) {
                    var photo = p.original_size;
                    imageCollection.push(photo.url);
                });
            }
        }
    });
});
