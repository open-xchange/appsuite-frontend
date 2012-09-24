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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/portal/rss/settings/plugin',
       ['io.ox/core/extensions',
        'io.ox/core/tk/dialogs',
        'settings!io.ox/rss',
        'gettext!io.ox/rss',
        'text!plugins/portal/tumblr/settings/tpl/blog.html',
        'text!plugins/portal/tumblr/settings/tpl/pluginsettings.html'
        ], function (ext, dialogs, settings, gt, blogSelectTemplate, pluginSettingsTemplate) {

    'use strict';

    var feeds = settings.get('groups'),
        staticStrings = {
            RSS:    gt('RSS'),
            ADD:    gt('Add'),
            EDIT:   gt('Edit'),
            DELETE: gt('Delete')
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
                'click .sortable-item': 'onSelect'
            },
            onSelect: function () {
                this.$el.parent().find('div[selected="selected"]').attr('selected', null);
                this.$el.find('.sortable-item').attr('selected', 'selected');
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
                    var collection = new Backbone.Collection(feeds);
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
                            var newfeeds = [];

                            _.each($(this).sortable('toArray'), function (url) {
                                var oldData = _.find(feeds, function (blog) { return (blog.url === url); });

                                if (oldData) {
                                    newfeeds.push(oldData);
                                }
                            });
                            feeds = newfeeds;
                            settings.set('groups', feeds);
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

                var $url = $('<input>').attr({type: 'text'}),
                    $description = $('<input>').attr({type: 'text', placeholder: gt('Description')}),
                    $error = $('<div>').addClass('alert alert-error').hide(),
                    that = this;

                dialog.header($("<h4>").text(gt('Add a feed')))
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

                    if (url.length === 0) {
                        $error.text(gt('Please enter a feed-url.'));
                        deferred.reject();
                    } else if (description.length === 0) {
                        $error.text(gt('Please enter a description.'));
                        deferred.reject();
                    } else {
                        //TODO add test for existence of feed
                    }

                    deferred.done(function () { //TODO
                        feeds.push({url: url, description: description});
                        settings.set('groups', feeds);
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
                    var $url = $('<input>').attr({type: 'text'}).val(oldUrl),
                        $description = $('<input>').attr({type: 'text', placeholder: gt('Description')}).val(oldDescription),
                        $error = $('<div>').addClass('alert alert-error').hide(),
                        that = this;

                    dialog.header($("<h4>").text(gt('Edit a feed')))
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

                        if (url.length === 0) {
                            $error.text(gt('Please enter an blog-url.'));
                            deferred.reject();
                        } else if (description.length === 0) {
                            $error.text(gt('Please enter a description.'));
                            deferred.reject();
                        } else {
                            //TODO add test for existence of feed
                        }

                        deferred.done(function () {
                            console.log('disable tumblr-' + oldUrl.replace(/[^a-z0-9]/g, '_'));

                            ext.point("io.ox/portal/widget").disable('tumblr-' + oldUrl.replace(/[^a-z0-9]/g, '_'));

                            feeds = removeFeed(feeds, oldUrl);

                            feeds.push({url: url, description: description});
                            settings.set('groups', feeds);
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

                    dialog.header($("<h4>").text(gt('Delete a feed')))
                        .append($('<span>').text(gt('Do you really want to delete the following feed(s)?'))) //TODO i18n
                        .append($('<ul>').append($('<li>').text(url)))
                        .addButton('cancel', gt('Cancel'))
                        .addButton('delete', gt('Delete'), null, {classes: 'btn-primary'})
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                var newfeeds = [];
                                _.each(feeds, function (sub) {
                                    if (sub.url !== url) {
                                        newfeeds.push(sub);
                                    }
                                });

                                feeds = removeFeed(feeds, url);
                                settings.set('groups', feeds);
                                settings.save();

                                var extId = 'rss-' + url.replace(/[^a-z0-9]/g, '_');

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

        removeFeed = function (feeds, url) {
            var newfeeds = [];
            _.each(feeds, function (sub) {
                if (sub.url !== url) {
                    newfeeds.push(sub);
                }
            });
            return newfeeds;
        },

        renderSettings = function () {
            return new PluginSettingsView().render().el;
        };

    return {
        staticStrings: staticStrings,
        renderSettings: renderSettings
    };
});