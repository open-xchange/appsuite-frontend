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

define('io.ox/backbone/mini-views/dropdown', ['io.ox/backbone/mini-views/abstract', 'io.ox/core/a11y'], function (AbstractView, a11y) {

    'use strict';

    function getLabel(value) {
        if (_.isFunction(value)) return value();
        if (_.isObject(value)) return value;
        return $.txt(value);
    }

    function addColor($node, color) {
        return $node.addClass('checkbox-color color-flags-no-checkbox').css('background-color', color);
    }

    // Bootstrap dropdown

    var Dropdown = AbstractView.extend({

        tagName: 'div',
        className: 'dropdown',

        events: {
            'shown.bs.dropdown': 'onShown',
            'hidden.bs.dropdown': 'resetDropdownOverlay',
            'keydown *[data-toggle="dropdown"]': 'onKeyDown',
            'ready': 'onReady',
            'contextmenu': 'onContextMenu'
        },

        onContextMenu: function (e) {
            e.preventDefault();
        },

        onReady: function () {
            if (_.device('smartphone') && !this.options.dontProcessOnMobile) return;
            if (this.smart === false && !this.$overlay) return;
            if (!this.$el.hasClass('open')) return;
            this.$ul.css({ width: 'auto', height: 'auto' });
            this.adjustBounds();
        },

        resetDropdownOverlay: function () {
            // force cleanup backdrop on mobile
            $(document).trigger('click.bs.dropdown.data-api');

            if (!this.$overlay) return;
            this.$ul.removeAttr('data-original-id');
            this.$placeholder.before(this.$ul).detach();
            this.$el.removeClass('open');
            this.$ul.attr('style', this.$ul.data('style') || '').removeData('style');
            this.$overlay.remove();
            this.$toggle.attr('aria-expanded', false);
            delete this.$overlay;
            if (this.lastEvent && this.lastEvent.which === 9) {
                if (this.lastEvent.shiftKey) a11y.getPreviousTabbable(this.$toggle).focus();
                else a11y.getNextTabbable(this.$toggle).focus();
                delete this.lastEvent;
            }
        },

        setDropdownOverlay: function () {
            var self = this;

            this.$overlay = $('<div class="smart-dropdown-container dropdown open" role="navigation">', this.onReady.bind(this))
                .addClass(this.$el.prop('className'));

            this.$ul.data('style', this.$ul.attr('style'));
            this.adjustBounds();

            this.$ul.attr('data-original-id', this.$placeholder.attr('id'));
            // replaceWith and detach ($.fn.replaceWith is replaceWith and remove)
            this.$ul.before(this.$placeholder).detach();
            $('body').append(
                this.$overlay.append(
                    $('<div class="abs">').on('mousewheel touchmove', false)
                    .on('click contextmenu', function (e) {
                        e.stopPropagation();
                        self.resetDropdownOverlay();
                        return false;
                    }),
                    this.$ul
                )
            );
        },

        adjustBounds: function () {
            var isDropUp = !!this.options.dropup,
                bounds = this.$ul.get(0).getBoundingClientRect(),
                margins = {
                    top: parseInt(this.$ul.css('margin-top') || 0, 10),
                    left: parseInt(this.$ul.css('margin-left') || 0, 10)
                },
                positions = {
                    top: bounds.top - margins.top,
                    left: bounds.left - margins.left,
                    width: bounds.width,
                    height: 'auto'
                },
                offset = this.$toggle.offset(),
                width = this.$toggle.outerWidth(),
                availableWidth = $(window).width(),
                availableHeight = $(window).height(),
                topbar = $('#io-ox-appcontrol');

            if (isDropUp) {
                var top = this.$el.get(0).getBoundingClientRect().top;
                positions.top = top - bounds.height;
                // adjust height
                positions.height = bounds.height;
                positions.height = Math.min(availableHeight - this.margin - positions.top, positions.height);

                // outside viewport?
                positions.left = Math.max(this.margin, positions.left);
                positions.left = Math.min(availableWidth - positions.width - this.margin, positions.left);

            } else if ((bounds.top + bounds.height > availableHeight - this.margin)) {
                // hits bottom

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
                positions.height = bounds.height;
                positions.height = Math.min(availableHeight - this.margin - positions.top, positions.height);
            } else {
                // needed or IE 11 will draw the dropdown with 0 height (see bug 55551)
                if (_.browser.IE === 11) {
                    positions.bottom = 'auto';
                }

                // outside viewport?
                positions.left = Math.max(this.margin, positions.left);
                positions.left = Math.min(availableWidth - positions.width - this.margin, positions.left);
            }

            // overflows top
            if (positions.top < 0) {
                positions.height = positions.height + positions.top;
                positions.top = 0;
                this.$overlay.addClass('scrollable');
            }

            if (this.$toggle.data('fixed')) positions.left = bounds.left;
            this.$ul.css(positions);
        },

        onShown: function () {
            if (this.smart === false) return;
            if (_.device('smartphone') && !this.options.dontProcessOnMobile) return;
            this.setDropdownOverlay();
            if (this.$overlay.hasClass('scrollable')) this.$ul.scrollTop(this.$ul.height());
        },

        onKeyDown: function (e) {
            // select first or last item, if already open
            if (!this.$el.hasClass('open') || !this.$overlay) return;
            // special focus handling, because the $ul is no longer a child of the view
            var items = a11y.getTabbable(this.$ul);
            if (e.which === 40) items.first(':visible').focus();
            if (e.which === 38) items.last(':visible').focus();
            // special close handling on ESC
            if (e.which === 27) {
                this.$toggle.trigger('click');
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        },

        onKeyDownMenu: function (e) {
            if (e.which !== 9) return;
            this.lastEvent = e;
        },

        open: function () {
            if (this.$el.hasClass('open') || this.$overlay) return;
            this.$toggle.trigger('click');
        },

        close: function () {
            if (this.$el.hasClass('open') || this.$overlay) this.$toggle.trigger('click');
        },

        onClick: function (e) {
            var node = $(e.currentTarget),
                href = node.attr('href'),
                name = node.attr('data-name'),
                value = node.data('value'),
                toggleValue = node.data('toggle-value'),
                toggle = node.data('toggle'),
                keep = this.options.keep || node.attr('data-keep-open') === 'true';
            // do not handle links with valid href attribute
            if (href && href.length !== 0 && href !== '#') return;
            e.preventDefault();
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
                this.$el.trigger('track', e.currentTarget);

                this.$el.trigger(e);
                $temp.replaceWith(node);
            }
            // always forward event
            this.trigger('click', node.data());
            // return if model or value is missing
            if (!this.model) return;
            if (!this.options.allowUndefined && value === undefined) return;
            // finally update value
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
        },

        setup: function () {
            this.$ul = this.options.$ul || this.$ul || $('<ul class="dropdown-menu" role="menu">');
            this.$placeholder = $('<div class="hidden">').attr('id', _.uniqueId('dropdown-placeholder-'));
            this.smart = this.options.smart;
            this.margin = this.options.margin || 8;
            // not so nice but we need this for mobile support
            // if $ul pops out on the overlay, this line is also required
            this.$ul.on('click', 'a', $.proxy(this.onClick, this));
            this.$ul.on('keydown', 'a', $.proxy(this.onKeyDownMenu, this));

            if (this.model) this.listenTo(this.model, 'change', this.options.update || this.update);
            if (this.options.dontProcessOnMobile) {
                this.$el.attr('dontProcessOnMobile', true);
                this.$ul.attr('dontProcessOnMobile', true);
            }
        },

        update: function () {
            // TODO: simplify
            var $ul = this.$ul;
            if (!this.model) return;
            _(this.model.changed).each(function (value, name) {
                var li = $ul.find('[data-name="' + name + '"]');
                // clear check marks
                li.children('i').each(function (index, node) {
                    var $node = $(node),
                        color = $node.data('color');
                    $node.removeClass('fa-check').addClass('fa-none');
                    if (color) {
                        addColor($node, color);
                    }
                });
                // loop over list items also allow compare non-primitive values
                li.each(function () {
                    var node = $(this);
                    node.filter('[role=menuitemcheckbox][aria-checked]').attr({ 'aria-checked': _.isEqual(node.data('value'), value) });
                    if (_.isEqual(node.data('value'), value)) {
                        node.children('i').each(function (index, node) {
                            var $node = $(node),
                                color = $node.data('color');
                            $node.removeClass('fa-none').addClass('fa-check');
                            if (color) {
                                addColor($node, color);
                            }
                        });
                    }
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

        append: function (fn, options) {
            (options && options.group ? this.$ul.find('[role="group"]:last') : this.$ul).append(
                $('<li role="presentation">').append(fn)
            );
            return this;
        },

        option: function (name, value, text, options) {
            options = _.extend({ prefix: '', toggleValue: undefined, radio: false }, options);

            var currentValue = this.model ? this.model.get(name) : undefined,
                checked = _.isEqual(currentValue, value),
                role = options.radio ? 'menuitemradio' : 'menuitemcheckbox',
                plainText = _.isFunction(text) ? $('<div>').append(text()).text() : text,
                ariaLabel = options.prefix ? [options.prefix, plainText].join(' ') : undefined,
                $checkMark = $('<i class="fa fa-fw" aria-hidden="true">').addClass(checked ? 'fa-check' : 'fa-none'),
                $option = $('<a href="#" draggable="false">')
                            .attr({
                                'role': role,
                                'aria-checked': checked,
                                'data-keep-open': options.keepOpen ? true : undefined,
                                'data-name': name,
                                'data-value': this.stringify(value),
                                // you may use toggle with boolean values or provide a toggleValue ('togglevalue' is the option not checked value, 'value' is the option checked value)
                                'data-toggle': _.isBoolean(value) || options.toggleValue !== undefined,
                                'data-toggle-value': options.toggleValue,
                                'aria-label': ariaLabel,
                                'title': options.title,
                                tabindex: '-1'
                            });

            if (options.color) $option.addClass('color-flag');

            $option
                // in firefox draggable=false is not enough to prevent dragging...
                .on('dragstart', false)
                // store original value
                .data('value', value)
                .append(
                    // if the checkbox should have a color, add the information here
                    options.color ? addColor($checkMark, options.color).attr({ 'data-color': options.color, 'data-color-label': options.color }) : $checkMark,
                    // add an icon?
                    options.icon || $(),
                    // add text/label
                    _.isFunction(text) ? text() : $.txt(text)
                );

            return this.append($option, _.pick(options, 'group'));
        },

        // used to manually prevent the popup from closing.The only exception is a direct click on the toggle button. Make sure to reset this or the popup stays open when you don't want to
        forceOpen: function (state) {
            this.$el.attr('forceOpen', state);
        },

        link: function (name, text, callback, options) {
            options = options || {};
            var link = $('<a href="#" draggable="false" role="menuitem" tabindex="-1">')
                .attr('data-name', name)
                // in firefox draggable=false is not enough to prevent dragging...
                .on('dragstart', false)
                .append(
                    options.icon ? $('<i class="fa fa-fw" aria-hidden="true">') : $(),
                    // bug #54320 - no need for <span>
                    $.txt(text)
                );
            if (options.data) link.data(options.data);
            if (callback) link.on('click', {}, callback);
            return this.append(link);
        },

        header: function (text) {
            this.$ul.append(
                $('<li class="dropdown-header" role="separator">').append(
                    $('<span aria-hidden="true">').text(text)
                )
            );
            return this;
        },

        group: function (text, nodes) {
            this.header(text);
            this.$ul.append(
                $('<div role="group">').attr('aria-label', text).append(nodes)
            );
            return this;
        },

        divider: function () {
            this.$ul.append('<li class="divider" role="separator">');
            return this;
        },

        render: function () {
            $(this.$el, function () {
                this.trigger('ready');
            }.bind(this));
            var label = getLabel(this.options.label),
                ariaLabel = this.options.aria ? this.options.aria : null,
                toggleNode = '<a href="#" draggable="false">';

            if (_.isString(label)) ariaLabel += (' ' + label);

            if (this.options.buttonToggle) toggleNode = '<button type="button" draggable="false" class="btn btn-link">';

            this.$el.append(
                this.$toggle = this.options.$toggle || this.$toggle || $(toggleNode).attr({
                    'aria-label': ariaLabel,
                    'data-action': this.options.dataAction,
                    'title': this.options.title || null,
                    // in firefox draggable=false is not enough to prevent dragging...
                    'ondragstart': _.device('firefox') ? 'return false;' : null
                })
                .append(
                    // label
                    $('<span class="dropdown-label">').append(label),
                    // caret
                    this.options.caret ? $.icon('fa-caret-down', false, 'dropdown-caret') : []
                ),
                this.$ul
            );
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
                'data-toggle': 'dropdown'
            });

            if (this.$toggle.is('a')) this.$toggle.attr('role', 'button');

            if (this.options.tabindex) this.$toggle.attr('tabindex', this.options.tabindex);

            this.$ul
                .not('[role]')
                .attr({ role: 'menu' });

            items
                .filter(':not([role])')
                .attr({ role: 'presentation' });

            items
                .find('a:not([role])')
                .attr({ role: 'menuitem', tabindex: '-1' });
        },

        prepareReuse: function () {
            if (this.$toggle) this.$toggle.remove();
            if (this.$ul) this.$ul.empty();
            return this;
        },

        dispose: function () {
            // remove overlay if dropdown code is removed
            if (this.$overlay) this.$overlay.remove();
            AbstractView.prototype.dispose.call(this, arguments);
        }

    });

    return Dropdown;
});
