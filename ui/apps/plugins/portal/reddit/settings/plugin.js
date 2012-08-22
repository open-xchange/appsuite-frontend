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

        PluginSettingsView = Backbone.View.extend({
            initialize: function (options) {
                this.template = doT.template(pluginSettingsTemplate);
            },
            render: function () {
                var self = this;
                self.$el.empty().append(self.template({
                    strings: staticStrings
                }));

                return self;
            },
            events: {
                'click [data-action="add"]': 'onAdd'
//                'click [data-action="edit"]': 'onEdit',
//                'click [data-action="delete"]': 'onDelete'
            },

            onAdd: function (args) {
                console.log("onAdd");
                var dialog = new dialogs.ModalDialog({
                    easyOut: true
                });

                var $input = $('<input>').attr({type: 'text', id: 'add_subreddit', placeholder: 'r/'});

                dialog.header($("<h4>").text(gt('Add an Subreddit')))
                    .append($input)
                    .addButton('add', 'Add')
                    .addButton('cancel', 'Cancel')
                    .show()
                    .done(function (action) {
                        if (action === 'add') {
                            // TODO validate inputs
                            // TODO hot or new?
                            // TODO redraw
                            subreddits.push({subreddit: $input.attr('value'), mode: 'hot'});
                            settings.set('subreddits', subreddits);
                            settings.save();
                        }
                    });
            }
        }),

        SubredditSelectView = Backbone.View.extend({
            _modelBinder: undefined,
            initialize: function (options) {
                console.log(subredditSelectTemplate);
                this.template = doT.template(subredditSelectTemplate);
                this._modelBinder = new Backbone.ModelBinder();
            },
            render: function () {
                var self = this;
                self.$el.empty().append(self.template({
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

        renderSettings = function () {
            var $node = $('<div>');
            var collection = new Backbone.Collection(subreddits);

            $node.append(new PluginSettingsView().render().el);
            var $listbox = $node.find('.listbox');

            collection.each(function (item) {
                $listbox.append(new SubredditSelectView({ model: item }).render().el);
            });

            return $node;
        };

    return {
        staticStrings: staticStrings,
        renderSettings: renderSettings
    };
});