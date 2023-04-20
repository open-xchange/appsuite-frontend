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

define('plugins/portal/tumblr/register', [
    'io.ox/core/extensions',
    'io.ox/portal/feed',
    'gettext!io.ox/portal',
    'io.ox/backbone/views/modal',
    'settings!io.ox/portal',
    'static/3rd.party/purify.min.js'
], function (ext, Feed, gt, ModalDialog, settings, DOMPurify) {

    'use strict';

    // sanitize, see OXUIB-2285
    function sanitizeKey(key) {
        return _.sanitize.option(key) === key ? key : undefined;
    }

    var API_KEY = sanitizeKey(settings.get('apiKeys/tumblr')),
        apiUrl = ['https://api.tumblr.com/v2/blog/', '/posts/?api_key=' + API_KEY + '&notes_info=&filter='];

    if (_.isUndefined(API_KEY)) {
        // No API key, no extension;
        return;
    }

    if (ox.debug) console.warn('Tumblr portal plugin is DEPRECATED with 7.10.3 and will be removed with 7.10.4 or at any random date later');

    ext.point('io.ox/portal/widget/tumblr').extend({

        title: 'Tumblr',
        // prevent loading on refresh when error occurs to not bloat logs (see Bug 41740)
        stopLoadingOnError: true,

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
            }
            return $.when();
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
                this.find('h2 span.title').text(title);
            }

            if (firstPost && _.isArray(firstPost.photos) && firstPost.photos.length && (sizes = firstPost.photos[0].alt_sizes)) {
                // add photo
                // find proper size
                _(sizes).each(function (photo) {
                    if (width === 0 || (photo.width > 250 && photo.width < 1000)) {
                        url = photo.url.replace(/https?:\/\//, '//');
                        width = photo.width;
                    }
                });
                this.addClass('photo-stream').append(
                    $('<div class="content pointer" tabindex="0" role="button">').css('backgroundImage', 'url(' + url + ')').attr({
                        'aria-label': gt('Press [enter] to jump to the tumblr feed.')
                    })
                );

            } else {
                var titles = [];
                _(firstPosts).each(function (post) {
                    if (post.title) {
                        titles.push(
                            $('<li class="paragraph">').append(
                                $('<span class="bold">').text(post.title), $.txt('')
                            )
                        );
                    }
                });

                if (titles.length > 0) {
                    this.append(
                        $('<ul class="content pointer" tabindex="0" role="button">').attr({
                            'aria-label': gt('Press [enter] to jump to the tumblr feed.')
                        }).append(titles)
                    );
                }
            }

        },

        draw: (function () {

            function drawPost(post) {
                var sizes, url = '', width = 0,
                    node = $('<div class="post">').attr('data-post-type', post.type),
                    postTitle = function () {
                        var title = $('<h2>').text(post.title);
                        if (post.url || post.post_url) {
                            return $('<a target="_blank" rel="noopener">', { href: post.url || post.post_url }).append(title);
                        }
                        return title;
                    },

                    postDate = function () {
                        return $('<span class="post-date">').text(' ' + moment.unix(post.timestamp).format('lll'));
                    },
                    postTags = function () {
                        var tags = [],
                            tagBaseUri = '//' + post.blog_name + '.tumblr.com/tagged/';
                        if (post.tags && post.tags.length > 0) {
                            _(post.tags).each(function (tag) {
                                tags.push($('<a target="_blank" rel="noopener">').attr('href', tagBaseUri + tag)
                                    .addClass('tag').text(tag).prepend($('<i class="fa fa-tag" aria-hidden="true">')));
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
                            url = url.replace(/https?:\/\//, '//');
                            img = $('<img>').attr({ 'src': url }).css({
                                'width': '100%',
                                'max-width': width,
                                'margin-bottom': '13px'
                            });
                            if (post.post_url || post.link_url) {
                                return $('<a target="_blank" rel="noopener">').attr('href', post.post_url || post.link_url).append(img);
                            }
                            return img;
                        }
                    },
                    postBody = function () {
                        var strippedHtml = DOMPurify.sanitize(post.body, { ALLOW_DATA_ATTR: false, ALLOWED_TAGS: ['img', 'br'], ALLOWED_ATTR: ['src', 'alt'] });

                        return $('<div class="post-body">').html(strippedHtml);
                    },
                    postQuote = function () {
                        return $('<blockquote>').append(_.escape($.trim(post.text)))
                            .append($('<em>').text(_.escape($.trim(post.source))));
                    },
                    postLink = function () {
                        return $('<a target="_blank" rel="noopener">').attr({ href: post.post_url, title: gt('Read article on tumblr.com') }).append($('<i class="icon-tumblr-sign">'));
                    },
                    postExternalLink = function () {
                        return $('<a target="_blank" rel="noopener">').attr({ href: post.url, title: gt('Open external link') }).append($('<i class="fa fa-external-link-square" aria-hidden="true">'));
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
                    node.append($('<h1>').text(title));
                }

                _(baton.data.posts).each(drawPost, node);
                this.append(node);
            };

        }())
    });

    function edit(model, view) {
        //disable widget till data is set by user
        model.set('candidate', true, { silent: true, validate: true });

        var $url = $('<input id="tumblr_url" type="text" class="form-control" placeholder=".tumblr.com">'),
            $description = $('<input id="tumblr_desc" type="text" class="form-control">'),
            $error = $('<div class="alert alert-danger" style="margin-top:15px;">').hide(),
            props = model.get('props') || {},
            isNew = _.isUndefined(props.url),
            //#. 'Create Tumblr feed' and 'Edit Tumblr feed' as headers of a modal dialog to create or edit a Tumblr feed.
            dialog = new ModalDialog({ title: isNew ? gt('Create Tumblr feed') : gt('Edit Tumblr feed'), async: true, width: 400 });

        dialog.build(function () {
            this.$body.append(
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
        .addCancelButton()
        //#. 'Create' or 'Edit' as button text to confirm to create or edit a Tumblr feed
        .addButton({ label: isNew ? gt('Create') : gt('Save'), action: 'save' })
        .on('cancel', function () {
            if (model.has('candidate') && _.isEmpty(model.attributes.props)) view.removeWidget();
        })
        .on('save', function () {
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
        }).open();
    }

    ext.point('io.ox/portal/widget/tumblr/settings').extend({
        title: gt('Tumblr'),
        type: 'tumblr',
        editable: true,
        edit: edit
    });
});
