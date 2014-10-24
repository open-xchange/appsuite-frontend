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
    'io.ox/core/util',
    'settings!io.ox/contacts',
    'static/3rd.party/typeahead.js/dist/typeahead.jquery.js',
    'css!3rd.party/bootstrap-tokenfield/css/tokenfield-typeahead.css'
], function (AutocompleteAPI, util, settings) {

    'use strict';

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
            autoselect: true,
            // Highlight found query characters in bold
            highlight: true,
            // Typeahead will not show a hint
            hint: true,
            // mode: participant or search
            mode: 'participant',
            // Get data
            source: function (query) {
                return this.api.search(query);
            },
            // Filter items
            reduce: _.identity,
            name: function (data) {
                return util.unescapeDisplayName(data.display_name);
            },
            // Object related unique string
            stringify: function (data) {
                if (data.type === 2 || data.type === 3)
                    return this.name(data.contact);

                var name = this.name(data);
                name = name ? '"' + name + '" <' + data.email + '>' : data.email;
                return name || '';
            },
            // lazyload selector
            lazyload: null
        },

        typeaheadInput: $(),

        initialize: function (o) {
            var self = this;

            o = $.extend(this.options, o || {});

            this.api = new AutocompleteAPI(o.apiOptions);

            this.typeaheadOptions = [{
                autoselect: o.autoselect,
                minLength: o.minLength,
                highlight: o.highlight,
                hint: o.hint
            }, {
                source: function (query, callback) {
                    o.source.call(self, query)
                        .then(o.reduce)
                        .then(function (data) {
                            if (o.maxResults) {
                                return data.slice(0, o.maxResults);
                            }
                            return data;
                        })
                        .then(function (data) {
                            data = o.placement === 'top' ? data.reverse() : data;
                            return _(data).map(function (data) {
                                if (o.mode === 'participant') {
                                    data = {
                                        contact: data.data,
                                        email: data.email,
                                        field: data.field || '',
                                        phone: data.phone || '',
                                        type: data.type,
                                        distlistarray: data.data.distribution_list,
                                        id: data.data.id,
                                        folder_id: data.data.folder_id,
                                        image1_url: data.data.image1_url,
                                        first_name: data.data.first_name,
                                        last_name: data.data.last_name,
                                        display_name: data.data.display_name
                                    };
                                }
                                var stringResult = o.stringify(data);
                                return {
                                    value: stringResult.value || stringResult,
                                    label: stringResult.label || stringResult,
                                    data: data
                                };
                            });
                        })
                        .then(callback);
                },
                templates: {
                    suggestion: function (tokenData) {
                        var node = $('<div class="autocomplete-item">');
                        o.draw.call(node, tokenData.data);
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
