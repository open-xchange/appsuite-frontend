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

define('plugins/portal/tumblr/register',
    ['io.ox/portal/mediaplugin',
     'io.ox/mail/util',
     'gettext!io.ox/portal/mediaplugin'], function (MediaPlayer, mailUtil, gt) {

    'use strict';
    var mp = new MediaPlayer();
    var apiUrl = "http://api.tumblr.com/v2/blog/##blog##/posts/?api_key=gC1vGCCmPq4ESX3rb6aUZkaJnQ5Ok09Y8xrE6aYvm6FaRnrNow&notes_info=&filter=";

    mp.addFeed({
        id: "tumblr-icr",
        description: "I Can Read",
        url: apiUrl.split("##blog##").join("icanread.tumblr.com") + "&jsonp=",
        index: 110
    });

    mp.setOptions({bigPreview: true});

    mp.init({
        appendLimitOffset: function (myurl, count, offset) {
            if (count) {
                myurl += "&count=" + count;
            }

            if (offset) {
                myurl += "&offset=" + count * offset;
            }

            return myurl;
        },
        determineSuccessfulResponse: function (j) {
            return j && j.meta && j.response ? j.response : {};
        },
        getDataArray: function (j) {
            return j.posts;
        },
        getTitle: function (j) {
            return j && j.blog && j.blog.title ? j.blog.title.replace(/&gt;/g, '>') : 'Tumblr';
        },
        elementPreview: function ($node, entry) {
            var thumbUrl = "",
                thumbWidth = 0,
                thumbHeight = 0,
                big = mp.getOption('bigPreview');

            if (entry.title) {
                // TODO xss
                $node.append($("<div>").addClass("mediaplugin-title mediaplugin-textbackground").html(entry.title));
            } else if (entry.photos && entry.photos[0] && entry.photos[0].alt_sizes) {
                var sizes = entry.photos[0].alt_sizes;

                _(sizes).each(function (j) {
                    if (big) {
                        if (j.width > 250 || thumbWidth === 0) {
                            thumbUrl = j.url;
                            thumbWidth = j.width;
                            thumbHeight = j.height;
                        }
                    } else {
                        if (j.width < thumbWidth || thumbWidth === 0) {
                            thumbUrl = j.url;
                            thumbWidth = j.width;
                            thumbHeight = j.height;
                        }
                    }
                });

                if (thumbUrl === "") {
                    $node.append($("<div>").addClass("mediaplugin-title mediaplugin-textbackground").html(gt("No title.")));
                }
            } else {
                $node.append($("<div>").addClass("mediaplugin-title mediaplugin-textbackground").html(gt("No title.")));
            }

            $node.append($("<div>").addClass("mediaplugin-content mediaplugin-textbackground").html(entry.timestamp ? mailUtil.getDateTime(entry.timestamp * 1000) : ""));

            if (thumbUrl !== "") {
                var $img = $('<img/>', {'data-original': thumbUrl, height: thumbHeight, width: thumbWidth});
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

            if (entry.description) {
                // TODO xss
                var $description = $("<div/>").html(entry.description);
                $popup.append($description);
                maxHeight -= $description.height();
            }

            if (entry.body) {
                // TODO xss
                var $body = $("<div/>").html(entry.body);
                $popup.append($body);
                maxHeight -= $body.height();
            }

            if (entry.player) {
                $popup.append($("<div/>").html(entry.player[0].embed_code));
            } else if (entry.photos) {
                willDisableBusyIndicator = true;

                _(entry.photos).each(function (p) {
                    var photo = p.original_size;
                    var $img = $("<img/>", {'src': photo.url, height: photo.height, width: photo.width}).css({display: 'none'})
                        .load(function () {
                            if ($busyIndicator) {
                                $busyIndicator.detach();
                                $(this).fadeIn();
                            }
                        });

                    mp.resizeImage($img, maxWidth, maxHeight);
                    $popup.append($img);
                });
            } else {
                $popup.append($("<a/>", {href: entry.post_url, target: "_blank"}).text(entry.post_url)
                        .on("click", function (e) {
                            e.stopPropagation();
                        }));
            }

            if (entry.caption) {
                // TODO xss
                $popup.append(entry.caption);
            }

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
