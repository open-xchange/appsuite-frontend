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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Markus Bode <markus.bode@open-xchange.com>
 */

define('plugins/portal/flickr/register', [
    'io.ox/core/extensions',
    'io.ox/portal/feed',
    'io.ox/core/tk/dialogs',
    'settings!io.ox/portal',
    'gettext!plugins/portal'
], function (ext, Feed, dialogs, settings, gt) {

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
        // prevent loading on refresh when error occurs to not bloat logs (see Bug 41740)
        stopLoadingOnError: true,

        initialize: function (baton) {

            function initFeed() {

                var props = baton.model.get('props'), url;

                if (props.method) {
                    url = String((apiUrl[props.method] || '')) + encodeURIComponent(props.query) + '&jsoncallback=';
                    baton.feed = new Feed({ url: url });
                    baton.feed.process = function (data) {
                        return data && data.stat === 'ok' ? data.photos : { error: gt('Could not load data') };
                    };
                }
            }

            baton.model.on('change:props', initFeed);
            initFeed();
        },

        load: function (baton) {
            if (baton.feed) {
                return baton.feed.load().done(function (data) {
                    baton.data = data;
                });
            }
            baton.data = [];
            return $.when();
        },

        preview: function (baton) {

            var photo, size = '', url;

            // set title
            this.find('h2 .title').text(baton.model.get('props').query || 'Flickr');

            if (baton.data.error) {
                this.append(
                    $('<div class="content">').text(baton.data.error)
                );
            } else {

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
                        $('<div class="content pointer" tabindex="1" role="button" aria-label="' + gt('Press [enter] to jump to the flicker stream.') + '">')
                        .css('backgroundImage', 'url(' + url + ')')
                        .addClass('decoration')
                    );
                }
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
                    if (photo.title) {
                        this.append(
                            $('<caption>').text(photo.title)
                        );
                    }
                    this.append(
                        img = $('<div class="photo">').css('backgroundImage', 'url(' + url + ')')
                    );
                    if (flickrUrl) {
                        img.wrap(
                            $('<a>', { href: flickrUrl + '/' + photo.owner + '/' + photo.id + '/', target: '_blank' })
                        );
                    }
                }
            }

            return function (baton) {

                var node = $('<div class="portal-feed">'),
                    flickrUrl = '';

                if (baton.model.get('props').method === 'flickr.photos.search') {
                    flickrUrl = 'http://www.flickr.com/photos';
                }

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
        //disable widget till data is set by user
        model.set('candidate', true, { silent: true, validate: true });

        var dialog = new dialogs.ModalDialog({ async: true, width: 400 }),
            $q = $('<input id="flickr_search" type="text" class="form-control">'),
            $description = $('<input id="flickr_desc" type="text" class="form-control">'),
            $method = $('<select id="flickr_option" class="form-control">').append(
                $('<option>').attr('value', 'flickr.photos.search').text(gt('flickr.photos.search')),
                $('<option>').attr('value', 'flickr.people.getPublicPhotos').text(gt('flickr.people.getPublicPhotos'))
            ),
            $error = $('<div>').addClass('alert alert-danger').css('margin-top', '15px').hide(),
            props = model.get('props') || {};

        dialog.header($('<h4>').text(gt('Edit Flickr photo stream')))
            .build(function () {
                this.getContentNode().append(
                    $('<div class="row">').append(
                        $('<div class="col-sm-12">').append(
                            $('<label for="flickr_search">').text(gt('Search')),
                            $q.val(props.query)
                        )
                    ),
                    $('<div class="row">').append(
                        $('<div class="col-sm-12">').append(
                            $('<label for="flickr_option">').text(gt('Type')),
                            $method.val(props.method)
                        )
                    ),
                    $('<div class="row">').append(
                        $('<div class="col-sm-12">').append(
                            $('<label for="flickr_desc">').text(gt('Description')),
                            $description.val(props.description),
                            $error
                        )
                    )
                );
            })
            .addPrimaryButton('save', gt('Save'))
            .addButton('cancel', gt('Cancel'))
            .show(function () {
                $q.focus();
            });

        dialog.on('cancel', function () {
            if (model.has('candidate')) {
                view.removeWidget();
            }
        });

        dialog.on('save', function () {

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
                    model.set({ title: description, props: props }, { validate: true });
                    model.unset('candidate');
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
