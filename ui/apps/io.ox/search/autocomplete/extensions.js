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

define('io.ox/search/autocomplete/extensions',[
    'io.ox/core/extensions',
    'io.ox/contacts/api',
    'settings!io.ox/contacts',
    'gettext!io.ox/core',
    'io.ox/core/tk/tokenfield',
    'less!io.ox/search/style',
    'less!io.ox/find/style'
], function (ext, api, settings, gt, Tokenfield) {
    'use strict';

    var POINT = 'io.ox/search/autocomplete';

    return {

        searchfield: function () {
            if (!_.device('smartphone')) return;

            // input group and dropdown
            this.append(
                $('<input type="text">')
                .attr({
                    class: 'form-control search-field',
                    role: 'search',
                    tabindex: 1
                })
            );
        },

        tokenfield: function (baton) {
            var model = baton.model,
                view = baton.app.view,
                row = this.parent(),
                field;

            var tokenview = new Tokenfield({
                extPoint: POINT,
                id: 'search-field-mobile',
                placeholder: gt('Search') + '...',
                className: 'search-field',
                delayedautoselect: true,
                dnd: false,
                // tokenfield options
                hint: false,
                allowEditing: false,
                createTokensOnBlur: false,
                customDefaultModel: true,
                // typeahead options
                maxResults: 20,
                minLength: Math.max(1, settings.get('search/minimumQueryLength', 1)),
                autoselect: true,
                source: baton.app.apiproxy.search,
                reduce: function (data) {
                    return data.list;
                },
                suggestion: function (tokendata) {
                    var node = $('<div class="autocomplete-item">'),
                        model = tokendata.model;

                    baton = ext.Baton.ensure({
                        data: model.get('value')
                    });
                    node.addClass(baton.data.facet);
                    var individual = ext.point(POINT + '/item/' + baton.data.facet);

                    // use special draw handler
                    if (individual.list().length) {
                        // special
                        individual.invoke('draw', node, baton);
                    } else {
                        // default
                        ext.point(POINT + '/item').invoke('draw', node, baton);
                    }
                    return node;
                },
                harmonize: function (data) {
                    var list = [];
                    // workaround to handle it like io.ox/find
                    var ValueModel = Backbone.Model.extend({
                        getDisplayName: function () {
                            var value = this.get('value');
                            return (value.item && value.item.name ? value.item.name : value.name || '\u00A0' );
                        }
                    });

                    _.each(data, function (facet) {
                        // workaround to handle it like io.ox/find
                        facet.hasPersons = function () {
                            return ['contacts', 'contact', 'participant', 'task_participants'].indexOf(this.id) > -1;
                        };

                        _.each(facet.values || [ facet ], function (data) {
                            var value = $.extend({}, data, { facet: facet.id }),
                                valueModel = new ValueModel({
                                    facet: facet,
                                    value: value,
                                    // workaround to handle it like io.ox/find
                                    data: {
                                        value: facet.item
                                    }
                                });
                            // hint: basically this data isn't relevant cause tokens
                            //       are hidden in favor of custom facets
                            list.push({
                                label: valueModel.getDisplayName(),
                                value: value.id,
                                model: valueModel
                            });
                        });
                    });
                    return list;
                },
                click: function (e, data) {
                    // apply selected filter
                    var baton = ext.Baton.ensure({
                            deferred: $.Deferred().resolve(),
                            view: view,
                            model: model,
                            token: {
                                label: data.label,
                                value: data.value,
                                model: data.model
                            }
                        });

                    ext.point(POINT + '/handler/click').invoke('flow', this, baton);
                }
            });

            // use/show tokenfield
            this.find('.search-field').replaceWith(tokenview.$el);
            tokenview.render();
            field = tokenview.input.attr('autofocus', true);

            var updateState = function (e) {
                var node = $('.token-input.tt-input'),
                    container = node.closest('.io-ox-search');
                // no chars entered, no tokens
                if (!node.val()) {
                    container.addClass('empty');
                    $('.tokenfield > .twitter-typeahead').show();
                    return;
                }
                // token exists
                if (e.type === 'tokenfield:createdtoken') {
                    $('.tokenfield > .twitter-typeahead').hide();
                }
                // at least some chars are entered
                container.removeClass('empty');
            };

            // toggle search/clear icon visiblity
            field.on({
                'change input': updateState
            });
            tokenview.$el.on('tokenfield:createdtoken tokenfield:removedtoken', updateState);
            tokenview.$el.on('tokenfield:removedtoken', function (e) {
                var tokenmodel = e.attrs.model,
                    data = tokenmodel.get('facet')._compact || tokenmodel.get('value');
                model.remove(data.facet, data.value || data.id);
            });

            var empty = function (e) {
                if (e) e.preventDefault();
                field.parent().find('.token-input').val('');
                // close dropdown
                field.typeahead('close');

                // empty tokenfield
                var tokens = tokenview.$el.tokenfield('getTokens');
                _.each(tokens, function (token) {
                    tokenview.$el.trigger(
                        $.Event('tokenfield:removetoken', { attrs: token })
                    );
                });
                // params: add, triggerChange
                tokenview.$el.tokenfield('setTokens', [], false, false);
                _.each(tokens, function (token) {
                    tokenview.$el.trigger(
                        $.Event('tokenfield:removedtoken', { attrs: token })
                    );
                });
                updateState();
            };

            baton.model.on('reset', empty);

            // clear action
            row.find('.btn-clear')
                .on('click', empty);

            row.find('.btn-search')
                .on('click', function (e) {
                    e.preventDefault();
                    $('.token-input.tt-input').focus();
                    return false;
                });

            return this;
        },

        styleContainer: function (baton) {
            var value = 'width: 100%;';
            //custom dropdown container?
            if (baton.$.container && baton.$.container.attr('style') !== value) {
                // reset calculated style from autocomplete tk
                baton.$.container.attr('style', value);
            }
        },

        image: function (baton) {

            //disabled
            if (!this.is('.contacts, .contact, .participant, .task_participants')) return;

            var image = api.getFallbackImage();

            // remove default indent
            this.removeClass('indent');

            // construct url
            image = (baton.data.item && baton.data.item.image_url ? baton.data.item.image_url + '&height=42&scaleType=contain' : image)
                .replace(/^https?\:\/\/[^\/]+/i, '')
                .replace(/^\/ajax/, ox.apiRoot);

            // add image node
            this.append(
                $('<div class="image">')
                    .css('background-image', 'url(' + image + ')')
            );
        },

        name: function (baton) {
            var name = (baton.data.item && baton.data.item.name ? baton.data.item.name : baton.data.name) || '\u00A0';

            this
                .data(baton.data)
                .append(
                    //use html for the umlauts
                    $('<div class="name">').text(name)
                );

        },

        detail: function (baton) {
            var detail = baton.data.item && baton.data.item.detail && baton.data.item.detail.length ? baton.data.item.detail : undefined,
                isContact = this.is('.contacts, .contact, .participant, .task_participants');

            // contact
            if (isContact) {
                this.removeClass('indent');
                this.append(
                    $('<div class="detail">').text(detail || '\u00A0')
                );
            } else if (detail) {
                var node = this.find('.name');
                node.append(
                    $('<i>').text('\u00A0' + detail)
                );
            }
        },

        a11y: function () {
            var text = this.find('.name').text() + ' ' +  this.find('.detail').text();
            this.attr({
                'aria-label': text,
                'tabIndex': 1
            });
        },

        select: function (baton) {
            baton.data.deferred.done(function () {
                var value = baton.data.token.model.get('value'),
                    option;
                // exclusive: define used option (type2 default is index 0 of options)
                option = _.find(value.options, function (item) {
                    return item.id === value.id;
                });

                baton.data.model.add(value.facet, value.id, (option || {}).id);
            });
        }
    };
});
