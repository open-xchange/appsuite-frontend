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
    'io.ox/core/extensions',
    'io.ox/core/tk/typeahead',
    'io.ox/participants/model',
    'io.ox/contacts/api',
    'static/3rd.party/bootstrap-tokenfield/js/bootstrap-tokenfield.js',
    'css!3rd.party/bootstrap-tokenfield/css/bootstrap-tokenfield.css',
    'less!io.ox/core/tk/tokenfield',
    'static/3rd.party/jquery-ui.min.js'
], function (ext, Typeahead, pModel, contactAPI) {

    'use strict';

    // http://sliptree.github.io/bootstrap-tokenfield/

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
                // defines tokendata
                harmonize: function (data) {
                    var model = new pModel.Participant(data.data);
                    return {
                        value: model.getTarget(),
                        label: model.getDisplayName(),
                        model: model
                    };
                },
                // autoselect also when enter was hit before dropdown was drawn
                delayedautoselect: false,
                // tokenfield default
                allowEditing: true,
                createTokensOnBlur: true,
                // dnd sort
                dnd: true,
                // token view
                tokenview: undefined,
                // dont't call init function in typeahead view
                init: false,
                extPoint: 'io.ox/core/tk/tokenfield'
            }, options);

            /*
             * extension point for a token
             */
            ext.point(options.extPoint + '/token').extend({
                id: 'token',
                index: 100,
                draw: function (model) {
                    // add contact picture
                    $(this).prepend(
                        contactAPI.pictureHalo(
                            $('<div class="contact-image">'),
                            model.toJSON(),
                            { width: 16, height: 16, scaleType: 'contain' }
                        )
                    );
                }
            });

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
                self.redrawTokens();
            });
        },

        dispose: function () {
            // clean up tokenfield
            this.$el.tokenfield('destroy');
            this.stopListening();
            this.collection = null;
        },

        register: function () {
            var self = this;
            // register custom event when token is clicked
            this.$el.tokenfield().parent().delegate('.token', 'click mousedown', function (e) {
                // create new event set attrs property like it's used in the non-custom events
                var evt = $.extend(true, {}, e, {
                    type: 'tokenfield:clickedtoken',
                    attrs:  $(e.currentTarget).data().attrs,
                    originalEvent: e
                });
                self.$el.tokenfield().trigger(evt);
            });

            // delayed autoselect
            if (this.options.delayedautoselect) {
                // use hash to 'connect' enter click and query string
                self.autoselect = {};
                self.model.on('change:query', function (model, query) {
                    // trigger delayed enter click after dropdown was drawn
                    if (self.autoselect[query]) {
                        // trigger enter key press event
                        self.input.trigger(
                            $.Event( 'keydown', { keyCode: 13, which: 13 } )
                        );
                        // remove from hash
                        delete self.autoselect[query];
                    }

                });
            }

            this.$el.tokenfield().on({
                'tokenfield:createtoken': function (e) {
                    if (self.redrawLock) return;
                    // preventDefault to supress creating incomplete token
                    if (self.options.autoselect && !e.attrs.model) {
                        e.preventDefault();
                        return false;
                    }

                    // edit
                    var inputData = self.getInput().data();
                    if (inputData.edit === true) {
                        // edit mode
                        var newAttrs = /^"(.*?)"\s*(<\s*(.*?)\s*>)?$/.exec(e.attrs.value);
                        if (_.isArray(newAttrs)) {
                            e.attrs.label = newAttrs[1];
                        } else {
                            newAttrs = ['', e.attrs.value, '', e.attrs.value];
                        }
                        // save new token data to model
                        e.attrs.model = inputData.editModel.set('token', {
                            label: newAttrs[1],
                            value: newAttrs[3]
                        });
                        // save cid to token value
                        e.attrs.value = e.attrs.model.cid;
                        return;
                    }

                    // create model for unknown participants
                    if (!e.attrs.model) {
                        var newAttrs = /^"(.*?)"\s*(<\s*(.*?)\s*>)?$/.exec(e.attrs.value);
                        if (_.isArray(newAttrs)) {
                            e.attrs.label = newAttrs[1];
                            e.attrs.value = newAttrs[3];
                        } else {
                            newAttrs = ['', e.attrs.value, '', e.attrs.value];
                        }
                        // add external participant
                        e.attrs.model = new pModel.Participant({
                            type: 5,
                            display_name: newAttrs[1],
                            email1: newAttrs[3]
                        });
                    }

                    // distribution lists
                    if (e.attrs.model.has('distribution_list')) {
                        var models = _(e.attrs.model.get('distribution_list')).map(function (m) {
                            m.type = 5;
                            var model = new pModel.Participant({
                                type: 5,
                                display_name: m.display_name,
                                email1: m.mail
                            });
                            return model.set('token', {
                                label: m.display_name,
                                value: m.mail
                            }, { silent: true });
                        });
                        self.collection.addUniquely(models);
                        self.redrawTokens();
                        return false;
                    }

                    // create token data
                    e.attrs.model.set('token', {
                        label: e.attrs.label,
                        value: e.attrs.value
                    }, { silent: true });
                    e.attrs.value = e.attrs.model.cid;
                    // add model to the collection and save cid to the token
                    self.collection.addUniquely(e.attrs.model);
                },
                'tokenfield:createdtoken': function (e) {
                    if (e.attrs) {
                        var model = e.attrs.model || self.getModelByCID(e.attrs.value);

                        // a11y: set title
                        $(e.relatedTarget).attr('title', function () {
                            var token = model.get('token'),
                                title = token.label;
                            if (token.label !== token.value) {
                                title = token.label ? token.label + ' <' + token.value + '>' : token.value;
                            }
                            return title;
                        });

                        // customize token
                        ext.point(self.options.extPoint + '/token').invoke('draw', this, model, e);
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
                    _([].concat(e.attrs)).each(function (el) {
                        self.collection.remove(self.getModelByCID(el.value));
                    });
                }
            });
        },

        render: function () {
            var o = this.options,
                self = this;

            this.$el
                .addClass('tokenfield');
            this.$el.tokenfield({
                createTokensOnBlur: o.createTokensOnBlur,
                minLength: o.minLength,
                allowEditing: o.allowEditing,
                typeahead: self.typeaheadOptions
            });

            this.register();

            // save original typeahead input
            this.input =  $(this.$el).data('bs.tokenfield').$input;
            // call typehead render
            Typeahead.prototype.render.call({
                $el: this.input,
                model: this.model,
                options: this.options
            });

            // workaround: register handler for delayed autoselect
            if (this.options.delayedautoselect) {
                this.input.on('keydown', function (e) {
                    var enter = e.which === 13,
                        validquery = !!self.input.val() && self.input.val().length >= o.minLength,
                        runningrequest = self.model.get('query') !== self.input.val();
                    // flag query string when enter was hit before drowdown was drawn
                    if (enter && validquery && runningrequest) {
                        self.autoselect[self.input.val()] = true;
                    }
                });
            }

            this.$el.parent().addClass(this.options.className);

            // init drag 'n' drop sort
            if (this.options.dnd) {
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
            }

            // Remove on cut
            this.$el.closest('div.tokenfield').on('keydown', function (e) {
                if ((e.ctrlKey || e.metaKey) && e.keyCode === 88) {
                    $(this).find('.token.active').each(function () {
                        self.collection.remove($(this).data().attrs.model);
                    });
                    self.redrawTokens();
                }
            });

            return this;
        },

        getModelByCID: function (cid) {
            return this.collection.get({ cid: cid });
        },

        redrawTokens: function () {
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
            this.redrawTokens();
        },

        getInput: function () {
            return this.input;
        },

        setFocus: function () {
            var tokenfield = this.$el.parent();
            tokenfield.find('.token-input').focus();
        }
    });

    return Tokenfield;
});
