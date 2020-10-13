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

define('io.ox/core/tk/tokenfield', [
    'io.ox/core/extensions',
    'io.ox/core/tk/typeahead',
    'io.ox/participants/model',
    'io.ox/participants/views',
    'io.ox/contacts/api',
    'io.ox/core/http',
    'io.ox/core/util',
    'io.ox/contacts/util',
    'gettext!io.ox/core',
    'static/3rd.party/bootstrap-tokenfield.js',
    'css!3rd.party/bootstrap-tokenfield/css/bootstrap-tokenfield.css',
    'less!io.ox/core/tk/tokenfield',
    'static/3rd.party/jquery-ui.min.js'
], function (ext, Typeahead, pModel, pViews, contactAPI, http, util, contactsUtil, gt) {

    'use strict';

    // http://sliptree.github.io/bootstrap-tokenfield/

    $.fn.tokenfield.Constructor.prototype.getTokensList = function (delimiter, beautify, active) {
        delimiter = delimiter || this._firstDelimiter;
        beautify = (typeof beautify !== 'undefined' && beautify !== null) ? beautify : this.options.beautify;

        var separator = delimiter + (beautify && delimiter !== ' ' ? ' ' : ''), self = this;
        return $.map(this.getTokens(active), function (token) {
            if (token.model) {
                var displayname = token.model.getDisplayName({ isMail: self.options.isMail }),
                    email = token.model.getEmail ? token.model.getEmail() : undefined;
                // make sure the displayname contains no outer quotes
                return displayname === email ? email : '"' + util.removeQuotes(displayname) + '" <' + email + '>';
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
                // Split at delimiter; ignore delimiters in quotes
                // delimiters are: comma, semi-colon, tab, newline
                tokens = util.getAddresses(tokens);
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
    // totally annoying IE11/Edge Fix (who else could it be) so the dropdown stays open when clicking on the scrollbars
    // see for example https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/15558714/, https://github.com/corejavascript/typeahead.js/issues/166, https://github.com/twitter/typeahead.js/issues/705
    var mouseIsInDropdown = false;

    // needs overwrite because of bug 54034
    $.fn.tokenfield.Constructor.prototype.blur = function (e) {
        if (mouseIsInDropdown) {
            this.$input.focus();
            return;
        }
        this.focused = false;
        this.$wrapper.removeClass('focus');

        if (!this.preventDeactivation && !this.$element.is(document.activeElement)) {
            this.$wrapper.find('.active').removeClass('active').attr({ tabindex: -1, 'aria-selected': false });
            this.$firstActiveToken = null;
        }

        if ((!this.preventCreateTokens && (this.$input.data('edit') && !this.$input.is(document.activeElement))) || this.options.createTokensOnBlur) {
            this.createTokensFromInput(e);
        }

        this.preventDeactivation = false;
        this.preventCreateTokens = false;
    };

    // and another overwrite. This time because of bug 61477
    $.fn.tokenfield.Constructor.prototype.keypress = function (e) {
        // Comma
        if ($.inArray(e.which, this._triggerKeys) !== -1 && this.$input.is(document.activeElement)) {
            var val = this.$input.val(),
                quoting = /^"[^"]*$/.test(val);
            if (quoting) return;
            if (val) {
                // if we are in edit mode, wait for the comma to actually appear in the input field. This way the token is divided correctly.
                if (this.$input.data('edit')) {
                    var self = this;
                    this.$input.one('input', function () {
                        self.createTokensFromInput(e);
                    });
                    return;
                }
                this.createTokensFromInput(e);
            }
            return false;
        }
    };

    var uniqPModel = pModel.Participant.extend({
        setPID: function () {
            uniqPModel.__super__.setPID.call(this);
            // add unique id to pid attr (allows duplicates)
            this.set('pid', this.get('pid') + '_' + _.uniqueId(), { silent: true });
        }
    });

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
                    return _(data).map(function (m) {
                        var model = new uniqPModel(m);
                        return {
                            value: model.getTarget({ fallback: true }),
                            // fallback when firstname and lastname are empty strings
                            label: model.getDisplayName({ isMail: options.isMail }).trim() || model.getEmail(),
                            model: model
                        };
                    });
                },
                // autoselect also when enter was hit before dropdown was drawn
                delayedautoselect: false,
                // tokenfield default
                allowEditing: true,
                createTokensOnBlur: true,
                // dnd sort
                dnd: true,
                // no html by default
                html: false,
                // dont't call init function in typeahead view
                init: false,
                // activate to prevent creation of an participant model in tokenfield:create handler
                customDefaultModel: false,
                extPoint: 'io.ox/core/tk/tokenfield',
                leftAligned: false
            }, options);

            /*
             * extension point for a token
             */

            ext.point(options.extPoint + '/token').extend({
                id: 'token',
                index: 100,
                draw: function (/*model, e, input*/) {
                    // disabled contact pictures in tokens with 7.10
                    // Keeping this point for potential customising
                    // add contact picture
                    /*$(this).prepend(
                        contactAPI.pictureHalo(
                            $('<div class="contact-image" aria-hidden="true">'),
                            model.toJSON(),
                            { width: 16, height: 16, scaleType: 'contain', lazyload: true }
                        )
                    );
                    // when we append the contact picture, the token gets wider, this pushes the input to the next line. To prevent that we update the width of the input field
                    input.trigger('updateWidth');
                    */
                }
            });


            ext.point(options.extPoint + '/autoCompleteItem').extend({
                id: 'view',
                index: 100,
                draw: function (data) {
                    var pview = new pViews.ParticipantEntryView({
                        model: data.model,
                        closeButton: false,
                        halo: false,
                        isMail: options.isMail
                    });
                    this.append(pview.render().$el);
                }
            });

            ext.point(options.extPoint + '/tokenfield/customize').invoke('customize', this, options);

            // call super constructor
            Typeahead.prototype.initialize.call(this, options);
            var Participants = Backbone.Collection.extend({
                model: uniqPModel
            });

            // initialize collection
            this.collection = options.collection || new Participants();

            // update comparator function
            this.collection.comparator = function (model) {
                return model.index || null;
            };

            // lock for redraw action
            this.redrawLock = false;

            // 100 to be not perceivable for the user (see bugs 49951, 50412)
            this.listenTo(this.collection, 'reset change:display_name', _.throttle(self.redrawTokens.bind(self), 100));
        },

        dispose: function () {
            // clean up tokenfield
            this.$el.tokenfield('destroy');
            this.stopListening();
            this.collection = null;
            this.api = null;
        },

        register: function () {
            var self = this;
            // register custom event when token is clicked
            this.$el.tokenfield().parent().on('click mousedown', '.token', function (e) {
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
                            $.Event('keydown', { keyCode: 13, which: 13 })
                        );
                        // remove from hash
                        delete self.autoselect[query];
                    }

                });
            }

            // aria live: reset message
            var tokenfield = this.$el.parent();
            tokenfield.find('.token-input').on('typeahead:close typeahead:closed', function () {
                self.$el.trigger('aria-live-update', '');
            });
            // aria live: set message
            this.on('typeahead-custom:dropdown-rendered', function (dropdown) {
                var numberOfResults = dropdown.find('.tt-suggestions').children().length,
                    message;

                if (numberOfResults === 0) message = gt('No autocomplete entries found');
                if (!message) {
                    message = gt.format(
                        //#. %1$d is the number of search results in the autocomplete field
                        //#, c-format
                        gt.ngettext('One autocomplete entry found', '%1$d autocomplete entries found', numberOfResults),
                        numberOfResults
                    );
                }

                self.$el.trigger('aria-live-update', message);
            });

            this.$el.tokenfield().on({
                'tokenfield:createtoken': function (e) {
                    if (self.redrawLock) return;
                    // prevent creation of default model
                    if (self.options.customDefaultModel && !e.attrs.model) {
                        e.preventDefault();
                        return false;
                    }

                    // edit
                    var inputData = self.getInput().data(),
                        newAttrs;
                    if (inputData.edit === true) {
                        // edit mode
                        newAttrs = /^"(.*?)"\s*(<\s*(.*?)\s*>)?$/.exec(e.attrs.value);
                        if (_.isArray(newAttrs)) {
                            // this is a mail address
                            e.attrs.label = util.removeQuotes(newAttrs[1]);
                        } else {
                            newAttrs = ['', e.attrs.value, '', e.attrs.value];
                        }
                        /**
                         * TODO: review
                         * model values aren't updated so consumers
                         * have to use lable/value not the model
                         * wouldn't it be more robust we create a new model instead
                         */
                        // save new token data to model
                        e.attrs.model = inputData.editModel.set('token', {
                            label: newAttrs[1],
                            value: newAttrs[3]
                        });
                        // save cid to token value
                        e.attrs.value = e.attrs.model.cid;
                        // stop edit mode (see bug 47182)
                        inputData.edit = false;
                        return;
                    }

                    // if we dont have a model already, check if the topmost suggestion fits to our current input
                    var topSuggestion = self.hiddenapi.dropdown.getDatumForTopSuggestion();
                    if (!e.attrs.model && topSuggestion && e.attrs.value === topSuggestion.value && topSuggestion.raw && topSuggestion.raw.model) {
                        e.attrs.model = topSuggestion.raw.model;
                        e.attrs.label = e.attrs.model.getDisplayName({ isMail: self.options.isMail });
                    }

                    // create model for unknown participants
                    if (!e.attrs.model) {
                        newAttrs = /^"(.*?)"\s*(<\s*(.*?)\s*>)?$/.exec(e.attrs.value);
                        if (_.isArray(newAttrs)) {
                            // this is a mail address
                            e.attrs.label = util.removeQuotes(newAttrs[1]);
                            e.attrs.value = newAttrs[3];
                        } else {
                            newAttrs = ['', e.attrs.value, '', e.attrs.value];
                        }
                        // add external participant
                        e.attrs.model = new uniqPModel({
                            type: 5,
                            display_name: newAttrs[1],
                            email1: newAttrs[3]
                        });
                    }

                    // distribution lists
                    if (e.attrs.model.has('distribution_list')) {
                        // create a model/token for every member with an email address
                        // bundle and delay the pModel fetch calls
                        http.pause();

                        contactsUtil.validateDistributionList(e.attrs.model.get('distribution_list'));

                        var models = _.chain(e.attrs.model.get('distribution_list'))
                            .filter(function (m) {
                                return !!m.mail;
                            })
                            .map(function (m) {
                                m.type = 5;
                                var model = new uniqPModel({
                                    type: 5,
                                    display_name: m.display_name,
                                    email1: m.mail
                                });
                                return model.set('token', {
                                    label: m.display_name,
                                    value: m.mail
                                }, { silent: true });
                            })
                            .value();

                        var name = e.attrs.model.get('display_name'),
                            members  = _(models).map(function (m) { return [m.get('token').label + ', ' + m.get('token').value]; });

                        self.$el.trigger('aria-live-update',
                            members.length === 1 ?
                                gt('Added distribution list %s with %s member. The only member of the distribution list is %s.', name, members.length, members.join(', ')) :
                                gt('Added distribution list %s with %s members. Members of the distribution list are %s.', name, members.length, members.join(', '))
                        );

                        self.collection.add(models);
                        self.redrawTokens();
                        // clean input
                        self.input.data('ttTypeahead').input.$input.val('');

                        http.resume();
                        return false;
                    }

                    // create token data
                    e.attrs.model.set('token', {
                        label: e.attrs.label,
                        value: e.attrs.value
                    }, { silent: true });
                    e.attrs.value = e.attrs.model.cid;
                    var message;
                    if (e.attrs.model.get('display_name')) {
                        if (e.attrs.model.value && e.attrs.model.value !== e.attrs.model.get('display_name')) {
                            //#. %1$s is the display name of an added user or mail recipient
                            //#. %2$s is the email address of the user or mail recipient
                            message = gt('Added %1$s, %2$s.', e.attrs.model.get('display_name'), e.attrs.model.value);
                        } else {
                            //#. %1$s is the display name of an added user or mail recipient
                            message = gt('Added %1$s.', e.attrs.model.get('display_name'));
                        }
                    } else if (e.attrs.model.get('name') && e.attrs.model.get('detail')) {
                        //#. %1$s is the added search query
                        //#. %2$s is the context of the added search query
                        message = gt('Added %1$s, %2$s.', e.attrs.model.get('name'), e.attrs.model.get('detail'));
                    } else if (e.attrs.model.get('name')) {
                        //#. %1$s is the added search query
                        message = gt('Added %1$s.', e.attrs.model.get('name'));
                    }

                    if (message) self.$el.trigger('aria-live-update', message);
                    // add model to the collection and save cid to the token
                    self.collection.add(e.attrs.model);
                },
                'tokenfield:createdtoken': function (e) {
                    if (e.attrs) {
                        var model = e.attrs.model || self.getModelByCID(e.attrs.value),
                            node = $(e.relatedTarget),
                            label = node.find('.token-label'),
                            token = model.get('token'),
                            hasLabel = token.label && token.label !== token.value,
                            title = hasLabel ? token.label + ' ' + token.value : token.value;

                        // remove wrongly calculated max-width
                        if (label.css('max-width') === '0px') label.css('max-width', 'none');

                        // mouse hover tooltip / a11y title
                        label.attr({ 'aria-hidden': true, 'title': title });
                        //#. Variable will be an contact or email address in a tokenfield. Text is used for screenreaders to provide a hint how to delete the token
                        node.attr('aria-label', gt('%1$s. Press backspace to delete.', title));

                        // customize token
                        ext.point(self.options.extPoint + '/token').invoke('draw', e.relatedTarget, model, e, self.getInput());
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
                            // token.label might have quotes, so we need to clean up again
                            e.attrs.value = token.label ? '"' + util.removeQuotes(token.label) + '" <' + token.value + '>' : token.value;
                        }
                        self.getInput().one('blur', function () {
                            // see if there is a token with the cid
                            var tokens = self.$el.parent().find('.token'),
                                cid = self.getInput().data().editModel.cid,
                                found = false;
                            for (var i = 0; i < tokens.length; i++) {
                                if ($(tokens[i]).data('attrs').value === cid) {
                                    found = true;
                                    return;
                                }
                            }
                            // user tries to remove token by clearing the token in editmode
                            // token was removed but it's still in the collection, so we need to remove it correctly
                            if (!found) {
                                self.collection.remove(self.getModelByCID(cid));
                            }
                        });
                    }
                },
                'tokenfield:removetoken': function (e) {
                    _([].concat(e.attrs)).each(function (el) {
                        var model = self.getModelByCID(el.value);
                        if (!model) return;

                        var message;
                        if (model.get('display_name')) {
                            if (model.value && model.value !== model.get('display_name')) {
                                //#. %1$s is the display name of a removed user or mail recipient
                                //#. %2$s is the email address of the user or mail recipient
                                message = gt('Removed %1$s, %2$s.', model.get('display_name'), model.value);
                            } else {
                                //#. %1$s is the display name of a removed user or mail recipient
                                message = gt('Removed %1$s.', model.get('display_name'));
                            }
                        } else if (model.get('name') && model.get('detail')) {
                            //#. %1$s is the removed search query
                            //#. %2$s is the context of the removed search query
                            message = gt('Removed %1$s, %2$s.', model.get('name'), model.get('detail'));
                        } else if (model.get('name')) {
                            //#. %1$s is the removed search query
                            message = gt('Removed %1$s.', model.get('name'));
                        }

                        if (message) self.$el.trigger('aria-live-update', message);

                        self.collection.remove(model);
                    });
                }
            });
        },

        render: function () {

            var o = this.options, self = this;

            this.$el
                .addClass('tokenfield')
                .tokenfield({
                    createTokensOnBlur: o.createTokensOnBlur,
                    minLength: o.minLength,
                    delimiter: _.isUndefined(o.delimiter) ? undefined : o.delimiter,
                    allowEditing: o.allowEditing,
                    typeahead: self.typeaheadOptions,
                    html: this.options.html || false,
                    inputType: this.options.inputtype || 'email',
                    isMail: o.isMail,
                    minWidth: 0
                });

            this.register();

            // save original typeahead input
            this.input = $(this.$el).data('bs.tokenfield').$input;
            // call typehead render
            Typeahead.prototype.render.call({
                $el: this.input,
                model: this.model,
                options: this.options
            });

            // add non-public api;
            this.hiddenapi = this.input.data('ttTypeahead');

            // debug: force dropdown to stay open
            // this.hiddenapi.dropdown.close = $.noop;
            // this.hiddenapi.dropdown.empty = $.noop;

            var dropdown = _.extend(this.hiddenapi.dropdown, {
                onDropdownMouseEnter: function () {
                    mouseIsInDropdown = true;
                },
                onDropdownMouseLeave: function () {
                    mouseIsInDropdown = false;
                }
            });

            if (_.browser.IE || _.browser.Edge < 79) {

                this.input.off('blur.tt').on('blur.tt', function () {
                    if (mouseIsInDropdown) return;
                    this.resetInputValue();
                    this.trigger('blurred');
                }.bind(this.hiddenapi.input));

                dropdown.$menu
                    .on('mouseenter.tt', dropdown.onDropdownMouseEnter.bind(dropdown))
                    .on('mouseleave.tt', dropdown.onDropdownMouseLeave.bind(dropdown));
            }

            // calculate position for typeahead dropdown (tt-dropdown-menu)
            if (_.device('smartphone') || o.leftAligned) {
                // non-public api of typeahead
                this.hiddenapi.dropdown._show = function () {
                    var width = 'auto', left = 0;
                    if (_.device('smartphone')) {
                        left = self.input.offset().left * -1;
                        width = window.innerWidth;
                    } else if (o.leftAligned) {
                        left = self.input.position().left;
                        left = Math.round(left) * -1 + 17;
                    }
                    this.$menu.css({ left: left, width: width }).show();
                };
            }

            // custom callback function
            this.hiddenapi.input._callbacks.enterKeyed.sync[0] = function onEnterKeyed(type, $e) {
                var cursorDatum = this.dropdown.getDatumForCursor(),
                    topSuggestionDatum = this.dropdown.getDatumForTopSuggestion(),
                    hint = this.input.getHint();

                // if the hint is not empty the user is just hovering over the cursorDatum and has not really selected it. Use topSuggestion (the hint value) instead.See Bug 48542
                if (cursorDatum && _.isEmpty(hint)) {
                    this._select(cursorDatum);
                    $e.preventDefault();
                } else if (this.autoselect && topSuggestionDatum) {
                    this._select(topSuggestionDatum);
                    $e.preventDefault();
                }
            }.bind(this.hiddenapi);

            // workaround: select suggestion by space key
            this.hiddenapi.input.$input.on('keydown', function (e) {
                var isSuggestionSelected = !!this.hiddenapi.dropdown.getDatumForCursor();
                if (e.which !== 32 || !isSuggestionSelected) return;
                this.hiddenapi._onEnterKeyed('ox.spaceKeyed', e);
            }.bind(this));

            // workaround: register handler for delayed autoselect
            if (this.options.delayedautoselect) {
                this.input.on('keydown', function (e) {
                    var enter = e.which === 13,
                        space = e.which === 32,
                        validquery = !!self.input.val() && self.input.val().length >= o.minLength,
                        runningrequest = self.model.get('query') !== self.input.val(),
                        automated = e.which === 38 || e.which === 40;
                    // clear dropdown when query changes
                    if (runningrequest && !enter && !space && !automated) {
                        self.hiddenapi.dropdown.empty();
                        self.hiddenapi.dropdown.close();
                    }
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
                    tolerance: 'pointer',
                    forcePlaceholderSize: true,
                    // update: _.bind(this.resort, this),
                    stop: function (e, ui) {
                        if (this.isMultisort) {
                            ui.item.after($(this).find('.active'));
                        }
                        self.resort();
                    },
                    start: function (e, ui) {
                        // check for multisort
                        if (ui.item.hasClass('active') && $(this).find('.active').length > 1) {
                            // hide active tokens that are not dragged
                            _($(this).find('.active')).each(function (item) {
                                if (item !== ui.item[0]) {
                                    $(item).hide();
                                }
                            });

                            ui.item.append($('<span class="drag-counter badge">').text($(this).find('.active').length));
                            // save data
                            this.isMultisort = true;
                            this.multisortData = _($(this).find('.active')).map(function (item) {
                                return $(item).data().attrs.model;
                            });
                        } else {
                            this.isMultisort = false;
                            this.multisortData = [];
                        }
                    },
                    receive: function (e, ui) {
                        var tokenData = ui.sender[0].isMultisort ? ui.sender[0].multisortData : ui.item.data().attrs.model;
                        self.collection.add(tokenData);
                        self.resort();
                    },
                    remove: function (e, ui) {
                        var tokenData = this.isMultisort ? this.multisortData : ui.item.data().attrs.model;
                        self.collection.remove(tokenData);
                        self.resort();
                    }
                }).droppable({
                    hoverClass: 'drophover'
                });
            }

            this.$el.closest('div.tokenfield').on('copy', function (e) {
                // value might contain more than one id so split
                var values = e.target.value.split(', ');

                // copy actual email adress instead of model cid to clipboard
                var result = '';
                _(values).each(function (value) {
                    var model = self.collection.get(value);
                    if (model) {
                        result = result + (result === '' ? '' : ', ') + model.value;
                    }
                });

                if (result !== '') {
                    e.originalEvent.clipboardData.setData('text/plain', result);
                    e.preventDefault();
                }
            });

            this.getInput().on('focus blur updateWidth', function (e) {
                var tokenfield = self.$el.data('bs.tokenfield');
                // tokenfield minwidth 320 caused height calculation to be broken as soon
                // as there is less than 320 pixel space left in the search field
                tokenfield.options.minWidth = e.type === 'focus' ? 1 : 0;
                tokenfield.update();
            });

            return this;
        },

        getModelByCID: function (cid) {
            return this.collection.get({ cid: cid });
        },

        redrawTokens: function () {
            var tokens = [], self = this;
            this.redrawLock = true;
            this.collection.each(function (model) {
                tokens.push({
                    label: model.getDisplayName({ isMail: self.options.isMail }),
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
                if (col.get({ cid: token.value })) {
                    col.get({ cid: token.value }).index = index;
                }
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
