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
       ['text!plugins/portal/reddit/settings/tpl/subreddit.html',
        'text!plugins/portal/reddit/settings/tpl/pluginsettings.html',
        'settings!plugins/portal/reddit',
        'gettext!io.ox/portal/reddit',
        'io.ox/core/tk/dialogs'
        ], function (subredditSelectTemplate, pluginSettingsTemplate, settings, gt, dialogs) {

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
                    strings: staticStrings
                }));

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
                    var collection = new Backbone.Collection(subreddits);
                    $listbox.empty();

                    collection.each(function (item) {
                        $listbox.append(new SubredditSelectView({ model: item }).render().el);
                    });
                }

                redraw();

                this.on('redraw', redraw);

                return this;
            },
            events: {
                'click [data-action="add"]': 'onAdd',
//                'click [data-action="edit"]': 'onEdit',
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

                dialog.header($("<h4>").text(gt('Add an Subreddit')))
                    .append($subreddit)
                    .append($mode)
                    .append($error)
                    .addButton('add', 'Add', null, {classes: 'btn-primary'})
                    .addButton('cancel', 'Cancel')
                    .show();

                dialog.on('add', function (e) {
                    $error.hide();

                    var subreddit = $.trim($subreddit.val()),
                        deferred = $.Deferred();

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
                        that.trigger('redraw');
                        dialog.close();
                    });

                    deferred.fail(function () {
                        $error.show();
                        dialog.idle();
                    });
                });
            },
            onDelete: function (args) {
                console.log("onDelete");
                var dialog = new dialogs.ModalDialog({
                    easyOut: true
                });

                var subreddit = this.$el.find('[selected]').data('subreddit');

                if (subreddit) {
                    var that = this;

                    dialog.header($("<h4>").text(gt('Delete an Subreddit')))
                        .append($('<span>').text(gt('Do you really want to delete the following subreddit(s)?')))
                        .append($('<ul>').append($('<li>').text(subreddit)))
                        .addButton('delete', 'Delete', null, {classes: 'btn-primary'})
                        .addButton('cancel', 'Cancel')
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                var newSubreddits = [];
                                _.each(subreddits, function (sub) {
                                    if (sub.subreddit !== subreddit) {
                                        newSubreddits.push(sub);
                                    }
                                });

                                subreddits = newSubreddits;
                                settings.set('subreddits', subreddits);
                                settings.save();
                                that.trigger('redraw');
                            }
                            return false;
                        });
                }
            }
        }),

        renderSettings = function () {
            return new PluginSettingsView().render().el;
        };

    return {
        staticStrings: staticStrings,
        renderSettings: renderSettings
    };
});