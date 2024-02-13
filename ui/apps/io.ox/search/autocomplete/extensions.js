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

define('io.ox/search/autocomplete/extensions', [
    'io.ox/core/extensions',
    'io.ox/contacts/api',
    'io.ox/core/util',
    'settings!io.ox/contacts',
    'gettext!io.ox/core',
    'io.ox/core/tk/tokenfield',
    'less!io.ox/search/style',
    'less!io.ox/find/style'
], function (ext, api, util, settings, gt, Tokenfield) {
    'use strict';

    var POINT = 'io.ox/search/autocomplete';

    return {

        searchfield: function () {
            if (!_.device('smartphone')) return;

            // input group and dropdown
            this.append(
                $('<input type="text" class="form-control search-field">')
            );
        },

        tokenfield: function (baton) {
            var model = baton.model,
                view = baton.app.view,
                row = this.parent(),
                ui;

            var tokenview = new Tokenfield({
                extPoint: POINT,
                id: 'search-field-mobile',
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
                    if (individual.list().length) {
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
                            return (value.item && value.item.name ? value.item.name : value.name || '\u00A0');
                        }
                    });

                    _.each(data, function (facet) {
                        // workaround to handle it like io.ox/find
                        facet.hasPersons = function () {
                            return ['contacts', 'contact', 'participant', 'task_participants'].indexOf(this.id) > -1;
                        };

                        _.each(facet.values || [facet], function (data) {
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
            // some shortcuts
            ui = {
                copyhelper: tokenview.$el.data('bs.tokenfield').$copyHelper || $(),
                field: tokenview.input.prop('autofocus', true)
            };

            var updateState = function (e) {
                var node = $('.token-input.tt-input'),
                    container = node.closest('.io-ox-search');
                // no chars entered, no tokens
                if ((!e || e.type === 'input') && !node.val()) {
                    container.addClass('empty');
                    $('.tokenfield > .twitter-typeahead').show();
                    ui.copyhelper.prop('disabled', false);
                    return;
                }
                // token exists
                if (e.type === 'tokenfield:createdtoken') {
                    $('.tokenfield > .twitter-typeahead').hide();
                    ui.copyhelper.prop('disabled', true);
                }
                // at least some chars are entered
                container.removeClass('empty');
            };

            // toggle search/clear icon visiblity
            ui.field.on({
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
                ui.field.parent().find('.token-input').val('');
                // close dropdown
                ui.field.typeahead('close');

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
                .replace(/^https?:\/\/[^/]+/i, '');
            image = util.replacePrefix(image, ox.apiRoot);

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
            var text = this.find('.name').text() + ' ' + this.find('.detail').text();
            this.attr('aria-label', text);
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
