/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/backbone/mini-views/combobox', [
    'io.ox/core/util'
], function (util) {

    'use strict';

    return Backbone.View.extend({

        events: {
            'blur input': 'onBlur',
            'focus input': 'onFocus',
            'keydown input': 'onKeydown',
            'keyup input': 'onKeyup',
            'mousedown .dropdown-menu': 'onMousedownMenu',
            'mouseup .dropdown-menu': 'onMouseupMenu',
            'mousedown .dropdown-menu li': 'onClickOption'
        },

        initialize: function (opt) {
            this.opt = _.extend({
                options: [],
                dropdownClass: '',
                dropdownId: _.uniqueId('combobox-controls-'),
                inputClass: ''
            }, opt);
        },

        renderInput: function () {
            var input = this.opt.input || $('<input>').addClass(this.opt.inputClass);
            input.attr('role', 'combobox');

            if (this.opt.label) {
                if (this.opt.label instanceof $) {
                    var id = this.opt.label.attr('id') || _.uniqueId('control-label-');
                    this.opt.label.attr('id', id);
                    input.attr('aria-labelledby', id);
                } else {
                    input.attr('aria-label', this.opt.label);
                }
            }

            return input
                .attr({
                    'aria-controls': this.opt.dropdownId,
                    'aria-expanded': false,
                    'aria-autocomplete': 'list'
                })
                .addClass(this.opt.inputClass);
        },

        renderDropdown: function () {
            return $('<ul class="typeahead dropdown-menu"> role="listbox"')
                .attr('id', this.opt.dropdownId)
                .hide()
                .addClass(this.opt.dropdownClass).append(
                    this.opt.options.map(function (option) {
                        return $('<li role="option">').attr({
                            'data-value': option.value,
                            id: _.uniqueId('dropdown-option-')
                        }).append(
                            $('<a href="#">').text(option.name)
                        );
                    })
                );
        },

        render: function () {
            this.$el.append(
                $('<div role="presentation">').css('display', 'inline').append(
                    this.$input = this.renderInput()
                ),
                this.$dropdown = this.renderDropdown()
            );
            return this;
        },

        onBlur: function () {
            if (this.preventBlur) return;
            this.$input.attr({
                'aria-expanded': false,
                'aria-activedescendant': null
            });
            this.$dropdown.hide();
            this.$dropdown.find('.active').removeClass('active');
            delete this.index;
        },

        onFocus: function () {
            var pos = this.$input.position(),
                dropdownOpen = this.$dropdown.is(':visible');
            this.$input.attr('aria-expanded', true);
            this.$dropdown
                .css({
                    top: pos.top + this.$input.outerHeight(),
                    left: pos.left
                })
                .show();
            this.updateQuery();
            var scrollTarget = this.$dropdown.find('strong').first();
            if (!dropdownOpen && scrollTarget.length === 1) this.scrollIntoView(scrollTarget);
        },

        onMousedownMenu: function (e) {
            var clickX = e.offsetX,
                innerWidth = this.$('li').first().outerWidth(),
                outerWidth = innerWidth + util.getScrollBarWidth();
            // prevent clicks on scrollbar
            if (clickX >= innerWidth && clickX <= outerWidth) {
                this.preventBlur = true;
                e.preventDefault();

                // IE and edge doe not trigger a mouse-up event and the input looses focus. Do it manually a short time after
                if (_.browser.ie || _.browser.edge) {
                    var self = this;
                    _.defer(function () {
                        self.$input.focus();
                        self.preventBlur = false;
                    });
                }
            }
        },

        onMouseupMenu: function () {
            this.preventBlur = false;
        },

        onClickOption: function (e) {
            this.preventBlur = false;
            this.index = $(e.currentTarget).closest('li').index();
            this.select();
            this.onBlur();
        },

        preSelect: function (incr) {
            if (!_.isUndefined(this.index)) this.index += incr;
            if (this.index < 0) this.index = this.opt.options.length - 1;
            if (this.index >= this.opt.options.length) this.index = 0;
            // no index set. try to select matching option.
            if (_.isUndefined(this.index)) {
                var val = this.$input.val();
                this.index = _(this.opt.options).findIndex(function (option) {
                    return option.name.toLowerCase().indexOf(val.toLowerCase()) === 0;
                });
            }
            this.$dropdown.find('.active').removeClass('active');
            if (this.index >= 0) {
                var target = this.$dropdown.children().eq(this.index);
                target.addClass('active');
                this.$input.attr('aria-activedescendant', target.attr('id'));
                this.scrollIntoView(target);
            }
        },

        scrollIntoView: function (target) {
            target = target.closest('li');
            var scrollTop = this.$dropdown.scrollTop(),
                targetTop = target.position().top,
                targetHeight = target.height(),
                dropdownHeight = this.$dropdown.outerHeight();
            if (targetTop < 0) this.$dropdown.scrollTop(scrollTop + targetTop);
            else if (targetTop + targetHeight > dropdownHeight) this.$dropdown.scrollTop(scrollTop + targetTop + targetHeight - dropdownHeight);
        },

        select: function () {
            if (!_.isUndefined(this.index) && this.index !== -1) {
                var target = this.$dropdown.children().eq(this.index);
                this.$input.val(target.attr('data-value'));
            }
            this.$input.trigger('change');
        },

        updateQuery: function () {
            var self = this, query = this.$input.val();
            if (!query) query = '';
            this.$dropdown.children('li').each(function () {
                var $this = $(this),
                    link = $this.find('a'),
                    value = $this.attr('data-value');
                link.html(self.highlighter(value, query));
            });
        },

        highlighter: function (item, query) {
            query = '(?<!\\w)' + query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                return '<strong>' + match + '</strong>';
            });
        },

        onKeydown: function (e) {
            switch (e.keyCode) {
                case 9: // tab
                    this.onBlur();
                    break;
                case 13: // enter
                    e.preventDefault();
                    this.select();
                    this.onBlur();
                    break;
                case 27: // escape
                    e.preventDefault();
                    this.onBlur();
                    break;
                case 38: // up arrow
                    e.preventDefault();
                    this.onFocus();
                    this.preSelect(-1);
                    break;
                case 40: // down arrow
                    e.preventDefault();
                    this.onFocus();
                    this.preSelect(1);
                    break;
                default:
                    break;
            }
        },

        onKeyup: function (e) {
            if (/(13|27|38|40)/.test(e.keyCode)) return;
            this.updateQuery();
            if (!this.$dropdown.is(':visible')) return;
            delete this.index;
            this.preSelect();
        }

    });

});
