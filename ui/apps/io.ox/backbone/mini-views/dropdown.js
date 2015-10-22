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
                toggleValue = node.data('togglevalue'),
                toggle = node.data('toggle'),
                keep = this.options.keep || node.attr('data-keep-open') === 'true';
            // keep drop-down open?
            if (keep) e.stopPropagation();
            // ignore plain links
            if (value === undefined) return;
            if (this.model) {
                var nextValue = value;
                if (toggle) {
                    if (toggleValue = undefined) {
                        // boolean toggle
                        nextValue = !this.model.get(name);
                    } else {
                        // alternate between 2 non boolean values
                        nextValue = this.model.get(name) === value ? toggleValue : value;
                    }
                }
                this.model.set(name, nextValue);
            }
        },

        setup: function () {
            this.$ul = $('<ul class="dropdown-menu" role="menu">');
            // not so nice but we need this for mobile support
            this.$ul.on('click', 'a', $.proxy(this.onClick, this));
            if (this.model) this.listenTo(this.model, 'change', this.update);
        },

        update: function () {
            var $ul = this.$ul;
            if (!this.model) return;
            _(this.model.changed).each(function (value, name) {
                var li = $ul.find('[data-name="' + name + '"]');
                // clear check marks
                li.children('i').attr('class', 'fa fa-fw fa-none');
                // loop over list items also allow compare non-primitive values
                li.each(function () {
                    var node = $(this);
                    node.filter('[role=menuitemcheckbox][aria-checked]').attr({ 'aria-checked': _.isEqual(node.data('value'), value) });
                    if (_.isEqual(node.data('value'), value)) node.children('i').attr('class', 'fa fa-fw fa-check');
                });
            }, this);
            // update drop-down toggle
            this.label();
        },

        label: function () {
            // extend this class for a custom implementation
        },

        stringify: function (value) {
            return _.isObject(value) ? JSON.stringify(value) : value;
        },

        append: function (fn) {
            this.$ul.append($('<li>').attr({ role: 'presentation' }).append(fn));
            return this;
        },

        option: function (name, value, text, header, toggleValue) {
            var link, currentValue = this.model ? this.model.get(name) : undefined;
            this.append(
                link = $('<a href="#">')
                .attr({
                    role: 'menuitemcheckbox',
                    'aria-checked': _.isEqual(currentValue, value),
                    'data-name': name,
                    'draggable': false,
                    'data-value': this.stringify(value),
                    // you may use toggle with boolean values or provide a toggleValue ('togglevalue' is the option not checked value, 'value' is the option checked value)
                    'data-toggle': _.isBoolean(value) || toggleValue !== undefined,
                    'data-togglevalue': toggleValue,
                    'aria-label': [header, text].join(' ')
                })
                // store original value
                .data('value', value)
                .append(
                    $('<i class="fa fa-fw">')
                        .attr({ 'aria-hidden': true })
                        .addClass(_.isEqual(currentValue, value) ? 'fa-check' : 'fa-none'),
                    _.isFunction(text) ? text() : $('<span>').text(text)
                )
            );
            // in firefox draggable=false is not enough to prevent dragging...
            if ( _.device('firefox') ) {
                link.attr('ondragstart', 'return false;');
            }
            return this;
        },

        link: function (name, text, callback) {
            var link = $('<a href="#" draggable="false">')
                .attr('data-name', name)
                .text(text);
            if (callback) link.on('click', callback);
            // in firefox draggable=false is not enough to prevent dragging...
            if ( _.device('firefox') ) {
                link.attr('ondragstart', 'return false;');
            }
            return this.append( link );
        },

        header: function (text) {
            this.$ul.append($('<li class="dropdown-header" role="sectionhead">').text(text));
            return this;
        },

        divider: function () {
            this.$ul.append('<li class="divider" role="separator">');
            return this;
        },

        render: function () {
            var label = _.isFunction(this.options.label) ? this.options.label() : (_.isObject(this.options.label) ? this.options.label : $.txt(this.options.label)),
                ariaLabel = this.options.aria ? this.options.aria : null,
                toggle;
            if (_.isString(label)) {
                ariaLabel += (' ' + label);
            }
            this.$el.append(
                toggle = $('<a>').attr({
                    href: '#',
                    tabindex: 1,
                    draggable: false,
                    role: 'menuitem',
                    'aria-haspopup': true,
                    'aria-label': ariaLabel,
                    'data-toggle': 'dropdown'
                })
                .append(
                    // label
                    $('<span class="dropdown-label">').append(
                        label
                    ),
                    // caret
                    this.options.caret ? $('<i aria-hidden="true" class="fa fa-caret-down">') : []
                ),
                this.$ul
            );
            // add title?
            if (this.options.title) toggle.attr('title', this.options.title);
            // use smart drop-down? (fixed positioning)
            if (this.options.smart) toggle.addClass('smart-dropdown');
            // in firefox draggable=false is not enough to prevent dragging...
            if ( _.device('firefox') ) {
                toggle.attr('ondragstart', 'return false;');
            }
            toggle.dropdown();
            // update custom label
            this.label();
            return this;
        }
    });

    return Dropdown;
});
