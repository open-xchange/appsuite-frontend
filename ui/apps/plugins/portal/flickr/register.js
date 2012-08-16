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
     'gettext!io.ox/portal/mediaplugin'], function (MediaPlayer, mailUtil, gt) {

    'use strict';
    var mp = new MediaPlayer();

    // order of elements is the crucial factor of presenting the image in the sidepopups
    var imagesizes = ['url_l', 'url_c', 'url_z', 'url_o', 'url_n', 'url_m', 'url_q', 'url_s', 'url_sq', 'url_t'];
    var apiUrl = "http://www.flickr.com/services/rest/?api_key=7fcde3ae5ad6ecf2dfc1d3128f4ead81&format=json&extras=last_update," + imagesizes.join(',');

    mp.addFeed({
        id: "flickr-id1",
        description: "Flickr OX",
        url: apiUrl + "&method=flickr.photos.search&text=open-xchange&jsoncallback=",
        index: 100
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
                // TODO xss
                var $title = $("<div>").addClass("mediaplugin-title").html(entry.title);
                $node.append($title);
            }
            $node.append($("<div>").addClass("mediaplugin-content").html(entry.lastupdate ? mailUtil.getDateTime(entry.lastupdate * 1000) : ""));

            if (big) {
                if (entry.url_m && entry.width_m && entry.height_m) {
                    var $img = $('<img/>', {'data-original': entry.url_m, width: entry.width_m, height: entry.height_m});
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
                        var $img = $('<img/>', {src: entry[urlName], width: entry[widthName], height: entry[heightName]}).css({display: 'none'})
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
                // TODO xss
                $popup.append($("<div>").addClass("flickr-title").html(entry.title));
            }
        },
        getImagesFromEntry: function (entry, imageCollection) {
            if (entry.url_l) {
                imageCollection.push(entry.url_l);
            }
        }
    });
});
