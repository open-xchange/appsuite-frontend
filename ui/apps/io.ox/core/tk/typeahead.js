/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/core/tk/typeahead', [
    'io.ox/core/extensions',
    'io.ox/core/api/autocomplete',
    'settings!io.ox/contacts',
    'static/3rd.party/typeahead.js/dist/typeahead.jquery.js',
    'css!3rd.party/bootstrap-tokenfield/css/tokenfield-typeahead.css'
], function (ext, AutocompleteAPI, settings) {

    'use strict';

    // https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md

    function customEvent(state, data) {
        this.model.set({
            source: state
        });
        return data;
    }

    var Typeahead = Backbone.View.extend({

        el: '<input type="text" class="form-control">',

        options: {
            apiOptions: {
                contacts: false,
                users: false,
                groups: false,
                resources: false,
                distributionlists: false
            },
            source: function (query) {
                return this.api.search(query);
            },
            click: $.noop,
            tabindex: 1,
            // Select first element on result callback
            autoselect: true,
            // Typeahead will not show a hint
            hint: true,
            // Filter items
            reduce: _.identity,
            // harmonize returned data from 'source'
            harmonize: _.identity,
            // call typeahead function in render method
            init: true,
            extPoint: 'io.ox/core/tk/typeahead'
        },

        initialize: function (o) {
            var self = this;

            // model to unify/repair listening for different event based states
            this.model = new Backbone.Model({
                // [idle|requesting|processing|finished]
                'source': 'idle',
                // [undefined|STRING]
                'query': undefined,
                // [closed|open]
                'dropdown': 'closed'
            });

            if (o.apiOptions) {
                // limit per autocomplete/search api
                var limit  = o.apiOptions.limit !== undefined ? o.apiOptions.limit : 10;
                o.apiOptions.limit = limit;

                // overall limit
                if (!o.maxResults) {
                    // Max limit for draw operation in dropdown depending on used apis
                    o.maxResults = limit * _(o.apiOptions).filter(function (val) { return val === true; }).length;
                }
            } else {
                o.maxResults = 25;
            }

            // use a clone instead of shared default-options-object
            o = this.options = $.extend({}, this.options, o || {});

            /*
             * extension point for autocomplete item
             */
            ext.point(o.extPoint + '/autoCompleteItem').extend({
                id: 'view',
                index: 100,
                draw: function (data) {
                    this.text(data);
                }
            });

            this.api = new AutocompleteAPI(o.apiOptions);

            this.listenTo(ox, 'refresh^', function () {
                this.api.cache = {};
            });

            this.typeaheadOptions = [{
                autoselect: o.autoselect,
                // The minimum character length needed before suggestions start getting rendered
                minLength: Math.max(1, settings.get('search/minimumQueryLength', 2)),
                // Highlight found query characters in bold
                highlight: true,
                hint: o.hint
            }, {
                source: function (query, callback) {
                    customEvent.call(self, 'requesting');
                    o.source.call(self, query)
                        .then(customEvent.bind(self, 'processing'))
                        .then(o.reduce)
                        .then(function (data) {
                            // max results
                            if (o.maxResults) {
                                data = data.slice(0, o.maxResults);
                            }
                            // order
                            return o.placement === 'top' ? data.reverse() : data;
                        })
                        .then(o.harmonize)
                        .then(customEvent.bind(self, 'finished'))
                        .then(customEvent.bind(self, 'idle'))
                        .then(callback);
                    // workaround: hack to get a reliable info about open/close state
                    if (!self.registered) {
                        var dateset = this;
                        // only way to get dateset reference and listen for 'rendered' event
                        // hint: used for 'delayedautoselect' option in core/tk/tokenfield
                        dateset.onSync('rendered', function () {
                            var dropdown = dateset.$el.closest('.twitter-typeahead').find('.tt-dropdown-menu'),
                                emptyAction = dropdown.find('.tt-dataset-0').is(':empty'),
                                query = dropdown.find('span.info').attr('data-query');
                            if (!emptyAction) {
                                self.model.set('query', query);
                            }
                            if (dropdown.is(':visible')) {
                                self.model.set('dropdown', 'opened');
                            }
                            if (query) self.trigger('typeahead-custom:dropdown-rendered', dropdown);
                        });
                        self.registered = true;
                    }
                },
                templates: {
                    suggestion: o.suggestion || function (result) {
                        var node = $('<div class="autocomplete-item">');
                        ext.point(o.extPoint + '/autoCompleteItem').invoke('draw', node, result);
                        return node;
                    },
                    header: function (data) {
                        // workaround: add a hidden info node that stores query
                        return $('<span class="info hidden">').attr('data-query', data.query);
                    }
                }
            }];
        },

        // hint: called with custom context via prototype
        render: function () {
            var o = this.options,
                self = this;

            this.$el.attr({
                tabindex: this.options.tabindex,
                placeholder: this.options.placeholder,
                'aria-label': this.options.ariaLabel
            }).on({
                // dirty hack to get a reliable info about open/close state
                'typeahead:closed': function () {
                    var dropdown = self.$el.closest('.twitter-typeahead').find('.tt-dropdown-menu');
                    if (!dropdown.is(':visible')) {
                        self.model.set('dropdown', 'closed');
                    }
                },
                'typeahead:selected typeahead:autocompleted': function (e, item) {
                    o.click.call(this, e, item);
                    self.$el.trigger('select', item);
                    self.$el.typeahead('val', '');
                },
                'typeahead:cursorchanged': function () {
                    // useful for debugging
                }
            });

            if (this.options.init) {
                this.$el.typeahead.apply(this.$el, this.typeaheadOptions);
            }

            return this;
        }

    });

    return Typeahead;

});
