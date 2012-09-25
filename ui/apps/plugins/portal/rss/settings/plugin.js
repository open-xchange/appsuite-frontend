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
        'text!plugins/portal/rss/settings/tpl/feeds.html',
        'text!plugins/portal/rss/settings/tpl/pluginsettings.html'
        ], function (ext, dialogs, settings, gt, blogSelectTemplate, pluginSettingsTemplate) {

    'use strict';

    var feedgroups = settings.get('groups'),
        staticStrings = {
            RSS: gt('RSS'),
            ADD_FEED: gt('Add feed'),
            ADD_GROUP: gt('Add group'),
            EDIT_FEED: gt('Edit feed'),
            EDIT_GROUP: gt('Edit group'),
            DELETE_FEED: gt('Delete feed'),
            DELETE_GROUP: gt('Delete group')
        },

        FeedGroupSelectView = Backbone.View.extend({
            _modelBinder: undefined,
            initialize: function (options) {
                this.template = doT.template(blogSelectTemplate);
                this._modelBinder = new Backbone.ModelBinder();
            },
            render: function () {
                var self = this;
                var groupname = self.model.attributes.groupname;

                self.$el.empty().append(self.template({
                    url: "Ze örl",
                    description: groupname,
                    strings: staticStrings
                }));

                // Used by jquery ui sortable
                self.$el.attr('id', groupname.replace(/[^a-z0-9]/g, '_'));

                var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                self._modelBinder.bind(self.model, self.el, defaultBindings);
                
//                this.$el.find('.io-ox-portal-rss-settings-members').append('<h1>PEEEENIS</h1>');

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
                    var collection = new Backbone.Collection(feedgroups);
                    $listbox.empty();

                    collection.each(function (item) {
                        $listbox.append(new FeedGroupSelectView({ model: item }).render().el);
                    });

                    if (collection.length === 0) {
                        $listbox.hide();
                    } else {
                        $listbox.show();
                    }

                    $listbox.sortable({
                        update: function (event, ui) {
                            var newfeedgroups = [];

                            _.each($(this).sortable('toArray'), function (url) {
                                var oldData = _.find(feedgroups, function (blog) { return (blog.url === url); });

                                if (oldData) {
                                    newfeedgroups.push(oldData);
                                }
                            });
                            feedgroups = newfeedgroups;
                            settings.set('groups', feedgroups);
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
                'click [data-action="add-feed"]': 'onAddFeed',
                'click [data-action="edit-feed"]': 'onEditFeed',
                'click [data-action="del-feed"]': 'onDeleteFeed',
                'click [data-action="add-group"]': 'onAddGroup',
                'click [data-action="edit-group"]': 'onEditGroup',
                'click [data-action="del-group"]': 'onDeleteGroup'
            },

            onAddFeed: function (args) {
                var dialog = new dialogs.ModalDialog({ easyOut: true, async: true });

                var $url = $('<input>').attr({type: 'text', placeholder: gt('http://')}),
                    $description = $('<input>').attr({type: 'text', placeholder: gt('Description')}),
                    $group = $('<select>'),
                    $error = $('<div>').addClass('alert alert-error').hide(),
                    that = this;
                
                console.log("feedgroups = ", feedgroups);
                _(feedgroups).each(function (feedgroup) {
                    $group.append($('<option>').text(feedgroup.groupname));
                });
                if (!feedgroups || feedgroups.length === 0) {
                    $group.append($('<option>').attr({value: 'Default group'}).text('Default group'));
                }
                dialog.header($("<h4>").text(gt('Add a feed')))
                    .append($url)
                    .append($description)
                    .append($group)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('add', gt('Add'), null, {classes: 'btn-primary'})
                    .show();

                dialog.on('add', function (e) {
                    var url = $.trim($url.val()),
                        description = $.trim($description.val()),
                        groupname = $.trim($group.val()),
                        deferred = $.Deferred(),
                        newFeed;
                        
                    $error.hide();
                    
                    if (url.length === 0) {
                        $error.text(gt('Please enter a feed-url.'));
                        deferred.reject();
                    } else if (description.length === 0) {
                        $error.text(gt('Please enter a description.'));
                        deferred.reject();
                    } else {
                        //TODO add test for existence of feed
                        newFeed = {feedname: description, url: url, index: 100};
                        console.log('New feed:', newFeed);
                        deferred.resolve();
                    }

                    deferred.done(function () { //TODO
                        if (_(feedgroups).any(function (group) { return group.groupname === groupname; })) {
                            var group = _(feedgroups).find(function (group) {return group.groupname === groupname; });
                            group.members.push(newFeed);
                            console.log('Saving feed "%s" in existing group "%s"', description, groupname);
                        } else {
                            feedgroups.push({ groupname: groupname, index: 100, members: [newFeed]});
                            console.log('Saving feed "%s" in new group "%s"', description, groupname);
                        }
                        settings.set('groups', feedgroups);
                        settings.save();
                        
                        /*var extId = 'tumblr-' + url.replace(/[^a-z0-9]/g, '_');
                        ext.point("io.ox/portal/widget").enable(extId);

                        require(['plugins/portal/rss/register'], function (rss) {
                            rss.reload();
                            that.trigger('redraw');
                            ox.trigger("refresh^");
                        });*/

                        dialog.close();
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            },
            onEditFeed: function (args) {
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

                            feedgroups = removeFeed(feedgroups, oldUrl);

                            feedgroups.push({url: url, description: description});
                            settings.set('groups', feedgroups);
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
            onDeleteFeed: function (args) {
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
                                var newfeedgroups = [];
                                _.each(feedgroups, function (sub) {
                                    if (sub.url !== url) {
                                        newfeedgroups.push(sub);
                                    }
                                });

                                feedgroups = removeFeed(feedgroups, url);
                                settings.set('groups', feedgroups);
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
            },
            onAddGroup: function () {},
            onEditGroup: function () {},
            onDeleteGroup: function () {}
        }),

        removeFeed = function (feedgroups, url) {
            var newfeedgroups = [];
            _.each(feedgroups, function (sub) {
                if (sub.url !== url) {
                    newfeedgroups.push(sub);
                }
            });
            return newfeedgroups;
        },

        renderSettings = function () {
            return new PluginSettingsView().render().el;
        };

    return {
        staticStrings: staticStrings,
        renderSettings: renderSettings
    };
});