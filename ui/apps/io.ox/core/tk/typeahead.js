/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) 2004-2012 Open-Xchange, Inc.
 * Mail: info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/core/tk/typeahead', [
    'io.ox/core/api/autocomplete',
    'settings!io.ox/contacts',
    'static/3rd.party/typeahead.js/dist/typeahead.jquery.js',
    'css!3rd.party/bootstrap-tokenfield/css/tokenfield-typeahead.css'
], function (AutocompleteAPI, settings) {

    'use strict';

    function customEvent (state, query, data) {
        this.model.set({
            source: state,
            query: state === 'idle' ? query : this.model.get('query')
        });
        return data;
    }

    var Typeahead = Backbone.View.extend({

        tagName: 'input type="text"',

        className: 'form-control',

        options: {
            apiOptions: {},
            draw: $.noop,
            cbshow: $.noop,
            click: $.noop,
            blur: $.noop,
            tabindex: 1,
            // The minimum character length needed before suggestions start getting rendered
            minLength: Math.max(1, settings.get('search/minimumQueryLength', 2)),
            // Max limit for draw operation in dropdown
            maxResults: 25,
            // Select first element on result callback
            autoselect: false,
            // Highlight found query characters in bold
            highlight: true,
            // Typeahead will not show a hint
            hint: true,
            // Get data
            source: function (query) {
                return this.api.search(query);
            },
            // Filter items
            reduce: _.identity,
            // harmonize returned data from 'source'
            harmonize: _.identity,
            // lazyload selector
            lazyload: null
        },

        typeaheadInput: $(),

        initialize: function (o) {
            var self = this;

            // model to unify/repair listening for different event based states
            this.model = new Backbone.Model({
                // [idle|requesting|processing|finished]
                'source': 'idle',
                'query': undefined,
                'dropdown': 'closed'
            });

            // use a clone instead of shared default-options-object
            o = this.options = $.extend({}, this.options, o || {});

            this.api = new AutocompleteAPI(o.apiOptions);

            this.typeaheadOptions = [{
                autoselect: o.autoselect,
                minLength: o.minLength,
                highlight: o.highlight,
                hint: o.hint
            }, {
                source: function (query, callback) {
                    customEvent.call(self, 'requesting', query);
                    o.source.call(self, query)
                        .then(customEvent.bind(self, 'processing', query))
                        .then(o.reduce)
                        .then(function (data) {
                            if (o.maxResults) {
                                return data.slice(0, o.maxResults);
                            }
                            return data;
                        })
                        .then(function (data) {
                            data = o.placement === 'top' ? data.reverse() : data;
                            return _(data).map(o.harmonize);
                        })
                        .then(customEvent.bind(self, 'finished', query))
                        .then(customEvent.bind(self, 'idle', query))
                        .then(callback);
                    // dirty hack to get a reliable info about open/close state
                    if (!self.registered) {
                        // use source function to get dateset reference
                        this.onSync('rendered', function () {
                            var dropdown = this.$el.closest('.twitter-typeahead').find('.tt-dropdown-menu');
                            if (dropdown.is(':visible'))
                                self.model.set('dropdown', 'opened');
                        });
                        self.registered = true;
                    }
                },
                templates: {
                    suggestion: o.suggestion || function (searchresult) {
                        var node = $('<div class="autocomplete-item">');
                        o.draw.call(node, searchresult);
                        return node;
                    }
                }
            }];

            this.$el.attr({ tabindex: this.options.tabindex }).typeahead(this.typeaheadOptions);
        },

        render: function () {
            var o = this.options,
                self = this;
            this.$el.on({
                'typeahead:opened': function () {
                    if (_.isFunction(o.cbshow)) o.cbshow();
                },
                // dirty hack to get a reliable info about open/close state
                'typeahead:closed': function () {
                    var dropdown = self.$el.closest('.twitter-typeahead').find('.tt-dropdown-menu');
                    if (!dropdown.is(':visible'))
                        self.model.set('dropdown', 'closed');
                },
                'typeahead:selected typeahead:autocompleted': function (e, item) {
                    o.click.call(this, e, item.data);
                    self.typeaheadInput.trigger('select', item.data);
                },
                'blur': o.blur
            });
            return this;
        }

    });

    return Typeahead;

});
