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

define('plugins/portal/tumblr/settings/plugin',
       ['io.ox/core/extensions',
        'io.ox/core/tk/dialogs',
        'text!plugins/portal/tumblr/settings/tpl/blog.html',
        'text!plugins/portal/tumblr/settings/tpl/pluginsettings.html',
        'settings!plugins/portal/tumblr',
        'gettext!io.ox/portal/tumblr'
        ], function (ext, dialogs, blogSelectTemplate, pluginSettingsTemplate, settings, gt) {

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
                this.template = doT.template(blogSelectTemplate);
                this._modelBinder = new Backbone.ModelBinder();
            },
            render: function () {
                var self = this;

                self.$el.empty().append(self.template({
                    url: this.model.get('url'),
                    description: this.model.get('description'),
                    strings: staticStrings
                }));

                // Used by jquery ui sortable
                self.$el.attr('id', this.model.get('url'));

                var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                self._modelBinder.bind(self.model, self.el, defaultBindings);

                return self;
            },
            events: {
                'click .deletable-item': 'onSelect'
            },
            onSelect: function () {
                this.$el.parent().find('div[selected="selected"]').attr('selected', null);
                this.$el.find('.deletable-item').attr('selected', 'selected');
            }
        }),

        PluginSettingsView = Backbone.View.extend({
            initialize: function (options) {
                this.template = doT.template(pluginSettingsTemplate);
            },
            render: function () {
                this.$el.empty().append(this.template({
                    strings: staticStrings
                }));

                var that = this;

                function redraw() {
                    var $listbox = that.$el.find('.listbox');
                    var collection = new Backbone.Collection(blogs);
                    $listbox.empty();

                    collection.each(function (item) {
                        $listbox.append(new BlogSelectView({ model: item }).render().el);
                    });

                    if (collection.length === 0) {
                        $listbox.hide();
                    } else {
                        $listbox.show();
                    }

                    $listbox.sortable({
                        update: function (event, ui) {
                            var newBlogs = [];

                            _.each($(this).sortable('toArray'), function (url) {
                                var oldData = _.find(blogs, function (blog) { return (blog.url === url); });

                                if (oldData) {
                                    newBlogs.push(oldData);
                                }
                            });
                            blogs = newBlogs;
                            settings.set('blogs', blogs);
                            settings.save();

                            ox.trigger("refresh^", [true]);
                        }
                    });
                }

                redraw();

                this.on('redraw', redraw);

                return this;
            },
            events: {
                'click [data-action="add"]': 'onAdd',
                'click [data-action="edit"]': 'onEdit',
                'click [data-action="del"]': 'onDelete'
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
                    .addButton('cancel', 'Cancel')
                    .addButton('add', 'Add', null, {classes: 'btn-primary'})
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

                        var extId = 'tumblr-' + url.replace(/[^a-z0-9]/g, '_');
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
            },
            onEdit: function (args) {
                var dialog = new dialogs.ModalDialog({
                    easyOut: true,
                    async: true
                });

                var oldUrl = this.$el.find('[selected]').data('url'),
                    oldDescription = this.$el.find('[selected]').data('description');

                if (oldUrl) {
                    var $url = $('<input>').attr({type: 'text', placeholder: '.tumblr.com'}).val(oldUrl),
                        $description = $('<input>').attr({type: 'text', placeholder: gt('Description')}).val(oldDescription),
                        $error = $('<div>').addClass('alert alert-error').hide(),
                        that = this;

                    dialog.header($("<h4>").text(gt('Edit a blog')))
                        .append($url)
                        .append($description)
                        .append($error)
                        .addButton('cancel', 'Cancel')
                        .addButton('edit', 'Edit', null, {classes: 'btn-primary'})
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
                            console.log('disable tumblr-' + oldUrl.replace(/[^a-z0-9]/g, '_'));

                            ext.point("io.ox/portal/widget").disable('tumblr-' + oldUrl.replace(/[^a-z0-9]/g, '_'));

                            blogs = removeBlog(blogs, oldUrl);

                            blogs.push({url: url, description: description});
                            settings.set('blogs', blogs);
                            settings.save();

                            console.log('enable tumblr-' + url.replace(/[^a-z0-9]/g, '_'));
                            ext.point("io.ox/portal/widget").enable('tumblr-' + url.replace(/[^a-z0-9]/g, '_'));

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
            onDelete: function (args) {
                console.log("onDelete");

                var dialog = new dialogs.ModalDialog({
                    easyOut: true
                });

                var url = this.$el.find('[selected]').data('url');

                if (url) {
                    var that = this;

                    dialog.header($("<h4>").text(gt('Delete a Blog')))
                        .append($('<span>').text(gt('Do you really want to delete the following blog(s)?')))
                        .append($('<ul>').append($('<li>').text(url)))
                        .addButton('cancel', 'Cancel')
                        .addButton('delete', 'Delete', null, {classes: 'btn-primary'})
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                var newblogs = [];
                                _.each(blogs, function (sub) {
                                    if (sub.url !== url) {
                                        newblogs.push(sub);
                                    }
                                });

                                blogs = removeBlog(blogs, url);
                                settings.set('blogs', blogs);
                                settings.save();

                                var extId = 'tumblr-' + url.replace(/[^a-z0-9]/g, '_');

                                ext.point("io.ox/portal/widget").disable(extId);

                                require(['plugins/portal/tumblr/register'], function (tumblr) {
                                    tumblr.reload();
                                    that.trigger('redraw');
                                    ox.trigger("refresh^");
                                });
                            }
                            return false;
                        });
                }
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