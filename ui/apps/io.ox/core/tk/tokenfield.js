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
    'io.ox/participants/model',
    'io.ox/contacts/api',
    'static/3rd.party/bootstrap-tokenfield/js/bootstrap-tokenfield.js',
    'css!3rd.party/bootstrap-tokenfield/css/bootstrap-tokenfield.css',
    'less!io.ox/core/tk/tokenfield',
    'static/3rd.party/jquery-ui.min.js'
], function (Typeahead, pModel, contactsAPI) {

    'use strict';

    $.fn.tokenfield.Constructor.prototype.getTokensList = function (delimiter, beautify, active) {
        delimiter = delimiter || this._firstDelimiter;
        beautify = ( typeof beautify !== 'undefined' && beautify !== null ) ? beautify : this.options.beautify;

        var separator = delimiter + ( beautify && delimiter !== ' ' ? ' ' : '');
        return $.map( this.getTokens(active), function (token) {
            if (token.model) {
                var displayname = token.model.getDisplayName(),
                    email = token.model.getEmail ? token.model.getEmail() : undefined;
                return displayname === email ? email : '"' + displayname + '" <' + email + '>';
            }
            return token.value;
        }).join(separator);
    };

    $.fn.tokenfield.Constructor.prototype.setTokens = function (tokens, add, triggerChange) {
        if (!tokens) return;

        if (!add) this.$wrapper.find('.token').remove();

        if (typeof triggerChange === 'undefined') {
            triggerChange = true;
        }

        if (typeof tokens === 'string') {
            if (this._delimiters.length) {
                // Split based on comma as delimiter whilst ignoring comma in quotes
                tokens = tokens.match(/([^\"\',]*((\'[^\']*\')*||(\"[^\"]*\")*))+/gm).filter(function (e) { return e; });
            } else {
                tokens = [tokens];
            }
        }

        var _self = this;
        $.each(tokens, function (i, attrs) {
            _self.createToken(attrs, triggerChange);
        });

        return this.$element.get(0);
    };

    var Tokenfield = Typeahead.extend({

        className: 'test',

        events: {
            'dispose': 'dispose'
        },

        initialize: function (options) {
            var self = this;

            options = _.extend({}, {
                // hint: not the same type of stringify that was used in autocomplete
                harmonize: function (data) {
                    var model = new pModel.Participant(data.data);
                    return {
                        value: model.getTarget(),
                        label: model.getDisplayName(),
                        model: model
                    };
                }
            }, options);

            // call super constructor
            Typeahead.prototype.initialize.call(this, options);

            // initialize collection
            this.collection = options.collection || new pModel.Participants();

            // update comparator function
            this.collection.comparator = function (model) {
                return model.index || null;
            };

            // lock for redraw action
            this.redrawLock = false;

            this.listenTo(this.collection, 'reset', function () {
                self.redrawToken();
            });
        },

        dispose: function () {
            // clean up tokenfield
            this.$el.tokenfield('destroy');
            this.stopListening();
            this.collection = null;
        },

        render: function () {
            var o = this.options,
                self = this;

            this.$el
                .attr({
                    tabindex: this.options.tabindex,
                    placeholder: this.options.placeholder || null
                })
                .addClass('tokenfield');
            this.$el.tokenfield({
                createTokensOnBlur: true,
                minLength: o.minLength,
                typeahead: self.typeaheadOptions
            }).on({
                'tokenfield:createtoken': function (e) {
                    var inputData = self.getInput().data(), model;
                    if (inputData.edit === true) {
                        // edit mode
                        var newAttrs = /^"(.*?)"\s*(<\s*(.*?)\s*>)?$/.exec(e.attrs.value);
                        if (_.isArray(newAttrs)) {
                            e.attrs.label = newAttrs[1];
                        } else {
                            newAttrs = ['', e.attrs.value, '', e.attrs.value];
                        }
                        // save new token data to model
                        model = inputData.editModel.set('token', {
                            label: newAttrs[1],
                            value: newAttrs[3]
                        });
                        // save cid to token value
                        e.attrs.value = model.cid;
                        e.attrs.model = model;
                    } else if (!self.redrawLock) {
                        // create mode
                        var model;
                        if (e.attrs.model) {
                            model = e.attrs.model;
                        } else {
                            var newAttrs = /^"(.*?)"\s*(<\s*(.*?)\s*>)?$/.exec(e.attrs.value);
                            if (_.isArray(newAttrs)) {
                                e.attrs.label = newAttrs[1];
                                e.attrs.value = newAttrs[3];
                            } else {
                                newAttrs = ['', e.attrs.value, '', e.attrs.value];
                            }
                            // add extrenal participant
                            model = new pModel.Participant({
                                type: 5,
                                display_name: newAttrs[1],
                                email1: newAttrs[3]
                            });
                        }
                        model.set('token', {
                            label: e.attrs.label,
                            value: e.attrs.value
                        }, { silent: true });
                        // add model to the collection and save cid to the token
                        self.collection.addUniquely(model);
                        // save cid to token value
                        e.attrs.value = model.cid;
                        e.attrs.model = model;
                    }
                },
                'tokenfield:createdtoken': function (e) {
                    if (e.attrs) {
                        // a11y: set title
                        var model = e.attrs.model || self.getModelByCID(e.attrs.value);
                        $(e.relatedTarget).attr('title', function () {
                            var token = model.get('token'),
                                title = token.label;
                            if (token.label !== token.value) {
                                title = token.label ? token.label + ' <' + token.value + '>' : token.value;
                            }
                            return title;
                        });

                        // add contact picture
                        $(e.relatedTarget).prepend(
                            contactsAPI.pictureHalo(
                                $('<div class="contact-image">'),
                                model.toJSON(),
                                { width: 16, height: 16, scaleType: 'contain' }
                            )
                        );
                    }
                },
                'tokenfield:edittoken': function (e) {
                    if (e.attrs && e.attrs.model) {
                        var token = e.attrs.model.get('token');
                        // save cid to input
                        self.getInput().data('editModel', e.attrs.model);
                        // build edit string
                        e.attrs.value = token.label;
                        if (token.value !== token.label) {
                            e.attrs.value = token.label ? '"' + token.label + '" <' + token.value + '>' : token.value;
                        }
                    }
                },
                'tokenfield:removetoken': function (e) {
                    self.collection.remove(self.getModelByCID(e.attrs.value));
                }
            });

            // save original typeahead input
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

            this.$el.parent().addClass(this.options.className);

            // init drag 'n' drop sort
            this.$el.closest('div.tokenfield').sortable({
                items: '> .token',
                connectWith: 'div.tokenfield',
                cancel: 'a.close',
                placeholder: 'token placeholder',
                revert: 0,
                forcePlaceholderSize: true,
                // update: _.bind(this.resort, this),
                stop: function () {
                    self.resort.call(self);
                },
                receive: function (e, ui) {
                    var tokenData = ui.item.data();
                    self.collection.addUniquely(tokenData.attrs.model);
                    self.resort.call(self);
                },
                remove: function (e, ui) {
                    var tokenData = ui.item.data();
                    self.collection.remove(tokenData.attrs.model);
                    self.resort.call(self);
                }
            }).droppable({
                hoverClass: 'drophover'
            });

            // Remove on cut
            this.$el.closest('div.tokenfield').on('keydown', function (e) {
                if ((e.ctrlKey || e.metaKey) && e.keyCode === 88) {
                    $(this).find('.token.active').each(function () {
                        self.collection.remove($(this).data().attrs.model);
                    });
                    self.redrawToken();
                }
            });

            return this;
        },

        getModelByCID: function (cid) {
            return this.collection.get({ cid: cid });
        },

        redrawToken: function () {
            var tokens = [];
            this.redrawLock = true;
            this.collection.each(function (model) {
                tokens.push({
                    label: model.getDisplayName(),
                    value: model.cid,
                    model: model
                });
            });
            this.$el.tokenfield('setTokens', tokens, false);
            this.redrawLock = false;
        },

        resort: function () {
            var col = this.collection;
            _(this.$el.tokenfield('getTokens')).each(function (token, index) {
                col.get({ cid: token.value }).index = index;
            });
            col.sort();
            this.redrawToken();
        },

        getInput: function () {
            return this.input;
        }
    });

    return Tokenfield;

});
