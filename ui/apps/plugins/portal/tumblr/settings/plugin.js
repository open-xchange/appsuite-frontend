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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/portal/tumblr/settings/plugin',
       ['io.ox/core/extensions',
        'io.ox/core/tk/dialogs',
        'settings!plugins/portal/tumblr',
        'gettext!io.ox/portal',
        'less!plugins/portal/tumblr/style.css'
        ], function (ext, dialogs, settings, gt) {

    'use strict';

    var blogs = settings.get('blogs'),
        staticStrings = {
            TUMBLRBLOGS: gt('Tumblr-Blogs'),
            ADD:         gt('Add'),
            EDIT:        gt('Edit'),
            DELETE:      gt('Delete')
        },
        BlogSelectView = Backbone.View.extend({
            _modelBinder: undefined,
            initialize: function (options) {
                this._modelBinder = new Backbone.ModelBinder();
            },
            render: function () {
                var self = this;

                self.$el.empty().append(
                    $('<div class="io-ox-tumblr-setting">')
                    .attr({'data-url': this.model.get('url'),  'data-description': this.model.get('description')}).append(
                        $('<span data-property="url">'),
                        $('<i>').attr({'class': 'icon-edit', 'data-action': 'edit-feed', title: staticStrings.EDIT_FEED}),
                        $('<i>').attr({'class': 'icon-remove', 'data-action': 'del-feed', title: staticStrings.DELETE_FEED})
                    )
                );

                self.$el.attr('id', this.model.get('url'));

                var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                self._modelBinder.bind(self.model, self.el, defaultBindings);
                
                return self;
            },
            events: {
                'click .icon-remove': 'onDelete',
                'click .icon-edit': 'onEdit'
            },
            onEdit: function (pEvent) {
                var dialog = new dialogs.ModalDialog({
                    easyOut: true,
                    async: true
                });
                var $myNode = $(pEvent.target).parent(),
                    oldUrl = $myNode.data('url'),
                    oldDescription = $myNode.data('description');

                if (oldUrl) {
                    var $url = $('<input>').attr({type: 'text', placeholder: '.tumblr.com'}).val(oldUrl),
                    $description = $('<input>').attr({type: 'text', placeholder: gt('Description')}).val(oldDescription),
                    $error = $('<div>').addClass('alert alert-error').hide(),
                    that = this;

                    dialog.header($("<h4>").text(gt('Edit a blog')))
                    .append($url)
                    .append($description)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('edit', gt('Edit'), null, {classes: 'btn-primary'})
                    .show();

                    dialog.on('edit', function (e) {
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
                            $error.text(gt('Please enter an blog-url.'));
                            deferred.reject();
                        } else if (description.length === 0) {
                            $error.text(gt('Please enter a description.'));
                            deferred.reject();
                        } else {
                            $.ajax({
                                url: 'https://api.tumblr.com/v2/blog/' + url + '/posts/?api_key=gC1vGCCmPq4ESX3rb6aUZkaJnQ5Ok09Y8xrE6aYvm6FaRnrNow&notes_info=&filter=&jsonp=testcallback',
                                type: 'HEAD',
                                dataType: 'jsonp',
                                jsonp: false,
                                jsonpCallback: 'testcallback',
                                success: function (data) {
                                    if (data.meta && data.meta.status && data.meta.status === 200) {
                                        $myNode.data({url: url, description: description});
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
                            ext.point("io.ox/portal/widget").disable('tumblr-' + oldUrl.replace(/[^a-zA-Z0-9]/g, '_'));

                            blogs = removeBlog(blogs, oldUrl);

                            blogs.push({url: url, description: description});
                            settings.set('blogs', blogs);
                            settings.save();

                            ext.point("io.ox/portal/widget").enable('tumblr-' + url.replace(/[^a-zA-Z0-9]/g, '_'));

                            require(['plugins/portal/tumblr/register'], function (tumblr) {
                                tumblr.reload();
                                that.trigger('redraw');
                                ox.trigger("refresh^");
                                dialog.close();
                            });
                        });

                        deferred.fail(function () {
                            $error.show();
                            dialog.idle();
                        });
                    });
                }
            },
            onDelete: function (pEvent) {
                var dialog = new dialogs.ModalDialog({
                    easyOut: true
                });
                var $myNode = $(pEvent.target).parent(),
                    url = $myNode.data('url');

                if (url) {
                    var that = this;

                    dialog.header($("<h4>").text(gt('Delete a Blog')))
                    .append($('<span>').text(gt('Do you really want to delete the following blog(s)?')))
                    .append($('<ul>').append($('<li>').text(url)))
                    .addButton('cancel', gt('Cancel'))
                    .addButton('delete', gt('Delete'), null, {classes: 'btn-primary'})
                    .show()
                    .done(function (action) {
                        if (action === 'delete') {
                            blogs = removeBlog(blogs, url);
                            settings.set('blogs', blogs);
                            settings.save();
                            $myNode.remove();
                            var extId = 'tumblr-' + url.replace(/[^a-zA-Z0-9]/g, '_');

                            ext.point("io.ox/portal/widget").disable(extId);
                            require(['plugins/portal/tumblr/register'], function (tumblr) {
                                ox.trigger("refresh^");
                                tumblr.reload();
                            });
                        }
                        return false;
                    });
                }
            }
        }),

        PluginSettingsView = Backbone.View.extend({
            initialize: function (options) {
            },
            render: function () {
                this.$el.empty().append(
                    $('<div>').append(
                        $('<div class="section">').append(
                            $('<legend class="sectiontitle">').text(staticStrings.TUMBLRBLOGS),
                            $('<div class="settings-detail-pane">').append(
                                $('<div class="io-ox-tumblr-settings">')
                            ),
                            $('<div class="sectioncontent">').append(
                                $('<button class="btn" data-action="add" style="margin-right: 15px; ">').text(staticStrings.ADD)
                            ),
                            $('<div class="settings sectiondelimiter">')
                        )
                    )
                );
                var that = this;
                function redraw() {
                    var $settings = that.$el.find('.io-ox-tumblr-settings');
                    var collection = new Backbone.Collection(blogs);
                    $settings.empty();

                    collection.each(function (item) {
                        $settings.append(new BlogSelectView({ model: item }).render().el);
                    });

                    if (collection.length === 0) {
                        $settings.hide();
                    } else {
                        $settings.show();
                    }
                }

                redraw();

                this.on('redraw', redraw);

                return this;
            },
            events: {
                'click [data-action="add"]': 'onAdd'
            },

            onAdd: function (args) {
                var dialog = new dialogs.ModalDialog({
                    easyOut: true,
                    async: true
                });

                var $url = $('<input>').attr({type: 'text', placeholder: '.tumblr.com'}),
                    $description = $('<input>').attr({type: 'text', placeholder: gt('Description')}),
                    $error = $('<div>').addClass('alert alert-error').hide(),
                    that = this;

                dialog.header($("<h4>").text(gt('Add a blog')))
                    .append($url)
                    .append($description)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('add', gt('Add'), null, {classes: 'btn-primary'})
                    .show();

                dialog.on('add', function (e) {
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
                        $error.text(gt('Please enter an blog-url.'));
                        deferred.reject();
                    } else if (description.length === 0) {
                        $error.text(gt('Please enter a description.'));
                        deferred.reject();
                    } else {
                        $.ajax({
                            url: 'https://api.tumblr.com/v2/blog/' + url + '/posts/?api_key=gC1vGCCmPq4ESX3rb6aUZkaJnQ5Ok09Y8xrE6aYvm6FaRnrNow&notes_info=&filter=&jsonp=testcallback',
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
                        blogs.push({url: url, description: description});
                        settings.set('blogs', blogs);
                        settings.save();

                        var extId = 'tumblr-' + url.replace(/[^a-zA-Z0-9]/g, '_');
                        ext.point("io.ox/portal/widget").enable(extId);

                        require(['plugins/portal/tumblr/register'], function (tumblr) {
                            tumblr.reload();
                            that.trigger('redraw');
                            ox.trigger("refresh^");
                            dialog.close();
                        });
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            }
        }),

        removeBlog = function (blogs, url) {
            var newblogs = [];
            _.each(blogs, function (sub) {
                if (sub.url !== url) {
                    newblogs.push(sub);
                }
            });
            return newblogs;
        },

        renderSettings = function () {
            return new PluginSettingsView().render().el;
        };

    return {
        staticStrings: staticStrings,
        renderSettings: renderSettings
    };
});