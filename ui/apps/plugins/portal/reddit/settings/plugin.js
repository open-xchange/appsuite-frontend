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
        'settings!plugins/portal/reddit',
        'gettext!io.ox/portal/reddit'
        ], function (subredditSelectTemplate, settings, gt) {

    'use strict';

    var staticStrings = {
            SUBREDDITS: gt('Subreddits')
        },

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
//                    id: this.model.get('id'),
//                    accountType: this.model.get('accountType')
                    strings: staticStrings
                }));
//
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
            var subreddits = settings.get('subreddits');
            var collection = new Backbone.Collection(subreddits);

            console.log(subreddits);

            collection.each(function (item) {
                $node.append(new SubredditSelectView({ model: item }).render().el);
            });

            return $node;
        };

    return {
        staticStrings: staticStrings,
        renderSettings: renderSettings
    };
});