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
        'gettext!io.ox/portal',
        'text!plugins/portal/rss/settings/tpl/pluginsettings.html',
        'io.ox/messaging/accounts/api',
        'less!plugins/portal/rss/style.css'
        ], function (ext, dialogs, settings, gt, pluginSettingsTemplate, accountApi) {

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
        migrateIfNecessary = function () {
            if (!settings.get('needsMigration')) {
                return;
            }
            var members = [];
            var group = {groupname: gt('RSS Feeds'), index: 100, members: members};

            accountApi.all('com.openexchange.messaging.rss').done(function (accounts) {
                var index = 0;
                _(accounts).each(function (account) {
                    index += 100;
                    members.push({url: account.configuration.url, feedname: account.displayName, index: index});
                });
                settings.set('groups', [group]);
                settings.save();
                settings.set('needsMigration', false);
                settings.save();
            });
        },

        FeedGroupView = Backbone.View.extend({
            _modelBinder: undefined,
            initialize: function (options) {
                this._modelBinder = new Backbone.ModelBinder();
            },
            render: function () {
                var self = this,
                    groupname = self.model.attributes.groupname,
                    members = self.model.attributes.members,
                    id = 'rss-feedgroup-' + groupname.replace(/[^A-Za-z0-9]/g, '_');

                self.$el.empty().append(
                    $('<div>').attr({'class': 'io-ox-portal-rss-settings-feedgroup', id: id, 'data-groupname': groupname}).append(
                        $('<strong>').text(groupname),
                        $('<i>').attr({'class': 'icon-edit', 'data-action': 'edit-group', title: staticStrings.EDIT_GROUP}),
                        $('<i>').attr({'class': 'icon-remove', 'data-action': 'del-group', title: staticStrings.DELETE_GROUP}),
                        $('<i>').attr({'class': 'icon-plus', 'data-action': 'add-feed', title: staticStrings.ADD_FEED})
                    ),
                    $('<div class="io-ox-portal-rss-settings-members">').append(_(members).map(function (member) {
                        return $('<div>').attr({'id': 'rss-feed-' + member.feedname.replace(/[^A-Za-z0-9]/g, '_'),
                                'class': 'io-ox-portal-rss-settings-member sortable-item',
                                'data-url': member.url,
                                'data-feedname': member.feedname,
                                'data-group': groupname}).append(
                            $('<span class="io-ox-portal-rss-feedname">').text(member.feedname),
                            $('<span class="io-ox-portal-rss-feedurl">').text(member.url),
                            $('<i>').attr({'class': 'icon-edit', 'data-action': 'edit-feed', title: staticStrings.EDIT_FEED}),
                            $('<i>').attr({'class': 'icon-remove', 'data-action': 'del-feed', title: staticStrings.DELETE_FEED})
                        );
                    }))
                );

                // Used by jquery ui sortable
                self.$el.attr('id', id);

                var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                self._modelBinder.bind(self.model, self.el, defaultBindings);

                return self;
            },
            events: {
                'click .sortable-item': 'onSelect'
            },
            onSelect: function (args) {
                this.$el.parent().find('[selected]').removeAttr('selected');
                $(args.srcElement).parent().attr('selected', 'selected');
            }
        }),



        PluginSettingsView = Backbone.View.extend({
            initialize: function (options) {
                this.template = doT.template(pluginSettingsTemplate);

                if (feedgroups) {
                    return;
                }
                migrateIfNecessary();

                feedgroups = settings.get('groups');
                if (feedgroups) {
                    return;
                }
                feedgroups = [];
                settings.set('groups', feedgroups);
                settings.save();
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
                        $listbox.append(new FeedGroupView({ model: item }).render().el);
                    });

                    if (collection.length === 0) {
                        $listbox.hide();
                    } else {
                        $listbox.show();
                    }

                    $listbox.sortable({
                        axis: 'y',
                        containment: 'parent',
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
            makeFeedgroupSelection: function (highlight) {
                var $select = $('<select>');

                _(feedgroups).each(function (feedgroup) {
                    var $option = $('<option>').text(feedgroup.groupname);
                    if (feedgroup.groupname === highlight) {
                        $option.attr({selected: 'selected'});
                    }
                    $select.append($option);
                });

                if (!feedgroups || feedgroups.length === 0) {
                    $select.append($('<option>').attr({value: 'Default group'}).text('Default group'));
                }

                return $select;
            },
            onAddFeed: function (args) {
                var dialog = new dialogs.ModalDialog({ easyOut: true, async: true }),
                    $url = $('<input>').attr({type: 'text', placeholder: gt('http://')}),
                    $feedname = $('<input>').attr({type: 'text', placeholder: gt('Description')}),
                    callerGroupname = $(this.$el.find('[selected]')).data('groupname'),
                    $group = this.makeFeedgroupSelection(callerGroupname),
                    $error = $('<div>').addClass('alert alert-error').hide(),
                    that = this;

                dialog.header($("<h4>").text(gt('Add a feed')))
                    .append($url)
                    .append($feedname)
                    .append($group)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('add', gt('Add'), null, {classes: 'btn-primary'})
                    .show();

                dialog.on('add', function (e) {
                    var url = $.trim($url.val()),
                        description = $.trim($feedname.val()),
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
                        deferred.resolve();
                    }

                    deferred.done(function () { //TODO
                        if (_(feedgroups).any(function (group) { return group.groupname === groupname; })) {
                            var group = _(feedgroups).find(function (group) {return group.groupname === groupname; });
                            group.members.push(newFeed);
                        } else {
                            feedgroups.push({ groupname: groupname, index: 100, members: [newFeed]});
                        }
                        settings.set('groups', feedgroups);
                        settings.save();

                        that.trigger('redraw');
                        ox.trigger("refresh^");

                        dialog.close();
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            },


            onAddGroup: function (args) {
                var dialog = new dialogs.ModalDialog({ easyOut: true, async: true });

                var $description = $('<input>').attr({type: 'text', placeholder: gt('Description')}),
                    $error = $('<div>').addClass('alert alert-error').hide(),
                    that = this;

                dialog.header($("<h4>").text(gt('Add a new group for your feeds')))
                    .append($description)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('add', gt('Add'), null, {classes: 'btn-primary'})
                    .show();

                dialog.on('add', function (e) {
                    var description = $.trim($description.val()),
                        deferred = $.Deferred(),
                        newFeedgroup;

                    $error.hide();

                    if (description.length === 0) {
                        $error.text(gt('Please enter a description.'));
                        deferred.reject();
                    } else {
                        //TODO add test for existence of group name
                        newFeedgroup = {groupname: description, index: 100, members: []};
                        deferred.resolve();
                    }

                    deferred.done(function () { //TODO
                        feedgroups.push(newFeedgroup);
                        settings.set('groups', feedgroups);
                        settings.save();

                        that.trigger('redraw');
                        ox.trigger("refresh^");

                        dialog.close();
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            },


            onEditFeed: function (args) {
                var dialog = new dialogs.ModalDialog({easyOut: true, async: true }),
                    $changed = $(this.$el.find('[selected]'));

                var oldUrl = $changed.data('url'),
                    oldFeedname = $changed.data('feedname'),
                    oldGroupname = $changed.data('group');

                if (!oldUrl) {
                    return;
                }
                var $url = $('<input>').attr({type: 'text'}).val(oldUrl),
                    $feedname = $('<input>').attr({type: 'text', placeholder: gt('Name of feed')}).val(oldFeedname),
                    $groups = this.makeFeedgroupSelection(oldGroupname),
                    $error = $('<div>').addClass('alert alert-error').hide(),
                    that = this;

                dialog.header($("<h4>").text(gt('Edit a feed')))
                    .append($url)
                    .append($feedname)
                    .append($groups)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('edit', gt('Edit'), null, {classes: 'btn-primary'})
                    .show();

                dialog.on('edit', function (e) {
                    $error.hide();

                    var url = $.trim($url.val()),
                        feedname = $.trim($feedname.val()),
                        groups = $groups.val(),
                        deferred = $.Deferred();

                    if (url.length === 0) {
                        $error.text(gt('Please enter an feed-url.'));
                        deferred.reject();
                    } else if (feedname.length === 0) {
                        $error.text(gt('Please enter a name for the feed.'));
                        deferred.reject();
                    } else {
                        //TODO add test for existence of feed
                        deferred.resolve();
                    }

                    deferred.done(function () {
                        var oldGroup = _(feedgroups).find(function (g) {return g.groupname === oldGroupname; }),
                            newGroup = _(feedgroups).find(function (g) {return g.groupname === groups; });
                        oldGroup.members = removeFeed(oldGroup.members, oldUrl);
                        newGroup.members.push({url: url, feedname: feedname});

                        settings.set('groups', feedgroups);
                        settings.save();

                        that.trigger('redraw');
                        ox.trigger("refresh^");
                        dialog.close();
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            },
            onEditGroup: function (pEvent) {
                var dialog = new dialogs.ModalDialog({easyOut: true, async: true }),
                    $changed = $(pEvent.target).parent();

                var oldGroupname = $changed.data('groupname');

                if (!oldGroupname) {
                    return;
                }
                var $groupname = $('<input>').attr({type: 'text', placeholder: gt('Name for group of feeds')}).val(oldGroupname),
                    $error = $('<div>').addClass('alert alert-error').hide(),
                    that = this;

                dialog.header($("<h4>").text(gt('Edit a group of feeds')))
                    .append($groupname)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('edit', gt('Edit'), null, {classes: 'btn-primary'})
                    .show();

                dialog.on('edit', function (e) {
                    $error.hide();

                    var groupname = $.trim($groupname.val()),
                        deferred = $.Deferred();

                    if (groupname.length === 0) {
                        $error.text(gt('Please enter a name for the group of feeds.'));
                        deferred.reject();
                    } else {
                        deferred.resolve();
                    }

                    deferred.done(function () {
                        var oldGroup = _(feedgroups).find(function (g) {return g.groupname === oldGroupname; });
                        oldGroup.groupname = groupname;

                        settings.set('groups', feedgroups);
                        settings.save();

                        that.trigger('redraw');
                        ox.trigger("refresh^");
                        dialog.close();
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            },


            onDeleteFeed: function (args) {
                var dialog = new dialogs.ModalDialog({
                    easyOut: true
                });
                var deleteme = this.$el.find('[selected]'),
                    url = deleteme.data('url'),
                    groupname = deleteme.data('group');

                if (!url) {
                    return;
                }
                var that = this;

                dialog.header($("<h4>").text(gt('Delete a feed')))
                    .append($('<span>').text(gt('Do you really want to delete the following feed(s)?'))) //TODO i18n
                    .append($('<ul>').append($('<li>').text(url)))
                    .addButton('cancel', gt('Cancel'))
                    .addButton('delete', gt('Delete'), null, {classes: 'btn-primary'})
                    .show()
                    .done(function (action) {
                        if (action === 'delete') {
                            var newGroup = _(feedgroups).find(function (g) {return g.groupname === groupname; });
                            newGroup.members = removeFeed(newGroup.members, url);

                            settings.set('groups', feedgroups);
                            settings.save();

                            that.trigger('redraw');
                            ox.trigger("refresh^");
                            dialog.close();
                        }
                        return false;
                    });
            },


            onDeleteGroup: function (pEvent) {
                var dialog = new dialogs.ModalDialog({
                    easyOut: true
                });
                var deleteme = $(pEvent.target).parent(),
                    groupname = deleteme.data('groupname');
                if (!groupname) {
                    return;
                }
                var that = this;

                dialog.header($("<h4>").text(gt('Delete a group of feeds')))
                    .append($('<span>').text(gt('Do you really want to delete the following group of feeds?'))) //TODO i18n
                    .append($('<ul>').append($('<li>').text(groupname)))
                    .addButton('cancel', gt('Cancel'))
                    .addButton('delete', gt('Delete'), null, {classes: 'btn-primary'})
                    .show()
                    .done(function (action) {
                        if (action === 'delete') {
                            feedgroups = feedgroups.filter(function (groups) { return groups.groupname !== groupname; });
                            settings.set('groups', feedgroups);
                            settings.save();

                            that.trigger('redraw');
                            ox.trigger("refresh^");
                        }
                        return false;
                    });
            }
        }),


        removeFeedgroup = function (feedgroups, groupname) {
            var newfeedgroups = [];
            _.each(feedgroups, function (group) {
                if (group.groupname !== groupname) {
                    newfeedgroups.push(group);
                }
            });
            return newfeedgroups;
        },
        removeFeed = function (members, url) {
            var newmembers = [];
            _.each(members, function (member) {
                if (member.url !== url) {
                    newmembers.push(member);
                }
            });
            return newmembers;
        },
        renderSettings = function () {
            return new PluginSettingsView().render().el;
        };

    return {
        staticStrings: staticStrings,
        renderSettings: renderSettings
    };
});