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

define('plugins/portal/flickr/register',
    ['io.ox/core/extensions',
     'io.ox/portal/feed',
     'io.ox/core/tk/dialogs',
     'settings!io.ox/portal',
     'gettext!plugins/portal'], function (ext, Feed, dialogs, settings, gt) {

    'use strict';

    var API_KEY = settings.get('apiKeys/flickr'),
        // order of elements is the crucial factor of presenting the image in the sidepopups
        imagesizes = ['url_l', 'url_c', 'url_z', 'url_o', 'url_n', 'url_m', 'url_q', 'url_s', 'url_sq', 'url_t'],
        sizes = 'l m n o q s sq t z'.split(' '),
        baseUrl = 'https://www.flickr.com/services/rest/?api_key=' + API_KEY + '&format=json&extras=date_upload,' + imagesizes.join(','),
        apiUrl = {
            'flickr.photos.search': baseUrl + '&method=flickr.photos.search&text=',
            'flickr.people.getPublicPhotos': baseUrl + '&method=flickr.people.getPublicPhotos&user_id='
        };

    if (_.isUndefined(API_KEY)) {
        // No API key, no extension;
        return;
    }

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
            this.find('h2').text(baton.model.get('props').query || 'Flickr');

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
                    $('<div class="content pointer">')
                    .css('backgroundImage', 'url(' + url + ')')
                    .addClass('decoration')
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

    function getFlickrNsid(username, $error) {

        var callback = 'getFlickerNsid',
            myurl = 'https://www.flickr.com/services/rest/?api_key=' + API_KEY +
                '&format=json&method=flickr.people.findByUsername&username=' + username + '&jsoncallback=' + callback,
            deferred = $.Deferred();

        $.ajax({
            url: myurl,
            dataType: 'jsonp',
            jsonp: false,
            jsonpCallback: callback,
            success: function (data) {
                if (data && data.stat && data.stat === 'ok') {
                    deferred.resolve(data.user.nsid);
                } else {
                    deferred.reject();
                    $error.text(gt('Cannot find user with given name.'));
                }
            },
            error: function () {
                deferred.reject();
                $error.text(gt('Cannot find user with given name.'));
            }
        });

        return deferred;
    }

    function edit(model, view) {

        var dialog = new dialogs.ModalDialog({ easyOut: true, async: true, width: 400 }),
            $q = $('<input type="text" class="input-block-level">'),
            $description = $('<input type="text" class="input-block-level">'),
            $method = $('<select class="input-block-level">').append(
                $('<option>').attr('value', 'flickr.photos.search').text(gt('flickr.photos.search')),
                $('<option>').attr('value', 'flickr.people.getPublicPhotos').text(gt('flickr.people.getPublicPhotos'))
            ),
            $error = $('<div>').addClass('alert alert-error').hide(),
            that = this,
            props = model.get('props') || {};

        dialog.header($("<h4>").text(gt('Edit Flickr photo stream')))
            .build(function () {
                this.getContentNode().append(
                    $('<label>').text(gt('Search')),
                    $q.val(props.query),
                    $('<br>'),
                    $method.val(props.method),
                    $('<label>').text(gt('Description')),
                    $description.val(props.description),
                    $error
                );
            })
            .addPrimaryButton('save', gt('Save'))
            .addButton('cancel', gt('Cancel'))
            .show(function () {
                $q.focus();
            });

        dialog.on('cancel', function () {
            if (model.candidate) {
                view.removeWidget();
            }
        });

        dialog.on('save', function (e) {

            $error.hide();

            var q = String($.trim($q.val())),
                method = $.trim($method.val()),
                description = $.trim($description.val()),
                deferred;

            if (method === 'flickr.people.getPublicPhotos') {
                deferred = getFlickrNsid(q, $error);
            } else {
                deferred = $.Deferred().resolve();
            }

            deferred.done(function (nsid) {
                if (q.length === 0) {
                    $error.text(gt('Please enter a search query'));
                    $error.show();
                    dialog.idle();
                } else if (description.length === 0) {
                    $error.text(gt('Please enter a description'));
                    $error.show();
                    dialog.idle();
                } else {
                    props = { method: method, query: q, description: description };
                    if (nsid) { props.nsid = nsid; }
                    model.candidate = false;
                    model.set({ title: description, props: props });
                    dialog.close();
                }
            });

            deferred.fail(function () {
                $error.show();
                dialog.idle();
            });

            return deferred;
        });
    }

    ext.point('io.ox/portal/widget/flickr/settings').extend({
        title: gt('Flickr'),
        type: 'flickr',
        editable: true,
        edit: edit
    });
});
