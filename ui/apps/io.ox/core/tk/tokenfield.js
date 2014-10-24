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

define('io.ox/core/tk/tokenfield', [
    'io.ox/core/tk/typeahead',
    'static/3rd.party/bootstrap-tokenfield/js/bootstrap-tokenfield.js',
    'css!3rd.party/bootstrap-tokenfield/css/bootstrap-tokenfield.css',
    'less!io.ox/core/tk/tokenfield'
], function (Typeahead) {

    'use strict';

    var Tokenfield = Typeahead.extend({

        className: 'test',

        render: function () {
            var o = this.options,
                self = this;

            this.$el
                .attr({ tabindex: this.options.tabindex })
                .addClass('tokenfield');

            this.$el.tokenfield({
                createTokensOnBlur: true,
                minLength: o.minLength,
                typeahead: self.typeaheadOptions
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
                },
                'tokenfield:edittoken': function (e) {
                    if (e.attrs) {
                        if (e.attrs.label !== e.attrs.value) {
                            e.attrs.value = e.attrs.label ? '"' + e.attrs.label + '" <' + e.attrs.value + '>' : e.attrs.value;
                        } else {
                            e.attrs.value = e.attrs.label;
                        }
                    }
                },
                'tokenfield:createtoken': function (e) {
                    var tokenData = self.getInput().data();
                    if (tokenData.edit === true ) {
                        var newAttrs = /^"(.*?)"\s+<\s*(.*?)\s*>$/.exec(e.attrs.value);
                        if (_.isArray(newAttrs)) {
                            e.attrs.label = newAttrs[1];
                            e.attrs.value = newAttrs[2];
                        }
                    }
                }
            });

            this.input =  $(this.$el).data('bs.tokenfield').$input.on({
                'typeahead:opened': function () {
                    if (_.isFunction(o.cbshow)) o.cbshow();
                },
                'typeahead:selected typeahead:autocompleted': function (e, item) {
                    o.click.call(this, e, item.data);
                    self.input.trigger('select', item.data);
                },
                'blur': o.blur
            });

            if (o.lazyload) {
                // get original input element to get the typeahead dataset
                this.input.data('ttTypeahead').dropdown.onAsync('datasetRendered', function () {
                    $(o.lazyload, this.$menu).lazyload({
                        container: this.$menu
                    });
                });
            }

            this.$el.parent().addClass(this.options.className);

            return this;
        },

        getInput: function () {
            return this.input;
        },

        getTokens: function () {
            return this.$el.tokenfield('getTokens');
        },

        setTokens: function (tokens) {
            return this.$el.tokenfield('setTokens', tokens, false, false);
        }

    });
    debugger;
    return Tokenfield;

});
