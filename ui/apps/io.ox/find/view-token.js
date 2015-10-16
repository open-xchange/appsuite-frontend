/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/find/view-token', [
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/mail/compose/extensions'
], function (Dropdown, mailextensions) {

    'use strict';

    var TokenView = Backbone.View.extend({

        initialize: function () {
            this.ui = {
                label: this.$el.find('.token-label'),
                tokeninput: this.$el.parent().find('.token-input.tt-input'),
                dropdown: $()
            };

            this.api = this.$el.closest('.tokenfield').find('input.tokenfield').data('bs.tokenfield');

            // redraw on option change
            this.listenTo(this.model, 'change:option', _.bind(this.render, this));

            return this;
        },

        render: function () {
            // replace content of token label
            this.ui.label
                .empty()
                .append(
                    this.model.isPerson() ? this.getDropdown() : this.getNameNode()
                );
            if (this.model.isPerson()) {
                this.addImage();
            }
            // TODO: reset calculated width (https://github.com/sliptree/bootstrap-tokenfield/issues/155)
            this.api.update();
            return this;
        },

        getNameNode: function () {
            if (this.model.isPerson()) return $();

            if (!this.model.getNameDetail()) {
                return $.txt(this.model.getName());
            }

            return [
                $('<span class="token-name">').text(this.model.getName()),
                $.txt('\u00A0'),
                $('<span class="token-detail">').text(this.model.getNameDetail())
            ];
        },

        update: function () {
            // adjust position
            var left = this.$el.offset().left;
            this.ui.dropdown.$el.find('.dropdown-menu').css('left', left);
        },

        addImage: function () {
            this.$el.find('.contact-image').remove();
            mailextensions.tokenPicture.call(this.$el, this.model);
        },

        getDropdown: function () {
            if (!this.model.isPerson()) return $();

            if (!this.model.get('options').length) {
                return [
                    $('<span class="token-name">').text(this.model.getDisplayName())
                ];
            }

            var value = this.model,
                ddmodel = new Backbone.Model(),
                dropdown = new Dropdown({
                    model: ddmodel,
                    tagName: 'div',
                    label: function () {
                        return [
                            $('<span class="token-type">').text(value.getTokenType()),
                            $('<i aria-hidden="true" class="fa fa-caret-down">'),
                            $('<span class="token-name">').text(value.getDisplayName())
                        ];
                    }
                });

            this.ui.dropdown = dropdown;

            // ensure (in case option is not set yet)
            ddmodel.set('option', value.getOption().id);

            dropdown.$el.on('show.bs.dropdown', _.bind(this.update, this));

            // activate
            ddmodel.on('change:option', function (model, option) {
                value.activate(option);
            });

            // create dropdown items
            _.each(value.get('options'), function (option) {
                if (option.hidden) return;
                var label = (option.item || option).name;
                dropdown.option('option', option.id, label);
            });

            // dom
            return dropdown.render().$el.addClass('pull-left').attr('data-dropdown', 'view');
        }

    });

    return TokenView;
});
