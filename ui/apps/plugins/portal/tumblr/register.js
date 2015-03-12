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

define('plugins/portal/tumblr/register', [
    'io.ox/core/extensions',
    'io.ox/portal/feed',
    'gettext!io.ox/portal',
    'io.ox/core/tk/dialogs',
    'settings!io.ox/portal'
], function (ext, Feed, gt, dialogs, settings) {

    'use strict';

    var API_KEY = settings.get('apiKeys/tumblr'),
        apiUrl = ['https://api.tumblr.com/v2/blog/', '/posts/?api_key=' + API_KEY + '&notes_info=&filter='];

    if (_.isUndefined(API_KEY)) {
        // No API key, no extension;
        return;
    }

    ext.point('io.ox/portal/widget/tumblr').extend({

        title: 'Tumblr',

        initialize: function (baton) {

            function initFeed() {
                var url = baton.model.get('props').url;
                baton.feed = new Feed({
                    url: String(apiUrl.join(url) + '&jsonp=')
                });
            }

            baton.model.on('change:props', initFeed);
            initFeed();
        },

        load: function (baton) {
            if (baton.feed) {
                return baton.feed.load().done(function (data) {
                    baton.data = data.response;
                });
            } else {
                return $.when();
            }
        },

        summary: function () {
            var self = this;
            this.addClass('with-summary show-summary');
            // this.on('tap', '.pointer', function () { console.log('treffer click'); });
            this.on('click', 'h2', function () {
                self.toggleClass('show-summary');
            });
        },

        preview: function (baton) {

            var data = baton.data,
                title = data.blog ? data.blog.name : '',
                sizes, url = '', width = 0,
                firstPosts = _.first(data.posts, 8),
                firstPost = _(firstPosts).first();

            if (title) {
                this.find('h2 span.title').text(_.noI18n(title));
            }

            if (firstPost && _.isArray(firstPost.photos) && firstPost.photos.length && (sizes = firstPost.photos[0].alt_sizes)) {
                // add photo
                // find proper size
                _(sizes).each(function (photo) {
                    if (width === 0 || (photo.width > 250 && photo.width < 1000)) {
                        url = photo.url;
                        width = photo.width;
                    }
                });
                this.addClass('photo-stream').append(
                    $('<div class="content pointer decoration list-unstyled">').css('backgroundImage', 'url(' + url + ')').attr({
                        'tabindex': '1',
                        'role': 'button',
                        'aria-label': gt('Press [enter] to jump to the tumblr feed.')
                    })
                );

            } else {
                var titles = [];
                _(firstPosts).each(function (post) {
                    if (post.title) {
                        titles.push(
                            $('<li class="paragraph">').append(
                                $('<span class="bold">').html(_.noI18n(post.title)), $.txt('')
                            )
                        );
                    }
                });

                if (titles.length > 0) {
                    this.append(
                        $('<ul class="content pointer">').attr({
                            'tabindex': '1',
                            'role': 'button',
                            'aria-label': gt('Press [enter] to jump to the tumblr feed.')
                        }).append(titles)
                    );
                }
            }

        },

        draw: (function () {

            function drawPost(post) {
                var sizes, url = '', width = 0,
                    node = $('<div class="post">').attr('data-post-type', post.type);

                var postTitle = function () {
                    var title = $('<h2>').text(_.noI18n(post.title));
                    if (post.url || post.post_url) {
                        return $('<a>', { href: post.url || post.post_url, target: '_blank' }).append(title);
                    } else {
                        return title;
                    }
                },

                postDate = function () {
                    return $('<span class="post-date">').text(' ' + moment.unix(post.timestamp).format('lll'));
                },
                postTags = function () {
                    var tags = [],
                        tagBaseUri = 'http://' + post.blog_name + '.tumblr.com/tagged/';
                    if (post.tags && post.tags.length > 0) {
                        _(post.tags).each(function (tag) {
                            tags.push($('<a>', { href: tagBaseUri + tag, target: '_blank' })
                                .addClass('tag').text(tag).prepend($('<i class="fa fa-tag">')));
                        });
                    }
                    return tags;
                },
                postPhotos = function () {
                    var img;
                    if (_.isArray(post.photos) && post.photos.length && (sizes = post.photos[0].alt_sizes)) {
                        _(sizes).each(function (photo) {
                            if (width === 0 || (photo.width > 500 && photo.width < 1200)) {
                                url = photo.url;
                                width = photo.width;
                            }
                        });
                        img = $('<img>').attr({ 'src': url }).css({
                            'width': '100%',
                            'max-width': width,
                            'margin-bottom': '13px'
                        });
                        if (post.post_url || post.link_url) {
                            return $('<a>', { href: post.post_url || post.link_url, target: '_blank' }).append(img);
                        } else {
                            return img;
                        }
                    }
                },
                postBody = function () {
                    var strippedHtml = post.body
                        .replace(/<(?!img\s*\/?)[^>]+>/g, '\n')
                        .replace(/<img.+?src=[\'"]([^\'"]+)[\'"].*?>/i, '<img src="$1">');
                    if (post.type === 'chat') {
                        strippedHtml = strippedHtml.replace(/\n/g, '<br />');
                    }
                    return $('<div class="post-body">').html(strippedHtml);
                },
                postQuote = function () {
                    return $('<blockquote>').append(_.escape($.trim(post.text)))
                        .append($('<em>').text(_.escape($.trim(post.source))));
                },
                postLink = function () {
                    return $('<a>', { href: post.post_url, target: '_blank', title: gt('Read article on tumblr.com') }).append($('<i class="icon-tumblr-sign">'));
                },
                postExternalLink = function () {
                    return $('<a>', { href: post.url, target: '_blank', title: gt('Open external link') }).append($('<i class="fa fa-external-link-square">'));
                },
                postNav = function () {
                    var nav = $('<div class="post-bar">');
                    if (post.tags) nav.append(postTags());
                    if (post.timestamp) nav.append(postDate());
                    if (post.url) nav.append(postExternalLink());
                    if (post.post_url) nav.append(postLink());
                    return nav;
                };

                if (post.type === 'photo') {
                    node.append(postPhotos());
                } else {
                    if (post.title) node.append(postTitle());
                    if (post.body) node.append(postBody());
                    if (post.text) node.append(postQuote());

                    node.append(postNav());
                }
                this.append(node);
            }

            return function (baton) {

                var data = baton.data,
                    title = data.blog ? data.blog.name : '',
                    node = $('<div class="portal-feed tumblr">');

                if (title) {
                    node.append($('<h1>').text(_.noI18n(title)));
                }

                _(baton.data.posts).each(drawPost, node);
                this.append(node);
            };

        }())
    });

    function edit(model, view) {
        //disable widget till data is set by user
        model.set('candidate', true, { silent: true, validate: true });

        var dialog = new dialogs.ModalDialog({ async: true, width: 400 }),
            $url = $('<input id="tumblr_url" type="text" class="form-control" placeholder=".tumblr.com">'),
            $description = $('<input id="tumblr_desc" type="text" class="form-control">'),
            $error = $('<div>').addClass('alert alert-danger').css('margin-top', '15px').hide(),
            props = model.get('props') || {};

        dialog.header($('<h4>').text(gt('Edit Tumblr feed')))
            .build(function () {
                this.getContentNode().append(
                    $('<div class="row">').append(
                        $('<div class="col-sm-12">').append(
                            $('<label for="tumblr_url">').text(gt('Feed URL')),
                            $url.val(props.url)
                        )
                    ),
                    $('<div class="row">').append(
                        $('<div class="col-sm-12">').append(
                            $('<label for="tumblr_desc">').text(gt('Description')),
                            $description.val(props.description)
                        )
                    ),
                    $error
                );
            })
            .addPrimaryButton('save', gt('Save'))
            .addButton('cancel', gt('Cancel'))
            .show(function () {
                $url.focus();
            });

        dialog.on('cancel', function () {
            if (model.has('candidate') && _.isEmpty(model.attributes.props)) {
                view.removeWidget();
            }
        });

        dialog.on('save', function () {

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
                model.set({
                    title: description,
                    props: { url: url, description: description }
                }, { validate: true });
                model.unset('candidate');
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
