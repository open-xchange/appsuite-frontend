/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('plugins/portal/flickr/register', [
    'io.ox/core/extensions',
    'io.ox/portal/feed',
    'io.ox/backbone/views/modal',
    'settings!io.ox/portal',
    'gettext!plugins/portal'
], function (ext, Feed, ModalDialog, settings, gt) {

    'use strict';

    var API_KEY = settings.get('apiKeys/flickr'),
        // order of elements is the crucial factor of presenting the image in the sidepopups
        imagesizes = ['url_l', 'url_c', 'url_z', 'url_o', 'url_n', 'url_m', 'url_q', 'url_s', 'url_sq', 'url_t'],
        sizes = 'l m n o q s sq t z'.split(' '),
        baseUrl = 'https://www.flickr.com/services/rest/?api_key=' + API_KEY + '&format=json&extras=date_upload,' + imagesizes.join(',');

    // No API key, no extension;
    if (_.isUndefined(API_KEY)) return;

    ext.point('io.ox/portal/widget/flickr').extend({

        title: 'Flickr',
        // prevent loading on refresh when error occurs to not bloat logs (see Bug 41740)
        stopLoadingOnError: true,

        initialize: function (baton) {

            function initFeed() {

                var props = baton.model.get('props'), method = props.method, url;
                if (!method) return;

                if (method === 'flickr.photos.search') {
                    url = baseUrl + '&method=flickr.photos.search&text=' + encodeURIComponent(props.query);
                } else {
                    url = baseUrl + '&method=flickr.people.getPublicPhotos&user_id=' + encodeURIComponent(props.nsid);
                }

                baton.feed = new Feed({ url: url += '&jsoncallback=' });
                baton.feed.process = function (data) {
                    return data && data.stat === 'ok' ? data.photos : { error: gt('Could not load data') };
                };
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
                        $('<div class="content pointer" tabindex="0" role="button" class="decoration">').attr('aria-label', gt('Press [enter] to jump to the flicker stream.'))
                        .css('backgroundImage', 'url(' + url + ')')
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
                if (!size) return;
                if (photo.title) this.append($('<caption>').text(photo.title));
                this.append(img = $('<div class="photo">').css('backgroundImage', 'url(' + url + ')'));
                if (!flickrUrl) return;
                img.wrap($('<a target="_blank" rel="noopener">').attr('href', flickrUrl + '/' + photo.owner + '/' + photo.id + '/'));
            }

            return function (baton) {

                var node = $('<div class="portal-feed">'),
                    flickrUrl = baton.model.get('props').method === 'flickr.photos.search' ? 'http://www.flickr.com/photos' : '';

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

        var $q = $('<input id="flickr_search" type="text" class="form-control" tabindex="0">'),
            $description = $('<input id="flickr_desc" type="text" class="form-control" tabindex="0">'),
            $method = $('<select id="flickr_option" class="form-control" tabindex="0">').append(
                $('<option>').attr('value', 'flickr.photos.search').text(gt('Search photos')),
                $('<option>').attr('value', 'flickr.people.getPublicPhotos').text(gt('Public photos by user'))
            ),
            $error = $('<div>').addClass('alert alert-danger').css('margin-top', '15px').hide(),
            props = model.get('props') || {},
            isNew = _.isUndefined(props.query),
            //#. 'Create Flickr photo stream' and 'Edit Flickr photo stream' as headers of a modal dialog to create or edit a Flickr photo stream.
            dialog = new ModalDialog({ title: isNew ? gt('Create Flickr photo stream') : gt('Edit Flickr photo stream'), async: true, width: 400 });

        dialog.build(function () {
            this.$body.append(
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
        .addCancelButton()
        //#. 'Create' or 'Edit' as button text to confirm to create or edit a Flickr photo stream.
        .addButton({ label: isNew ? gt('Create') : gt('Save'), action: 'save' })
        .on('cancel', function () {
            // if it's a new widget delete it, otherwise not
            if (model.has('candidate') && _.isEmpty(model.get('props'))) view.removeWidget();
        })
        .open();

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
