/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/find/view-tokenfield', [
    'io.ox/find/extensions-tokenfield',
    'io.ox/core/extensions',
    'settings!io.ox/contacts',
    'io.ox/core/tk/tokenfield',
    'io.ox/find/view-token',
    'gettext!io.ox/core'
], function (extensions, ext, settings, Tokenfield, TokenView, gt) {

    'use strict';

    var POINT = 'io.ox/find/tokenfield';

    /**
     * dropdown item: default
     * @id  io.ox/find/tokenfield/item
     */
    ext.point(POINT + '/item').extend({
        index: 100,
        draw: extensions.item
    });

    /**
     * dropdown item: name
     * @id  io.ox/find/tokenfield/name
     */
    ext.point(POINT + '/name').extend({
        index: 100,
        draw: extensions.name
    });

    /**
     * dropdown item: detail
     * @id  io.ox/find/tokenfield/detail
     */
    ext.point(POINT + '/detail').extend({
        index: 100,
        draw: extensions.detail
    });

    /**
     * dropdown item: image
     * @id  io.ox/find/tokenfield/image
     */
    ext.point(POINT + '/image').extend({
        index: 100,
        draw: extensions.image
    });

    /**
     * used when autocomplete item is clicked
     * @id  io.ox/find/tokenfield/handler/click
     */
    ext.point(POINT + '/handler/click').extend({
        index: 'last',
        flow: extensions.click
    });

    /*
     * extension point for a token
     */
    ext.point(POINT + '/token').extend({
        id: 'token',
        index: 100,
        draw: function (model, e) {
            if (!e.attrs.view) {
                e.attrs.view = new TokenView({ model: model, el: e.relatedTarget });
            }
            e.attrs.view.render();
        }
    });

    var TokenfieldExtView = Backbone.View.extend({

        // tokenfield api
        api: $.noop,

        initialize: function (props) {
            // app, win, model references
            _.extend(this, props);

            // shortcuts
            this.ui = {
                container: undefined,
                field: undefined,
                view: undefined
            };
            return this;
        },

        render: function () {
            // replace stub input field with tokenfield
            var app = this.app,
                baton = this.baton,
                fieldstub = baton.app.view.$el.find('.search-field'),
                buttonstub = baton.app.view.$el.find('.action-show'),
                guid = _.uniqueId('form-control-label-'),
                model = baton.model,
                hasFocus = fieldstub.is(':focus') || buttonstub.is(':focus'),
                self = this, query;

            // extend basic tokenfieldview
            this.ui.view = new Tokenfield({
                // hybrid views options
                extPoint: POINT,
                id: guid,
                placeholder: gt('Search') + '...',
                className: 'search-field',
                delayedautoselect: true,
                inputtype: 'search',
                dnd: false,
                // tokenfield options
                hint: false,
                allowEditing: false,
                createTokensOnBlur: false,
                customDefaultModel: true,
                delimiter: '',
                // typeahead options
                maxResults: 20,
                minLength: Math.max(1, settings.get('search/minimumQueryLength', 1)),
                autoselect: true,
                // TODO: would be nice to move to control
                source: app.getSuggestions,
                reduce: function (data) {
                    var manager = model.manager,
                        list = [];
                    // IMPORTANT: add models to collection (but not folder!)
                    // do not change folder facet values here (see bug 42395)
                    manager.update(data, { keep: 'folder' });
                    data = manager.filter(function (facet) {
                        return facet.is('tokenfield') && !facet.is('hidden');
                    });

                    // return values instead of facets
                    _.each(data, function (facet) {
                        list = list.concat(
                            facet.get('values')
                            .filter(function (value) {
                                return !value.isActive();
                            })
                        );
                    });
                    return list;
                },

                suggestion: function (tokendata) {
                    var draw = function (value) {
                        // id used on server
                        var facet = value.get('facet'),
                            facetId = facet.get('data').id;

                        baton.data = {
                            value: value,
                            facet: facet
                        };

                        var individual = ext.point(POINT + '/item/' + facetId);

                        // use special draw handler
                        if (individual.list().length) {
                            // special
                            individual.invoke('draw', this, baton);
                        } else {
                            // default
                            ext.point(POINT + '/item').invoke('draw', this, baton);
                        }
                    };

                    var node = $('<div class="autocomplete-item">'),
                        value = tokendata.model;

                    draw.call(node, value);

                    return node;
                },
                harmonize: function (data) {
                    return _(data).map(function (value) {
                        return {
                            label: value.getDisplayName(),
                            value: value.getDisplayName(),
                            model: value
                        };
                    });
                },
                click: function (e, data) {
                    // apply selected filter
                    var baton = ext.Baton.ensure({
                        // for in8
                        deferred: $.Deferred().resolve(data.model),
                        model: model//,
                        //view: view
                    });
                    // data.model.activate()
                    ext.point(POINT + '/handler/click').invoke('flow', this, baton);
                }
            });
            // some shortcuts
            this.ui.field = this.ui.view.$el;
            this.api = _.bind(this.ui.field.tokenfield, this.ui.field);

            // replace input stub with tokenfield
            query = fieldstub.val();
            fieldstub.replaceWith(this.ui.field);
            // register additional handlers
            this.register();
            // render
            this.ui.view.render();
            //http://sliptree.github.io/bootstrap-tokenfield/#methods
            this.instance = this.ui.field.data('bs.tokenfield');
            // some shortcuts (available after render)
            this.hiddenapi = this.ui.view.hiddenapi;
            this.ui.container = this.ui.field.parent();
            this.ui.tokeninput = this.ui.container.find('.token-input');

            if (hasFocus) this.setFocus();

            // recover state after replace
            if (!!query) {
                // trigger queryChange when query was entered befor loading finshed
                this.app.on('change:state', function (name, state) {
                    if (state !== 'launched') return;
                    self.hiddenapi.input.setInputValue(query, false);
                });
            }

            // update dropdown selection state
            this.ui.tokeninput.on({
                'typeahead:cursorchange typeahead:cursorchanged': _.bind(this.updateSelection, this, 'add'),
                'typeahead:close typeahead:closed': _.bind(this.updateSelection, this, 'remove'),
                'typeahead:select typeahead:selected': _.bind(this.updateSelection, this, 'remove')
            });

            return this;
        },

        retrigger: function (e, data) {
            this.trigger(e.type, e, data);
        },

        reopenDropdown: function () {
            var api = this.hiddenapi;
            if (api.dropdown.isOpen) return;
            if (!this.getQuery()) return;
            // skip internal check if query has changed an fire manually
            api.input.trigger('queryChanged', api.input.query);
        },

        disable: function () {
            this.api('disable');
        },

        enable: function () {
            this.api('enable');
        },

        // register additional handlers
        register: function () {
            var self = this;
            function preventOnCancel(e) {
                if ($(document.activeElement).is('body')) e.preventDefault();
            }
            //retrigger events on view
            this.ui.field.on([
                'tokenfield:initialize',
                'tokenfield:clickedtoken',
                'tokenfield:createtoken',
                'tokenfield:createdtoken',
                'tokenfield:removetoken',
                'tokenfield:removedtoken',
                'aria-live-update'
            ].join(' '), _.bind(this.retrigger, this));
            // listen for tokenfield:events
            this.on({
                // stop creation when cancel button is clicked while dropdown is open
                'tokenfield:createtoken': preventOnCancel,
                // show placeholder only when search box is empty
                'tokenfield:createdtoken tokenfield:removedtoken': _.bind(this.setPlaceholder, this),
                // try to contract each time a token is removed
                'tokenfield:removedtoken': _.bind(this.removedToken, this),
                'aria-live-update': _.bind(this.updateAriaLive, this)
            });
            // list for custom typeahead events
            this.ui.view.on({
                'typeahead-custom:dropdown-rendered': _.bind(this.restoreSelection, this)
            });
            // main view events
            this.app.view.on({
                'focusin': _.bind(self.reopenDropdown, self)
            });
            // app events
            this.app.on({
                'view:disable': _.bind(self.disable, self),
                'view:enable': _.bind(self.enable, self)
            });
        },

        updateAriaLive: function (e, message) {
            $('.io-ox-find .arialive').text(message);
        },

        updateSelection: function (action, e, item) {
            if (action !== 'add' || !item) {
                return (this.ui.selected = undefined);
            }
            this.ui.selected = item.model.get('id');
        },

        // used when search string changes and item from dropdown is selcted
        restoreSelection: function () {
            if (!this.ui.selected) return;
            var node = $('.tt-suggestion> [data-id="' + this.ui.selected + '"]');
            if (!node.length) {
                return (this.ui.selected = undefined);
            }
            node.parent().addClass('tt-cursor');
        },

        removedToken: function (e) {
            _([].concat(e.attrs)).each(function (el) {
                el.model.deactivate();
            });
            this.setFocus();
        },

        getField: function () {
            return this.ui.field;
        },

        getQuery: function () {
            return this.ui.tokeninput.val().trim();
        },

        isEmpty: function () {
            // get active facets and filter the mandatory
            var active = this.model.manager.getActive(),
                nonmandatory = _.filter(active, function (facet) { return !facet.is('mandatory'); });

            // TODO: empty check also for not yet tokenized input (data loss?!)
            return !nonmandatory.length && this.api('getTokens').length === 0 && this.getQuery() === '';
        },

        empty: function () {
            var self = this;
            var tokens = this.api('getTokens');
            _.each(tokens, function (token) {
                self.ui.field.trigger(
                    $.Event('tokenfield:removetoken', { attrs: token })
                );
            });
            // params: add, triggerChange
            this.api('setTokens', [], false, false);
            _.each(tokens, function (token) {
                self.ui.field.trigger(
                    $.Event('tokenfield:removedtoken', { attrs: token })
                );
            });
        },

        reset: function () {
            // reset input/tokenfield
            this.hiddenapi.setVal('');
            // remove all tokens
            this.empty();
            this.setPlaceholder();
            // tokenfield manually sets width -  has to be removed here
            this.ui.tokeninput.css('width', 'auto');
        },

        setFocus: function () {
            this.ui.tokeninput.focus();
        },

        // show input placeholder only on empty tokenfield
        setPlaceholder: function () {
            this.ui.container
                .find('input.tt-input')
                .attr({
                    placeholder: this.isEmpty() ? this.ui.view.options.placeholder || '' : ''
                });
        }

    });

    return TokenfieldExtView;

});
