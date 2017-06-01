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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/mini-views/dropdown', ['io.ox/backbone/mini-views/abstract'], function (AbstractView) {

    'use strict';

    function getLabel(value) {
        if (_.isFunction(value)) return value();
        if (_.isObject(value)) return value;
        return $.txt(value);
    }

    // Bootstrap dropdown

    var Dropdown = AbstractView.extend({

        tagName: 'div',
        className: 'dropdown',

        events: {
            'shown.bs.dropdown': 'onShown',
            'hidden.bs.dropdown': 'resetDropdownOverlay',
            'keydown *[data-toggle="dropdown"]': 'onKeyDown',
            'ready': 'onReady'
        },

        onReady: function () {
            if (_.device('smartphone')) return;
            if (this.smart === false && !this.$overlay) return;
            if (!this.$el.hasClass('open')) return;
            this.adjustBounds();
        },

        resetDropdownOverlay: function () {
            if (!this.$overlay) return;
            this.$ul.removeAttr('data-original-id');
            this.$placeholder.before(this.$ul).detach();
            this.$el.removeClass('open');
            this.$ul.attr('style', this.$ul.data('style') || '').removeData('style');
            this.$overlay.remove();
            this.$toggle.attr('aria-expanded', false).focus();
            delete this.$overlay;
        },

        setDropdownOverlay: function () {
            var self = this;

            this.$overlay = $('<div class="smart-dropdown-container dropdown open">')
                .addClass(this.$el.prop('className'))
                .on('ready', this.onReady.bind(this));
            this.$ul.data('style', this.$ul.attr('style'));
            this.adjustBounds();

            this.$ul.attr('data-original-id', this.$placeholder.attr('id'));
            // replaceWith and detach ($.fn.replaceWith is replaceWith and remove)
            this.$ul.before(this.$placeholder).detach();
            $('body').append(
                this.$overlay.append(
                    $('<div class="abs">').on('mousewheel touchmove', false)
                    .on('click', function (e) {
                        e.stopPropagation();
                        self.resetDropdownOverlay();
                        return false;
                    }),
                    this.$ul
                )
            );
        },

        adjustBounds: function () {
            var bounds = this.$ul.get(0).getBoundingClientRect(),
                positions = {
                    top: bounds.top,
                    left: bounds.left,
                    width: bounds.width,
                    height: 'auto'
                },
                offset = this.$toggle.offset(),
                width = this.$toggle.outerWidth(),
                availableWidth = $(window).width(),
                availableHeight = $(window).height(),
                topbar = $('#io-ox-topbar');

            // hides this.$el?
            positions.top = Math.max(positions.top, this.$el.offset().top + this.$el.height());

            // hits bottom ?
            if (bounds.top + bounds.height > availableHeight + this.margin) {
                // left or right?
                if ((offset.left + width + bounds.width + this.margin) < availableWidth) {
                    // enough room on right side
                    positions.left = offset.left + width + this.margin;
                } else {
                    // position of left side
                    positions.left = offset.left - bounds.width - this.margin;
                }

                // move dropdown up
                positions.top = availableHeight - this.margin - bounds.height;
                // don't overlap topbar or banner
                positions.top = Math.max(positions.top, topbar.offset().top + topbar.height() + this.margin);

                // adjust height
                positions.height = Math.min(availableHeight - this.margin - positions.top, positions.height);
            } else {
                // outside viewport?
                positions.left = Math.max(this.margin, positions.left);
                positions.left = Math.min(availableWidth - positions.width - this.margin, positions.left);
            }

            if (this.$toggle.data('fixed')) positions.left = bounds.left;
            this.$ul.css(positions);
        },

        onShown: function () {
            if (this.smart === false) return;
            if (_.device('smartphone')) return;
            this.setDropdownOverlay();
        },

        onKeyDown: function (e) {
            // select first or last item, if already open
            if (!this.$el.hasClass('open') || !this.$overlay) return;
            // special focus handling, because the $ul is no longer a child of the view
            if (e.which === 40) $('a[role^="menuitem"]', this.$ul).first(':visible').focus();
            if (e.which === 38) $('a[role^="menuitem"]', this.$ul).last(':visible').focus();
            // special close handling on ESC
            if (e.which === 27) {
                this.$toggle.trigger('click');
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        },

        onClick: function (e) {
            e.preventDefault();
            var node = $(e.currentTarget),
                name = node.attr('data-name'),
                value = node.data('value'),
                toggleValue = node.data('toggle-value'),
                toggle = node.data('toggle'),
                keep = this.options.keep || node.attr('data-keep-open') === 'true';
            // keep drop-down open?
            if (keep) e.stopPropagation();
            // ignore plain links
            if (node.hasClass('disabled')) return;

            // make sure event bubbles up
            if (!e.isPropagationStopped() && this.$overlay && this.$placeholder && !this.options.noDetach) {
                // to use jquery event bubbling, the element, which triggered the event must have the correct parents
                // therefore, the target element is inserted at the original position before event bubbling
                // the element only remains at that position while the event bubbles
                var $temp = $('<div class="hidden">');
                node.before($temp).detach();
                this.$placeholder.append(node);
                // lazy metrics support
                this.$el.trigger(_.extend({}, e, { type: 'mousedown' }));
                this.$el.trigger(e);
                $temp.replaceWith(node);
            }

            if (value === undefined) return;
            if (this.model) {
                var nextValue = value;
                if (toggle) {
                    if (toggleValue === undefined) {
                        // boolean toggle
                        nextValue = !this.model.get(name);
                    } else {
                        // alternate between 2 non boolean values
                        nextValue = this.model.get(name) === value ? toggleValue : value;
                    }
                }
                if (this.options.saveAsArray) nextValue = [nextValue];
                this.model.set(name, nextValue);
            }
        },

        setup: function () {
            this.$ul = this.options.$ul || $('<ul class="dropdown-menu" role="menu">');
            this.$placeholder = $('<div class="hidden">').attr('id', _.uniqueId('dropdown-placeholder-'));
            this.smart = this.options.smart;
            this.margin = this.options.margin || 8;
            // not so nice but we need this for mobile support
            // if $ul pops out on the overlay, this line is also required
            this.$ul.on('click', 'a', $.proxy(this.onClick, this));

            if (this.model) this.listenTo(this.model, 'change', this.options.update || this.update);
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
            this.$ul.append($('<li role="presentation">').append(fn));
            return this;
        },

        option: function (name, value, text, options) {

            options = _.extend({ prefix: '', toggleValue: undefined, radio: false }, options);

            var currentValue = this.model ? this.model.get(name) : undefined,
                checked = _.isEqual(currentValue, value),
                role = options.radio ? 'menuitemradio' : 'menuitemcheckbox',
                plainText = _.isFunction(text) ? $('<div>').append(text()).text() : text,
                ariaLabel = options.prefix ? [options.prefix, plainText].join(' ') : undefined;

            return this.append(
                $('<a href="#" draggable="false">')
                .attr({
                    'role': role,
                    'aria-checked': checked,
                    'data-name': name,
                    'data-value': this.stringify(value),
                    // you may use toggle with boolean values or provide a toggleValue ('togglevalue' is the option not checked value, 'value' is the option checked value)
                    'data-toggle': _.isBoolean(value) || options.toggleValue !== undefined,
                    'data-toggle-value': options.toggleValue,
                    'aria-label': ariaLabel,
                    'title': options.title
                })
                // in firefox draggable=false is not enough to prevent dragging...
                .on('dragstart', false)
                // store original value
                .data('value', value)
                .append(
                    $('<i class="fa fa-fw" aria-hidden="true">').addClass(checked ? 'fa-check' : 'fa-none'),
                    _.isFunction(text) ? text() : $.txt(text)
                )
            );
        },

        link: function (name, text, callback, options) {
            options = options || {};
            var link = $('<a href="#" draggable="false" role="menuitem">')
                .attr('data-name', name)
                // in firefox draggable=false is not enough to prevent dragging...
                .on('dragstart', false)
                .append(
                    options.icon ? $('<i class="fa fa-fw" aria-hidden="true">') : $(),
                    text
                );
            if (options.data) link.data(options.data);
            if (callback) link.on('click', {}, callback);
            return this.append(link);
        },

        header: function (text) {
            this.$ul.append($('<li class="dropdown-header" role="separator">').text(text));
            return this;
        },

        divider: function () {
            this.$ul.append('<li class="divider" role="separator">');
            return this;
        },

        render: function () {
            var label = getLabel(this.options.label),
                ariaLabel = this.options.aria ? this.options.aria : null;

            if (_.isString(label)) ariaLabel += (' ' + label);
            this.$el.append(
                this.$toggle = this.options.$toggle || $('<a href="#" draggable="false">').attr({
                    'aria-label': ariaLabel,
                    'data-action': this.options.dataAction
                })
                .append(
                    // label
                    $('<span class="dropdown-label">').append(label),
                    // caret
                    this.options.caret ? $('<i class="fa fa-caret-down" aria-hidden="true">') : []
                ),
                this.$ul
            );
            // add title?
            if (this.options.title) this.$toggle.attr('title', this.options.title);
            // in firefox draggable=false is not enough to prevent dragging...
            if (_.device('firefox')) this.$toggle.attr('ondragstart', 'return false;');

            // update custom label
            this.label();
            this.ensureA11y();
            return this;
        },

        ensureA11y: function () {
            var items = this.$ul.children('li');

            this.$toggle.attr({
                'aria-haspopup': true,
                'aria-expanded': false,
                role: 'button',
                'data-toggle': 'dropdown'
            });

            this.$ul
                .not('[role]')
                .attr({ role: 'menu' });

            items
                .filter(':not([role])')
                .attr({ role: 'presentation' });

            items
                .find('a:not([role])')
                .attr({ role: 'menuitem', tabIndex: '-1' });
        },

        prepareReuse: function () {
            if (this.$toggle) this.$toggle.remove();
            if (this.$ul) this.$ul.empty();
        },

        dispose: function () {
            // remove overlay if dropdown code is removed
            if (this.$overlay) this.$overlay.remove();
            AbstractView.prototype.dispose.call(this, arguments);
        }

    });

    return Dropdown;
});
