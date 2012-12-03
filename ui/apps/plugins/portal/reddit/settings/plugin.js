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

define('plugins/portal/reddit/settings/plugin',
       ['io.ox/core/extensions',
        'io.ox/core/tk/dialogs',
        'text!plugins/portal/reddit/settings/tpl/subreddit.html',
        'text!plugins/portal/reddit/settings/tpl/pluginsettings.html',
        'settings!plugins/portal/reddit',
        'gettext!io.ox/portal'
        ], function (ext, dialogs, subredditSelectTemplate, pluginSettingsTemplate, settings, gt) {

    'use strict';

    var subreddits = settings.get('subreddits'),
        staticStrings = {
            SUBREDDITS: gt('Subreddits'),
            ADD:        gt('Add'),
            EDIT:       gt('Edit'),
            DELETE:     gt('Delete')
        },

        SubredditSelectView = Backbone.View.extend({
            _modelBinder: undefined,
            initialize: function (options) {
                this.template = doT.template(subredditSelectTemplate);
                this._modelBinder = new Backbone.ModelBinder();
            },
            render: function () {
                var self = this;

                self.$el.empty().append(self.template({
                    subreddit: this.model.get('subreddit'),
                    mode: this.model.get('mode'),
                    strings: staticStrings
                }));

                // Used by jquery ui sortable
                self.$el.attr('id', this.model.get('mode') + '#' + this.model.get('subreddit'));

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
                    var collection = new Backbone.Collection(subreddits);
                    $listbox.empty();

                    collection.each(function (item) {
                        $listbox.append(new SubredditSelectView({ model: item }).render().el);
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
                            subreddits = [];

                            _.each($(this).sortable('toArray'), function (value) {
                                var i = value.indexOf('#');
                                var mode = value.substring(0, i),
                                    subreddit = value.substring(i + 1);

                                subreddits.push({subreddit: subreddit, mode: mode});
                            });

                            settings.set('subreddits', subreddits);
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

                var $subreddit = $('<input>').attr({type: 'text', id: 'add_subreddit', placeholder: 'r/'});
                var $mode = $('<select>')
                    .append($('<option>').attr('value', 'hot').text(gt('hot')))
                    .append($('<option>').attr('value', 'new').text(gt('new')));

                var $error = $('<div>').addClass('alert alert-error').hide();

                var that = this;

                dialog.header($("<h4>").text(gt('Add a Subreddit')))
                    .append($subreddit)
                    .append($mode)
                    .append($error)
                    .addButton('cancel', gt('Cancel'))
                    .addButton('add', gt('Add'), null, {classes: 'btn-primary'})
                    .show();

                dialog.on('add', function (e) {
                    $error.hide();

                    var subreddit = String($.trim($subreddit.val())),
                        deferred = $.Deferred();

                    // No dot and url does not end with tumblr.com? Append it!
                    if (subreddit.match(/^r\//)) {
                        subreddit = subreddit.substring(2);
                    }

                    // TODO Check if mode is OK
                    if (subreddit.length === 0) {
                        $error.text(gt('Please enter a subreddit.'));
                        deferred.reject();
                    } else {
                        $.ajax({
                            url: 'http://www.reddit.com/r/' + subreddit + '/.json?jsonp=testcallback',
                            type: 'HEAD',
                            dataType: 'jsonp',
                            jsonp: false,
                            jsonpCallback: 'testcallback',
                            success: function () {
                                deferred.resolve();
                            },
                            error: function () {
                                $error.text(gt('Unknown error while checking subreddit.'));
                                deferred.reject();
                            }
                        });
                    }

                    deferred.done(function () {
                        subreddits.push({subreddit: subreddit, mode: $mode.val()});
                        settings.set('subreddits', subreddits);
                        settings.save();

                        var extId = 'reddit-' + subreddit.replace(/[^a-z0-9]/g, '_') + '-' + $mode.val();
                        ext.point("io.ox/portal/widget").enable(extId);

                        require(['plugins/portal/reddit/register'], function (reddit) {
                            reddit.reload();
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

                var oldSubreddit = this.$el.find('[selected]').data('subreddit'),
                    oldMode = this.$el.find('[selected]').data('mode');

                if (oldSubreddit) {
                    oldSubreddit = String(oldSubreddit);
                    var $subreddit = $('<input>').attr({type: 'text', id: 'add_subreddit', placeholder: 'r/'}).val(oldSubreddit),
                        $error = $('<div>').addClass('alert alert-error').hide(),
                        that = this;

                    var $mode = $('<select>')
                        .append($('<option>').attr('value', 'hot').text(gt('hot')))
                        .append($('<option>').attr('value', 'new').text(gt('new')))
                        .val(oldMode);

                    dialog.header($("<h4>").text(gt('Edit a Subreddit')))
                        .append($subreddit)
                        .append($mode)
                        .append($error)
                        .addButton('cancel', gt('Cancel'))
                        .addButton('edit', gt('Edit'), null, {classes: 'btn-primary'})
                        .show();

                    dialog.on('edit', function (e) {
                        $error.hide();

                        var subreddit = String($.trim($subreddit.val())),
                            mode = $mode.val(),
                            deferred = $.Deferred();

                        // No dot and url does not end with tumblr.com? Append it!
                        if (subreddit.match(/^r\//)) {
                            subreddit = subreddit.substring(2);
                        }

                        // TODO Check if mode is OK

                        if (subreddit.length === 0) {
                            $error.text(gt('Please enter a subreddit.'));
                            deferred.reject();
                        } else {
                            $.ajax({
                                url: 'http://www.reddit.com/r/' + subreddit + '/.json?jsonp=testcallback',
                                type: 'HEAD',
                                dataType: 'jsonp',
                                jsonp: false,
                                jsonpCallback: 'testcallback',
                                success: function () {
                                    deferred.resolve();
                                },
                                error: function () {
                                    $error.text(gt('Unknown error while checking subreddit.'));
                                    deferred.reject();
                                }
                            });
                        }

                        deferred.done(function () {
                            ext.point("io.ox/portal/widget").disable('reddit-' + oldSubreddit.replace(/[^a-z0-9]/g, '_') + '-' + oldMode.replace(/[^a-z0-9]/g, '_'));

                            subreddits = removeSubReddit(subreddits, oldSubreddit, oldMode);

                            subreddits.push({subreddit: subreddit, mode: mode});
                            settings.set('subreddits', subreddits);
                            settings.save();

                            ext.point("io.ox/portal/widget").enable('reddit-' + subreddit.replace(/[^a-z0-9]/g, '_') + '-' + mode.replace(/[^a-z0-9]/g, '_'));

                            require(['plugins/portal/reddit/register'], function (reddit) {
                                reddit.reload();
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
                var dialog = new dialogs.ModalDialog({
                    easyOut: true
                });

                var subreddit = this.$el.find('[selected]').data('subreddit'),
                    mode = this.$el.find('[selected]').data('mode');

                if (subreddit) {
                    subreddit = String(subreddit);
                    var that = this;

                    dialog.header($("<h4>").text(gt('Delete a Subreddit')))
                        .append($('<span>').text(gt('Do you really want to delete the following subreddit?')))
                        .append($('<ul>').append($('<li>').text(subreddit + " (" + mode + ")")))
                        .addButton('cancel', gt('Cancel'))
                        .addButton('delete', gt('Delete'), null, {classes: 'btn-primary'})
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                var newSubreddits = [];
                                _.each(subreddits, function (sub) {
                                    if (sub.subreddit !== subreddit || sub.subreddit === subreddit && sub.mode !== mode) {
                                        newSubreddits.push(sub);
                                    }
                                });

                                subreddits = removeSubReddit(subreddits, subreddit, mode);
                                settings.set('subreddits', subreddits);
                                settings.save();

                                var extId = 'reddit-' + subreddit.replace(/[^a-z0-9]/g, '_') + '-' + mode.replace(/[^a-z0-9]/g, '_');

                                ext.point("io.ox/portal/widget").disable(extId);

                                require(['plugins/portal/reddit/register'], function (reddit) {
                                    reddit.reload();
                                    that.trigger('redraw');
                                    ox.trigger("refresh^");
                                });
                            }
                            return false;
                        });
                }
            }
        }),

        removeSubReddit = function (subreddits, subreddit, mode) {
            var newSubreddits = [];
            _.each(subreddits, function (sub) {
                if (sub.subreddit !== subreddit || sub.subreddit === subreddit && sub.mode !== mode) {
                    newSubreddits.push(sub);
                }
            });
            return newSubreddits;
        },

        renderSettings = function () {
            return new PluginSettingsView().render().el;
        };

    return {
        staticStrings: staticStrings,
        renderSettings: renderSettings
    };
});