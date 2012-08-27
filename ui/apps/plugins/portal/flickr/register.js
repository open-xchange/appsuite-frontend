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

define('plugins/portal/flickr/register',
    ['io.ox/portal/mediaplugin',
     'io.ox/mail/util',
     'settings!plugins/portal/flickr',
     'io.ox/core/date',
     'gettext!io.ox/portal/mediaplugin'], function (MediaPlayer, mailUtil, settings, date, gt) {

    'use strict';
    var reload = function () {
        var mp = new MediaPlayer();

        // order of elements is the crucial factor of presenting the image in the sidepopups
        var imagesizes = ['url_l', 'url_c', 'url_z', 'url_o', 'url_n', 'url_m', 'url_q', 'url_s', 'url_sq', 'url_t'];

        var baseUrl = 'https://www.flickr.com/services/rest/?api_key=7fcde3ae5ad6ecf2dfc1d3128f4ead81&format=json&extras=date_upload,' + imagesizes.join(',');

        var apiUrl = {
                'flickr.photos.search': baseUrl + '&method=flickr.photos.search&text=',
                'flickr.people.getPublicPhotos': baseUrl + '&method=flickr.people.getPublicPhotos&user_id='
            };

        var streams = settings.get('streams');

        _.each(streams, function (v) {
            // TODO index
            if (apiUrl[v.method]) {
                var myurl;

                if (v.method === 'flickr.people.getPublicPhotos') {
                    myurl = apiUrl[v.method] + v.nsid + '&jsoncallback=';
                } else {
                    myurl = apiUrl[v.method] + v.q + '&jsoncallback=';
                }

                mp.addFeed({
                    id: 'flickr-' + v.q.replace(/[^a-z0-9]/g, '_') + '-' + v.method.replace(/[^a-z0-9]/g, '_'),
                    description: v.description,
                    url: myurl,
                    index: 100
                });
            }
        });

        mp.setOptions({bigPreview: true});

        mp.init({
            appendLimitOffset: function (myurl, count, offset) {
                if (count) {
                    myurl += "&per_page=" + count;
                }

                if (offset) {
                    myurl += "&page=" + (offset + 1);
                }

                return myurl;
            },
            determineSuccessfulResponse: function (j) {
                return j && j.stat && j.stat === "ok" ? j.photos : {};
            },
            getDataArray: function (j) {
                return j.photo;
            },
            elementPreview: function ($node, entry) {
                var big = mp.getOption('bigPreview');

                if (entry.title) {
                    var $title = $("<div>").addClass("mediaplugin-title").text(entry.title);
                    $node.append($title);
                }
                $node.append($("<div>").addClass("mediaplugin-content").text(entry.dateupload ? new date.Local(entry.dateupload * 1000).format(date.DATE_TIME) : ""));

                if (big) {
                    var foundImage = _.find(imagesizes, function (value) {
                        if (entry[value]) {
                            return true;
                        }
                        return false;
                    });

                    if (foundImage) {
                        var urlName = foundImage.replace(/^http:\/\//i, 'https://');
                        var widthName = 'width' + urlName.replace(/url/, ''),
                            heightName = 'height' + urlName.replace(/url/, '');

                        var $img = $('<img/>', {'data-original': entry[urlName], width: entry[widthName], height: entry[heightName]});
                        return $img;
                    }
                } else {
                    if (entry.url_sq && entry.width_sq && entry.height_sq) {
                        var $img = $('<img/>', {src: entry.url_sq, width: entry.width_sq, height: entry.height_sq});
                        return $img;
                    }
                }

                return false;
            },
            popupContent: function ($popup, entry, $busyIndicator) {
                var maxWidth = $popup.width();
                var maxHeight = $popup.height();

                var foundImage = _.find(imagesizes, function (value) {
                        var urlName = value;
                        var widthName = 'width' + urlName.replace(/url/, ''),
                            heightName = 'height' + urlName.replace(/url/, '');

                        if (entry[urlName] && entry[widthName] && entry[heightName]) {
                            var $img = $('<img/>', {src: entry[urlName].replace(/^http:\/\//i, 'https://'), width: entry[widthName], height: entry[heightName]}).css({display: 'none'})
                                .load(function () {
                                    if ($busyIndicator) {
                                        $busyIndicator.detach();
                                        $(this).fadeIn();
                                    }
                                });

                            mp.resizeImage($img, maxWidth, maxHeight);
                            $popup.append($img);
                            return true;
                        }
                        return false;
                    });

                if (!foundImage) {
                    $popup.append($("<div>").addClass("flickr-content").text(gt('No picture found.')));
                    if ($busyIndicator) {
                        $busyIndicator.detach();
                    }
                }

                if (entry.title) {
                    $popup.append($("<div>").addClass("flickr-title").text(entry.title));
                }
            },
            getImagesFromEntry: function (entry, imageCollection) {
                if (entry.url_l) {
                    imageCollection.push(entry.url_l);
                }
            }
        });
    };

    reload();

    return {
        reload: reload
    };
});