/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
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
                guid = _.uniqueId('form-control-label-'),
                model = baton.model,
                hasFocus = fieldstub.is(':focus'),
                query = fieldstub.val();

            // extend basic tokenfieldview
            this.ui.view = new Tokenfield({
                // hybrid views options
                extPoint: POINT,
                id: guid,
                placeholder: gt('Search') + '...',
                className: 'search-field',
                delayedautoselect: true,
                dnd: false,
                // tokenfield options
                hint: false,
                allowEditing: false,
                createTokensOnBlur: false,
                // typeahead options
                maxResults: 20,
                minLength: Math.max(1, settings.get('search/minimumQueryLength', 1)),
                autoselect: true,
                // TODO: would be nice to move to control
                source: app.getSuggestions,
                reduce: function (data) {
                    var manager = model.manager,
                        list = [];
                    // IMPORTANT: add models to collection
                    manager.update(data);
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
                        if (individual.list().length) {
                            // special
                            individual.invoke('draw', this, baton);
                        } else {
                            // default
                            ext.point(POINT + '/item').invoke('draw', this, baton);
                        }
                    };

                    var node = $('<div class="autocomplete-item">'),
                        value = tokendata.model,
                        facet = value.get('facet');

                    var regular;

                    regular = !facet.isType('simple') && !!facet.getName();

                    draw.call(node, value);

                    return node;
                },
                harmonize: function (value) {
                    return {
                        label: value.getDisplayName(),
                        value: value.isPerson() ? value.getNameDetail() || value.getDisplayName() : value.getDisplayName(),
                        model: value
                    };
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
            fieldstub.replaceWith(this.ui.field);
            // register additional handlers
            this.register();
            // render
            this.ui.view.render();
            //http://sliptree.github.io/bootstrap-tokenfield/#methods
            this.instance = this.ui.field.data('bs.tokenfield');
            // some shortcuts (available after render)
            this.ui.container = this.ui.field.parent();

            // recover state after replace
            this.ui.container.find('.token-input').val(query);
            if (hasFocus) this.setFocus();
            return this;
        },

        retrigger: function (e) {
            this.trigger(e.type, e);
        },

        // register additional handlers
        register: function () {
            function preventOnCancel (e) {
                if ($(document.activeElement).is('body')) e.preventDefault();
            }

            //retrigger events on view
            this.ui.field.on([
                'tokenfield:initialize',
                'tokenfield:clickedtoken',
                'tokenfield:createtoken',
                'tokenfield:createdtoken',
                'tokenfield:removetoken',
                'tokenfield:removedtoken'
                ].join(' '), _.bind(this.retrigger, this));

            //
            this.on({
                // stop creation when cancel button is clicked while dropdown is open
                'tokenfield:createtoken': preventOnCancel,
                // show placeholder only when search box is empty
                'tokenfield:createdtoken tokenfield:removedtoken': _.bind(this.setPlaceholder, this),
                // try to contract each time a token is removed
                'tokenfield:removedtoken': _.bind(this.removedToken, this)
            });

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

        isEmpty: function () {
            var none = !this.model.manager.getActive().length;
            // TODO: empty check also for not yet tokenized input (data loss?!)
            return none && this.api('getTokens').length === 0 && this.ui.container.find('.token-input').val().trim() === '';
        },

        reset: function () {
            this.ui.container.find('.token-input').val('');
            this.api('setTokens', []);
            this.setPlaceholder();
            // tokenfield manually sets width -  has to be removed here
            this.ui.container.find('.token-input').css('width', 'auto');
        },

        setFocus: function () {
            this.ui.container.find('.token-input').focus();
        },

        // show input placeholder only on empty tokenfield
        setPlaceholder: function () {
            this.ui.container
                .find('input.tt-input')
                .attr({
                    placeholder: this.isEmpty() ? this.ui.view.options.placeholder || '' : ''
                });
        }

    });

    return TokenfieldExtView;

});
