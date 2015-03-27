/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Markus Bode <markus.bode@open-xchange.com>
 */

define('plugins/portal/reddit/register', [
    'gettext!io.ox/portal'
], function (gt) {

    'use strict';

    // avoid JSHINT errors
    var MediaPlayer = function () {}, settings = {};

    var drawPlugin = function (index) {
        if (!index) {
            index = 100;
        }

        var mp = new MediaPlayer();
        var apiUrl = {
                'new': 'http://www.reddit.com/r/##subreddit##/new.json?sort=new',
                'hot': 'http://www.reddit.com/r/##subreddit##/.json?sort='
            };

        var lastShowedPreview = false;

        var subreddits = settings.get('subreddits');

        _.each(subreddits, function (v) {
            if (apiUrl[v.mode]) {
                mp.addFeed({
                    id: 'reddit-' + v.subreddit.replace(/[^a-z0-9]/g, '_') + '-' + v.mode.replace(/[^a-z0-9]/g, '_'),
                    description: v.subreddit,
                    url: apiUrl[v.mode].split('##subreddit##').join(v.subreddit) + '&jsonp=',
                    index: index++
                });
            }
        });

        mp.setOptions({ bigPreview: true });

        var extractImage = function (entry) {
            var thumbUrl = '',
                big = mp.getOption('bigPreview');

            var directImages = ['whatgifs.com', 'imgur.com', 'i.imgur.com', 'i.minus.com'];

            if (_.include(directImages, entry.domain)) {
                if (big) {
                    if (entry.domain === 'imgur.com') {
                        thumbUrl = entry.url.replace(/http:\/\/imgur/g, 'http://i.imgur') + '.jpg';
                    } else {
                        thumbUrl = entry.url;
                    }
                } else if (entry.thumbnail) {
                    thumbUrl = entry.thumbnail;
                }
            }

            // urls ends with ".jpg"? Give it a try
            if (entry.url.match(/\.jpg$|\.png$|\.gif$/)) {
                thumbUrl = entry.url;
            }

            if (thumbUrl === '' && entry && entry.media && entry.media.oembed && entry.media.oembed.thumbnail_url) {
                thumbUrl = entry.media.oembed.thumbnail_url;
            }

            return thumbUrl;
        };

        mp.init({
            appendLimitOffset: function (myurl, count, offset) {
                // &count-param is ignored by reddit
                // if (count) {
                //     myurl += "&count=" + count;
                // }

                if (offset) {
                    myurl += '&after=' + lastShowedPreview;
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
                    $node.append($('<div>').addClass('mediaplugin-title').text(gt('No title.')));
                } else if (title) {
                    $node.append($('<div>').addClass('mediaplugin-title').text(title));
                }

                $node.append($('<div>').addClass('mediaplugin-content mediaplugin-textbackground').text(entry.created_utc ? moment.unix(entry.created_utc).format('l LT') : ''));

                lastShowedPreview = entry.name;

                if (thumbUrl !== '') {
                    var $img = $('<img/>',  { 'data-original': thumbUrl });
                    return $img;
                }

                return false;
            },
            popupContent: function ($popup, entry, $busyIndicator) {
                var maxWidth = $popup.width(),
                    maxHeight = $popup.height(),
                    willDisableBusyIndicator = false,
                    title = '',
                    $img = false;
                var $node = $('<div>').addClass('io-ox-portal-mediaplugin-portal');

                entry = entry.data;

                if (entry.title) {
                    title = entry.title;
                } else {
                    title = gt('No title.');
                }

                var $title = $('<div>').addClass('mediaplugin-title').text(title).css({ width: maxWidth });
                maxHeight -= $title.height();
                $title.appendTo($node);

                var imageUrl = extractImage(entry);

                if (entry.domain === 'youtube.com') {
                    $('<div>').html($('<span>').html(entry.media_embed.content).text()).appendTo($node);
                } else if (imageUrl) {
                    willDisableBusyIndicator = true;

                    $img = $('<img/>',  { 'src': imageUrl }).css({ display: 'none' })
                        .load(function () {
                            if ($busyIndicator) {
                                $busyIndicator.detach();
                                $(this).fadeIn();
                            }
                        });

                    $img.appendTo($node);
                }

                if (entry.url) {
                    var $url = $('<div>').append($('<a>').attr({ 'href': entry.url }).text(entry.url));
                    $url.appendTo($node);
                    maxHeight -= $url.height();
                }

                if (entry.permalink) {
                    $('<a>').attr({ 'href': 'http://www.reddit.com' + entry.permalink }).text(gt('Comments')).appendTo($node);
                }

                if (entry.author) {
                    if (entry.permalink) {
                        $('<span>').text(' | ').appendTo($node);
                    }
                    var $author = $('<a>').attr({ 'href': 'http://www.reddit.com/user/' + entry.author }).text(entry.author);
                    $author.appendTo($node);
                    maxHeight -= $author.height();
                }
                if ($busyIndicator && !willDisableBusyIndicator) {
                    $busyIndicator.detach();
                }

                $popup.append($node);

                if ($img) {
                    mp.resizeImage($img, maxWidth, maxHeight);
                }
            },
            getImagesFromEntry: function (entry, imageCollection) {
                var image = extractImage(entry.data);
                if (image) {
                    imageCollection.push(image);
                }
            }
        });
    };

    return {
        reload: drawPlugin
    };
});
