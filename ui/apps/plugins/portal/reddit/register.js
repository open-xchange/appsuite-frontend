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

    var extractImage = function (entry) {
        var thumbUrl = "",
            big = mp.getOption('bigPreview');

        var directImages = ['whatgifs.com', 'imgur.com', 'i.imgur.com', 'i.minus.com'];

        if (_.include(directImages, entry.domain)) {
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

        // urls ends with ".jpg"? Give it a try
        if (entry.url.match(/\.jpg$|\.png$\.gif$/)) {
            thumbUrl = entry.url;
        }

//        TODO
//        entry.media.oembed.thumbnail_url
//        entry.media.oembed.thumbnail_width
//        entry.media.oembed.thumbnail_height

        if (thumbUrl === '' && entry && entry.media && entry.media.oembed && entry.media.oembed.thumbnail_url) {
            thumbUrl = entry.media.oembed.thumbnail_url;
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
            var thumbUrl = '',
                title = '';

            entry = entry.data;

            if (entry.title) {
                title = entry.title;
            }

            thumbUrl = extractImage(entry);

            if (!thumbUrl && !title) {
                $node.append($("<div>").addClass("mediaplugin-title").html(gt("No title.")));
            } else if (title) {
                $node.append($("<div>").addClass("mediaplugin-title").text(title));
            }

            // TODO timezone
            $node.append($("<div>").addClass("mediaplugin-content mediaplugin-textbackground").html(entry.created_utc ? mailUtil.getDateTime(entry.created_utc * 1000) : ""));

            if (thumbUrl !== "") {
                var $img = $('<img/>', {'data-original': thumbUrl});//, height: thumbHeight, width: thumbWidth});
                return $img;
            }
            return false;
        },
        popupContent: function ($popup, entry, $busyIndicator) {
            var maxWidth = $popup.width(),
                maxHeight = $popup.height(),
                willDisableBusyIndicator = false,
                title = '';
            var $node = $('<div>').addClass('io-ox-portal-mediaplugin-portal');

            entry = entry.data;
//            console.log(entry);


            if (entry.title) {
                title = entry.title;
            } else {
                title = gt('No title.');
            }

            var $title = $("<div>").addClass("mediaplugin-title").text(title).css({width: maxWidth});
            maxHeight -= $title.height();
            $title.appendTo($node);

            var imageUrl = extractImage(entry);

            if (entry.domain === 'youtube.com') {
                $('<div>').html($('<span>').html(entry.media_embed.content).text()).appendTo($node);
            } else  if (imageUrl) {
                willDisableBusyIndicator = true;

                var $img = $("<img/>", {'src': imageUrl}).css({display: 'none'})
                    .load(function () {
                        if ($busyIndicator) {
                            $busyIndicator.detach();
                            $(this).fadeIn();
                        }
                    });

                // TODO what to do if we don't know the width+height?
                mp.resizeImage($img, maxWidth, maxHeight);
                $img.appendTo($node);
            }

            if (entry.url) {
                $('<div>').append($('<a>').attr({'href': entry.url}).text(entry.url)).appendTo($node);
            }

            if (entry.permalink) {
                $('<a>').attr({'href': 'http://www.reddit.com' + entry.permalink}).text(gt('Comments')).appendTo($node);
            }

            if (entry.author) {
                if (entry.permalink) {
                    $('<span>').text(' | ').appendTo($node);
                }
                $('<a>').attr({'href': 'http://www.reddit.com/user/' + entry.author}).text(entry.author).appendTo($node);
            }
            if ($busyIndicator && !willDisableBusyIndicator) {
                $busyIndicator.detach();
            }

            $popup.append($node);
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
