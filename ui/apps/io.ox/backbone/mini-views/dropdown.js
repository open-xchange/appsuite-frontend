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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/mini-views/dropdown', ['io.ox/backbone/mini-views/abstract'], function (AbstractView) {

    'use strict';

    // Bootstrap dropdown

    var Dropdown = AbstractView.extend({

        tagName: 'div',
        className: 'dropdown',

        onClick: function (e) {
            e.preventDefault();
            var node = $(e.currentTarget),
                name = node.attr('data-name'),
                value = node.data('value'),
                toggle = node.data('toggle');
            if (value === undefined) return; // ignore plain links
            this.model.set(name, toggle === true ? !this.model.get(name) : value);
        },

        setup: function (options) {
            this.label = options.label;
            this.labelNode = options.labelNode;
            this.$ul = $('<ul class="dropdown-menu" role="menu">');
            this.$ul.on('click', 'a', this.onClick.bind(this));
            this.listenTo(this.model, 'change', this.update);
        },

        update: function () {
            var $ul = this.$ul;
            _(this.model.changed).each(function (value, name) {
                var li = $ul.find('[data-name="' + name + '"]');
                li.children('i').attr('class', 'fa fa-fw fa-none');
                li.filter('[data-value="' + value + '"]').children('i').attr('class', 'fa fa-fw fa-check');
            }, this);
        },

        option: function (name, value, text) {
            this.$ul.append(
                $('<li>').append(
                    $('<a>', { href: '#', 'data-name': name, 'data-value': value, 'data-toggle': _.isBoolean(value) }).append(
                        $('<i class="fa fa-fw">').addClass(this.model.get(name) === value ? 'fa-check' : 'fa-none'),
                        $('<span>').text(text)
                    )
                )
            );
            return this;
        },

        link: function (name, text, callback) {
            this.$ul.append(
                $('<li>').append(
                    $('<a href="#">', { href: '#', 'data-name': name })
                    .text(text).on('click', callback)
                )
            );
            return this;
        },

        header: function (text) {
            this.$ul.append($('<li class="dropdown-header">').text(text));
            return this;
        },

        divider: function () {
            this.$ul.append('<li class="divider">');
            return this;
        },

        render: function () {
            this.$el.append(
                $('<a href="#" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="1">').append(
                    this.labelNode || $.txt(this.label), this.options.caret ? $('<i class="fa fa-caret-down">') : []
                ),
                this.$ul
            );
            return this;
        }
    });

    return Dropdown;
});
