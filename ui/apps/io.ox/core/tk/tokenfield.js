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

    var Tokenfield = Typeahead.extend({

        className: 'test',

        events: {
            'dispose': 'dispose'
        },

        initialize: function (options) {
            var self = this;

            options.stringify = function (data) {
                return {
                    value: data.data[data.field],
                    label: data.display_name || '',
                    data: data
                };
            };

            // call super constructor
            Typeahead.prototype.initialize.call(this, options);

            // initialize participant collection
            this.collection = new pModel.Participants();

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
            this.$el.tokenfield('destroy');
        },

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
                        var data;
                        if (e.attrs.data) {
                            data = self.fixParticipantType(e.attrs.data);
                        } else {
                            // add extrenal participant
                            data = {
                                type: 5,
                                display_name: e.attrs.label,
                                email1: e.attrs.value
                            };
                        }
                        data.token = {
                            label: e.attrs.label,
                            value: e.attrs.value
                        };
                        // add model to the collection and save cid to the token
                        model = new pModel.Participant(data);
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
                            contactsAPI.pictureHalo($('<div class="contact-image">'), _.extend(model.toJSON(), { width: 16, height: 16, scaleType: 'contain' }))
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

            if (o.lazyload) {
                // get original input element to get the typeahead dataset
                this.input.data('ttTypeahead').dropdown.onAsync('datasetRendered', function () {
                    $(o.lazyload, this.$menu).lazyload({
                        container: this.$menu
                    });
                });
            }

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
        },

        fixParticipantType: function (obj) {
            switch (obj.type) {
            case 'user':
            case 1:
                obj.data.type = 1;
                break;
            case 'group':
            case 2:
                obj.data.type = 2;
                break;
            case 'resource':
            case 3:
                obj.data.type = 3;
                break;
            case 4:
                obj.data.type = 4;
                break;
            case 'contact':
            case 5:
                //only change if no type is there or type 5 will be made to type 1 on the second run
                if (!obj.data.type) {
                    obj.data.external = true;
                    if (obj.data.internal_userid && obj.data.email1 === obj.email) {
                        obj.data.type = 1; //user
                        obj.data.external = false;
                    } else if (obj.data.mark_as_distributionlist) {
                        obj.data.type = 6; //distlistunsergroup
                    } else {
                        obj.data.type = 5;
                        // h4ck
                        obj.data.email1 = obj.email;
                        //uses emailparam as flag, to support adding users with their 2nd/3rd emailaddress
                        obj.data.emailparam = obj.email;
                    }
                }
                break;
            }
            return obj.data;
        }
    });

    return Tokenfield;

});
