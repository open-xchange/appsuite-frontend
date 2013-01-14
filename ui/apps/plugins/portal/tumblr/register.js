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

define('plugins/portal/tumblr/register',
    ['io.ox/core/extensions',
     'io.ox/portal/feed',
     'gettext!io.ox/portal',
     'io.ox/core/tk/dialogs',
     'settings!io.ox/portal'
    ], function (ext, Feed, gt, dialogs, settings) {

    'use strict';

    var API_KEY = settings.get("apiKeys/tumblr"),
        apiUrl = ['https://api.tumblr.com/v2/blog/', '/posts/?api_key=' + API_KEY + '&notes_info=&filter='];

    if (_.isUndefined(API_KEY)) {
        // No API key, no extension;
        return;
    }

    ext.point('io.ox/portal/widget/tumblr').extend({

        title: 'Tumblr',

        action: function (baton) {
            window.open('http://' + baton.model.get('props').url, 'tumblr');
        },

        initialize: function (baton) {
            var url = baton.model.get('props').url;
            baton.feed = new Feed({
                url: apiUrl.join(url) + "&jsonp="
            });
        },

        load: function (baton) {
            return baton.feed.load().done(function (data) {
                baton.data = data.response;
            });
        },

        preview: function (baton) {

            var data = baton.data,
                title = data.blog ? data.blog.name : '',
                sizes, url = '', width = 0,
                post = _(data.posts).first();

            if (title) {
                this.find('h2').text(title);
            }

            if (post) {
                // has photos?
                if (_.isArray(post.photos) && post.photos.length && (sizes = post.photos[0].alt_sizes)) {
                    // add photo
                    // find proper size
                    _(sizes).each(function (photo) {
                        if (width === 0 || (photo.width > 250 && photo.width < 1000)) {
                            url = photo.url;
                            width = photo.width;
                        }
                    });
                    this.addClass('photo-stream').append(
                        $('<div class="content pointer">').css('backgroundImage', 'url(' + url + ')')
                    );

                } else {
                    // use text
                    var body = [];
                    // remove external links (breaks https)
                    post.body = post.body.replace(/src=/g, 'nosrc=');
                    $('<div>').html(post.body).contents().each(function () {
                        var text = _.escape($.trim($(this).text()));
                        if (text !== '') { body.push(text); }
                    });
                    this.append(
                        $('<div class="content pointer">').html(body.join(' <span class="accent">&bull;</span> '))
                    );
                }
            }
        },

        draw: (function () {

            function drawPost(post) {

                var sizes, url = '', width = 0, img;

                if (_.isArray(post.photos) && post.photos.length && (sizes = post.photos[0].alt_sizes)) {
                    // add photo
                    // find proper size
                    _(sizes).each(function (photo) {
                        if (width === 0 || (photo.width > 500 && photo.width < 1200)) {
                            url = photo.url;
                            width = photo.width;
                        }
                    });
                    this.append(img = $('<div class="photo">').css('backgroundImage', 'url(' + url + ')'));
                    if (post.post_url || post.link_url) {
                        img.wrap($('<a>', { href: post.post_url || post.link_url, target: '_blank' }));
                    }

                } else {
                    // use text
                    if (post.title) {
                        this.append(
                            $('<h2>').text(post.title)
                        );
                    }
                    if (post.post_url) {
                        this.append(
                            $('<div class="post-url">').append(
                                $('<a>', { href: post.post_url, target: '_blank' }).text(gt('Read article on tumblr.com'))
                            )
                        );
                    }
                    var body = [];
                    $('<div>').html(post.body).contents().each(function () {
                        var text = _.escape($.trim($(this).text()));
                        if (text !== '') { body.push(text); }
                    });
                    this.append(
                        $('<div class="text">').html(body.join('<span class="text-delimiter">&bull;</span>'))
                    );
                }
            }

            return function (baton) {

                var data = baton.data,
                    title = data.blog ? data.blog.name : '',
                    node = $('<div class="portal-feed">');

                if (title) {
                    node.append($('<h1>').text(title));
                }

                _(baton.data.posts).each(drawPost, node);
                this.append(node);
            };

        }())
    });

    function edit(model, view) {

        var dialog = new dialogs.ModalDialog({ easyOut: true, async: true, width: 400 }),
            $url = $('<input type="text" class="input-block-level" placeholder=".tumblr.com">').placeholder(),
            $description = $('<input type="text" class="input-block-level">'),
            $error = $('<div>').addClass('alert alert-error').hide(),
            props = model.get('props') || {},
            that = this;

        dialog.header($("<h4>").text(gt('Edit Tumblr feed')))
            .build(function () {
                this.getContentNode().append(
                    $('<label>').text(gt('Feed URL')),
                    $url.val(props.url),
                    $('<label>').text(gt('Description')),
                    $description.val(props.description),
                    $error
                );
            })
            .addPrimaryButton('save', gt('Save'))
            .addButton('cancel', gt('Cancel'))
            .show(function () {
                $url.focus();
            });

        dialog.on('cancel', function () {
            if (model.candidate) {
                view.removeWidget();
            }
        });

        dialog.on('save', function (e) {

            $error.hide();

            var url = $.trim($url.val()),
                description = $.trim($description.val()),
                deferred = $.Deferred();

            // No dot and url does not end with tumblr.com? Append it!
            if (url.indexOf('.') === -1 && !url.match(/\.tumblr\.com$/)) {
                url = url + '.tumblr.com';
            }
            if (url.match(/http:\/\//)) {
                url = url.substring('http://'.length);
            }
            if (url.length === 0) {
                $error.text(gt('Please enter an blog url.'));
                deferred.reject();
            } else if (description.length === 0) {
                $error.text(gt('Please enter a description.'));
                deferred.reject();
            } else {
                $.ajax({
                    url: 'https://api.tumblr.com/v2/blog/' + url + '/posts/?api_key=' + API_KEY + '&notes_info=&filter=&jsonp=testcallback',
                    type: 'HEAD',
                    dataType: 'jsonp',
                    jsonp: false,
                    jsonpCallback: 'testcallback',
                    success: function (data) {
                        if (data.meta && data.meta.status && data.meta.status === 200) {
                            deferred.resolve();
                        } else {
                            $error.text(gt('Unknown error while checking tumblr-blog.'));
                            deferred.reject();
                        }
                    },
                    error: function () {
                        $error.text(gt('Unknown error while checking tumblr-blog.'));
                        deferred.reject();
                    }
                });
            }

            deferred.done(function () {
                dialog.close();
                model.candidate = false;
                model.set({
                    title: description,
                    props: { url: url, description: description }
                });
            });

            deferred.fail(function () {
                $error.show();
                dialog.idle();
            });

            return deferred;
        });
    }

    ext.point('io.ox/portal/widget/tumblr/settings').extend({
        title: gt('Tumblr'),
        type: 'tumblr',
        editable: true,
        edit: edit
    });
});
