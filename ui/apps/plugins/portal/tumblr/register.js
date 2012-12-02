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
    ['io.ox/core/extensions',
     'io.ox/portal/mediaplugin',
     'io.ox/mail/util',
     'settings!plugins/portal/tumblr',
     'io.ox/core/date',
     'gettext!io.ox/portal'], function (ext, MediaPlayer, mailUtil, settings, date, gt) {

    'use strict';

    var apiUrl = "https://api.tumblr.com/v2/blog/##blog##/posts/?api_key=gC1vGCCmPq4ESX3rb6aUZkaJnQ5Ok09Y8xrE6aYvm6FaRnrNow&notes_info=&filter=";

    ext.point('io.ox/portal/widget').extend({
        id: 'facebook',
        title: 'Tumblr',

        load: function () {

        },

        preview: function () {

        }
    });

    var drawPlugin = function (index) {
        if (!index) {
            index = 100;
        }

        var mp = new MediaPlayer();
        var blogs = settings.get('blogs');

        _.each(blogs, function (v) {
            mp.addFeed({
                id: 'tumblr-' + v.url.replace(/[^a-z0-9]/g, '_'),
                description: v.description,
                url: apiUrl.split("##blog##").join(v.url) + "&jsonp=",
                index: index++
            });
        });

        mp.setOptions({bigPreview: true});

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
                    title = "",
                    big = mp.getOption('bigPreview');

                if (entry.title) {
                    title = entry.title;
                } else if (entry.body) {
                    title = $('<span>').html(entry.body).text();
                } else if (entry.text) {
                    title = $('<span>').html(entry.text).text();
                } else if (entry.description) {
                    title = $('<span>').html(entry.description).text();
                } else if (entry.caption) {
                    title = $('<span>').html(entry.caption).text();
                } else if (entry.source_title) {
                    title = $('<span>').html(entry.source_title).text();
                }

                if (entry.photos && entry.photos[0] && entry.photos[0].alt_sizes) {
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
                }

                if (!thumbUrl && !title) {
                    $node.append($("<div>").addClass("mediaplugin-title").html(gt("No title.")));
                } else if (title) {
                    $node.append($("<div>").addClass("mediaplugin-title").text(title));
                }

                $node.append($("<div>").addClass("mediaplugin-content").html(entry.timestamp ? new date.Local(entry.timestamp * 1000).format(date.DATE_TIME) : ""));

                if (thumbUrl !== "") {
                    var $img = $('<img/>', {'data-original': thumbUrl, height: thumbHeight, width: thumbWidth});
                    return $img;
                }
                return false;
            },
            popupContent: function ($popup, entry, $busyIndicator) {
                var maxWidth = $popup.width();
                var maxHeight = $popup.height();
                var willDisableBusyIndicator = false;
                var title = "";
                var $node = $('<div>').addClass('io-ox-portal-mediaplugin-portal');

                if (entry.title) {
                    title = entry.title;
                } else if (entry.body) {
                    title = $('<span>').html(entry.body).text();
                } else if (entry.text) {
                    title = $('<span>').html(entry.text).text();
                } else if (entry.description) {
                    title = $('<span>').html(entry.description).text();
                } else if (entry.caption) {
                    title = $('<span>').html(entry.caption).text();
                } else if (entry.source_title) {
                    title = $('<span>').html(entry.source_title).text();
                } else {
                    title = gt('No title.');
                }

                var $title = $("<div>").addClass("mediaplugin-title").text(title).css({width: maxWidth});
                maxHeight -= $title.height();
                $node.append($title);

                if (entry.description) {
                    var $description = $("<div/>").html(mp.escape(entry.description));
                    $node.append($description);
                    maxHeight -= $description.height();
                }

                if (entry.body) {
                    var $body = $("<div/>").html(mp.escape(entry.body));
                    $node.append($body);
                    maxHeight -= $body.height();
                }

                if (entry.player) {
                    $node.append($("<div/>").html(entry.player[0].embed_code));
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
                        $node.append($img);
                    });
                } else {
                    $node.append($("<a/>", {href: entry.post_url, target: "_blank"}).text(entry.post_url)
                            .on("click", function (e) {
                                e.stopPropagation();
                            }));
                }

                if (entry.caption) {
                    $node.append(mp.escape(entry.caption));
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
    };

    return {
        reload: drawPlugin
    };
});
