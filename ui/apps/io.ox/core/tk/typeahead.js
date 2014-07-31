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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/typeahead',
    ['io.ox/core/util',
     'settings!io.ox/contacts',
     'static/3rd.party/bootstrap-tokenfield/js/bootstrap-tokenfield.js',
     'static/3rd.party/typeahead.js/dist/typeahead.jquery.js',
     'css!3rd.party/bootstrap-tokenfield/css/bootstrap-tokenfield.css'
    ], function (util, settings) {

    'use strict';

    $.fn.autocompleteNew = function (o) {
        o = $.extend({
            api: null,
            draw: $.noop,
            cbshow: $.noop,
            click: $.noop,
            blur: $.noop,
            // The minimum character length needed before suggestions start getting rendered
            minLength: Math.max(1, settings.get('search/minimumQueryLength', 3)),
            // Max limit for draw operation in dropdown
            maxResults: 25,
            // init tokenfield plugin
            tokenfield: false,
            // Select first element on result callback
            autoselect: false,
            // Highlight found query characters in bold
            highlight: false,
            // Typeahead will not show a hint
            hint: true,
            // mode: participant or search
            mode: 'participant',
            // Get data
            source: function (val) {
                return this.api.search(val).then(function (data) {
                    return o.placement === 'top' ? data.reverse() : data;
                });
            },
            // Filter items
            reduce: function (data) {
                return data;
            },
            name: function (data) {
                return util.unescapeDisplayName(data.display_name);
            },
            // Object related unique string
            stringify: function (data) {
                if (data.type === 2 || data.type === 3)
                    return this.name(data.contact);

                var name = this.name(data);
                return name ? '"' + name + '" <' + data.email + '>' : data.email;
            },

            // TODO: not implemented for new autocomplete
            delay: 100,
            parentSelector: 'body',
            container: $('<div>').addClass('autocomplete-popup')
        }, o || {});

        var typeaheadInput,
            typeaheadOptions = [{
                autoselect: o.autoselect,
                minLength: o.minLength,
                highlight: o.highlight,
                hint: o.hint
            }, {
                source: function(query, callback) {
                    o.source(query)
                        .then(o.reduce)
                        .then(function (data) {
                            if (o.maxResults) {
                                return data.slice(0, o.maxResults);
                            }
                            return data;
                        })
                        .then(function (data) {
                            data =  _(data).map(function (data) {
                                var stringResult = o.stringify(data);
                                if (o.mode === 'participant') {
                                    data = {
                                        // index: index,
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
                                return {
                                    value: stringResult.value || stringResult,
                                    label: stringResult.label || stringResult,
                                    data: data
                                };
                            });
                            callback(data);
                        });
                },
                templates: {
                    suggestion: function (tokenData) {
                        var node = $('<div class="autocomplete-item">');
                        o.draw.call(node, tokenData.data);
                        return node;
                    }
                }
            }
        ];

        if (o.tokenfield) {

            this.tokenfield({
                createTokensOnBlur: true,
                minLength: o.minLength,
                typeahead: typeaheadOptions
            }).on({
                'tokenfield:createdtoken': function (e) {
                    // A11y: set title
                    var title = '',
                        token = $(e.relatedTarget);
                    if (e.attrs) {
                        if (e.attrs.label !== e.attrs.value) {
                            title = e.attrs.label ? '"' + e.attrs.label + '" <' + e.attrs.value + '>' : e.attrs.value;
                        } else {
                            title = e.attrs.label;
                        }
                    }
                    token.attr({
                        title: title
                    });
                }
            });

            typeaheadInput =  $(this).data('bs.tokenfield').$input;
        } else {
            typeaheadInput = this.typeahead.apply(this, typeaheadOptions);
        }

        typeaheadInput.on({
            'typeahead:opened': function () {
                if (_.isFunction(o.cbshow)) o.cbshow();
            },
            'typeahead:selected': function (e, item) {
                o.click.call(this, e, item.data);
            },
            'blur': o.blur
        });

        this.getOriginalInput = function () {
            return typeaheadInput;
        };

        return this;
    };
});
