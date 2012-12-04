/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Markus Bode <markus.bode@open-xchange.com>
 */

define('plugins/portal/flickr/register', ['io.ox/core/extensions', 'io.ox/portal/feed'], function (ext, Feed) {

    'use strict';

    var API_KEY = '7fcde3ae5ad6ecf2dfc1d3128f4ead81',
        // order of elements is the crucial factor of presenting the image in the sidepopups
        imagesizes = ['url_l', 'url_c', 'url_z', 'url_o', 'url_n', 'url_m', 'url_q', 'url_s', 'url_sq', 'url_t'],
        sizes = 'l m n o q s sq t z'.split(' '),
        baseUrl = 'https://www.flickr.com/services/rest/?api_key=' + API_KEY + '&format=json&extras=date_upload,' + imagesizes.join(','),
        apiUrl = {
            'flickr.photos.search': baseUrl + '&method=flickr.photos.search&text=',
            'flickr.people.getPublicPhotos': baseUrl + '&method=flickr.people.getPublicPhotos&user_id='
        };

    ext.point('io.ox/portal/widget/flickr').extend({

        title: 'Flickr',

        action: function (baton) {
            window.open('http://www.flickr.com/', 'flickr');
        },

        initialize: function (baton) {

            var props = baton.model.get('props');

            baton.feed = new Feed({
                url: apiUrl[props.method] + props.query + '&jsoncallback='
            });

            baton.feed.process = function (data) {
                return data && data.stat === "ok" ? data.photos : {};
            };
        },

        load: function (baton) {
            return baton.feed.load().done(function (data) {
                baton.data = data;
            });
        },

        preview: function (baton) {

            var photo, size = '', url;

            // set title
            this.find('h2').text(baton.model.get('props').query || 'Flickr');

            // get a photo
            if (_.isArray((photo = baton.data.photo)) && photo.length > 0) {
                // try to pick a random photo
                photo = photo[Math.min(photo.length - 1, Math.random() * 10 >> 0)];
            }

            if (photo) {
                // find proper image size
                _(sizes).each(function (s) {
                    if (size === '' || (photo['width_' + s] > 250 && photo['width_' + s] < 1000)) {
                        if (photo['url_' + s]) {
                            size = s;
                            url = photo['url_' + s];
                        }
                    }
                });
                // use size
                this.addClass('photo-stream').append(
                    $('<div class="content pointer">').css('backgroundImage', 'url(' + url + ')')
                );
            }
        },

        draw: (function () {

            function drawPhoto(photo, flickrUrl) {

                var size = '', url, img;

                // find proper image size
                _(sizes).each(function (s) {
                    if (size === '' || (photo['width_' + s] >= 500 && photo['width_' + s] < 1200)) {
                        if (photo['url_' + s]) {
                            size = s;
                            url = photo['url_' + s];
                        }
                    }
                });
                // use size
                if (size) {
                    this.append(
                        img = $('<div class="photo">').css('backgroundImage', 'url(' + url + ')')
                    );
                    if (flickrUrl) {
                        img.wrap(
                            $('<a>', { href: flickrUrl + photo.id, target: '_blank' })
                        );
                    }
                    if (photo.title) {
                        this.append(
                            $('<caption>').text(photo.title)
                        );
                    }
                }
            }

            return function (baton) {

                var data = baton.data,
                    node = $('<div class="portal-feed">'),
                    flickrUrl = '';

                if (baton.model.get('props').method === 'flickr.photos.search') {
                    flickrUrl = 'http://www.flickr.com/photos/' + baton.model.get('props').query + '/';
                }

                console.log('FLICKR.data', data, flickrUrl);

                node.append($('<h1>').text(baton.model.get('props').query));

                _(baton.data.photo).each(function (photo) {
                    drawPhoto.call(node, photo, flickrUrl);
                });

                this.append(node);
            };

        }())
    });

/*
    var drawPlugin = function (index) {
        if (!index) {
            index = 100;
        }

        var mp = new MediaPlayer();


        var streams = settings.get('streams');

        _.each(streams, function (v) {
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
                    index: index++
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

    return {
        reload: drawPlugin
    };
*/
});
