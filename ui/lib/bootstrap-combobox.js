/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
    // just a brand new combobox
    // notice extends typeahead

$(document).ready(function () {

    'use strict';

    var Combobox = function (element, options) {
        this.$outer = $('<div>').attr({
            role: 'combobox',
            'aria-expanded': false
        }).css('display', 'inline');
        this.$element = $(element).wrap(this.$outer);
        this.options = $.extend({}, $.fn.combobox.defaults, options);
        this.matcher = this.options.matcher || this.matcher;
        this.sorter = this.options.sorter || this.sorter;
        this.highlighter = this.options.highlighter || this.highlighter;
        this.$menu = $(this.options.menu).attr({ role: 'listbox' }).insertAfter(this.$element);
        this.source = this.options.source;
        this.shown = false;
        this.$ul = $(this.$menu);
        this.$inputWrap = $('<div>').attr({
            role: 'presentation'
        }).css('display', 'inline');
        this.$element.attr({ 'aria-owns': 'listchoices' }).wrap(this.$inputWrap);
        this.listen();
    };

    Combobox.prototype = $.extend({}, $.fn.typeahead.Constructor.prototype, {
        constructor: Combobox,
        listen: function () {
            var self = this;
            this.$element
                .on('blur',     $.proxy(this.blur, this))
                .on('focus',    $.proxy(this.focus, this))
                .on('keypress', $.proxy(this.keypress, this))
                .on('keyup',    $.proxy(this.keyup, this));


            if (_.browser.webkit || _.browser.msie) {
                this.$element.on('keydown', $.proxy(this.keypress, this));
            }
            // bind to mousedown to intercept the blur event
            this.$menu.on('mousedown', function (e) {
                var clickX = e.offsetX,
                    liWidth = self.$li.first().outerWidth(),
                    ulWidth = self.$ul.outerWidth();

                // lookup if the scrollbar was clicked, if yes, prevent the blur
                if (clickX >= liWidth && clickX <= ulWidth) {
                    self.blurring = true;
                    e.preventDefault();
                }
            });
            this.$menu
                .on('click', $.proxy(this.click, this))
                .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
                .on('mouseleave', $.proxy(this.mouseleave, this));
        },
        hide: function () {
            this.$menu.hide();
            return this;
        },
        click: function (e) {
            e.stopPropagation();
            e.preventDefault();
            this.select();
        },
        focus: function (e) {
            this.lookup();
        },
        blur: function (e) {
            if (this.blurring) {
                return;
            }
            var self = this;
            setTimeout(function () {
                self.select();
            }, 0);
        },
        mouseleave: function(e) {
            this.$li.removeClass('active').attr({ 'aria-selected': false });
        },
        move: function (e) {
            if (!this.shown) return;

            switch(e.keyCode) {
            case 13: // enter
            case 27: // escape
                e.preventDefault();
                break;

            case 38: // up arrow
                e.preventDefault();
                this.show();
                this.prev();
                break

            case 40: // down arrow
                e.preventDefault();
                this.show();
                this.next();
                break;
            }

            e.stopPropagation();
        },
        keyup: function (e) {
            switch (e.keyCode) {
            case 40: // down arrow
            case 38: // up arrow
                if (!this.shown) {
                    this.lookup();
                }
                break;

            case 9:
                break; // tab
            case 13: // enter
                e.stopPropagation();
                if (!this.shown) {
                    return;
                }
                this.select();
                break;

            case 27: // escape
                if (!this.shown) {
                    return;
                }
                e.stopPropagation();
                this.hide();
                break;

            case 37: // left
            case 39: // right
                if (!this.shown) {
                    return;
                }
                e.stopPropagation();
            break;
            default:
                if (!this.shown) {
                    return;
                }
                e.stopPropagation();
                this.lookup();
            }

        },
        select: function () {
            var val = this.$menu.find('.active').attr('data-value');
            if (val) {
                this.$element.val(val);
                this.$element.trigger('change');
                this.blurring = true;
                this.$element.trigger('blur');
                this.blurring = false;
            }
            return this.hide();
        },
        render: function (items) {
            var self = this;

            items = $(items).map(function (i, item) {
                i = $(self.options.item).attr('data-value', item);
                i.find('a').html(self.highlighter(item));
                return i[0];
            });

            var selected = _(items).find(function (item) {
                return ($(item).is('li[data-value^="' + self.query + '"]'));
            });

            if (selected) {
                $(selected).addClass('active').attr({ 'aria-selected': true });
            } else {
                this.shown = false;
            }

            this.$li = items;
            this.$menu.html(items);
            return this;
        },
        scrollIntoCombobox: function (el) {
            var ownHeight = this.$menu.height();
            var itemPos = el.get(0).offsetTop;
            this.$menu.scrollTop(itemPos - ownHeight / 2 );
        },
        show: function () {
            var pos = $.extend({}, {top: this.$element[0].offsetTop, left: this.$element[0].offsetLeft}, {
                height: this.$element[0].offsetHeight
            });
            this.$menu.css({
                top: pos.top + pos.height,
                left: pos.left
            });

            this.$menu.show();
            var selected = this.$menu.find('.active');
            if (selected.length > 0) {
                // calculate position to center actual time in dropdown
                this.scrollIntoCombobox(selected);
            }
            this.shown = true;
            return this;
        },
        next: function (e) {
            var active = this.$menu.find('.active').removeClass('active').attr({ 'aria-selected': false }),
                next = active.next();

            if (!next.length) {
                next = $(this.$menu.find('li')[0]);
            }
            this.scrollIntoCombobox(next);
            next.addClass('active').attr({ 'aria-selected': true });
        },
        prev: function (e) {
            var active = this.$menu.find('.active').removeClass('active').attr({ 'aria-selected': false }),
                prev = active.prev();

            if (!prev.length) {
                prev = this.$menu.find('li').last();
            }
            this.scrollIntoCombobox(prev);
            prev.addClass('active').attr({ 'aria-selected': true });
        },
        lookup: function (event) {
            var self = this,
                items;

            this.query = this.$element.val().toUpperCase();

            if (!this.query && this.options.autocompleteBehaviour) {
                return this.shown ? this.hide() : this;
            }

            if (this.options.autocompleteBehaviour) {
                items = $.grep(this.source, function (item) {
                    if (self.matcher(item)) {
                        return item;
                    }
                });
            } else {
                items = this.source;
            }

            items = this.sorter(items);

            if (!items.length) {
                return this.shown ? this.hide() : this;
            }

            return this.render(items.slice(0, this.options.items)).show();
        }

    });

    $.fn.combobox = function (option) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('combobox'),
                options = typeof option === 'object' && option;
            if (!data) {
                $this.data('combobox', (data = new Combobox(this, options)));
            }

            if (typeof option === 'string') {
                data[option]();
            }
        });
    };

    $.fn.combobox.defaults = {
        source: [],
        items: 8,
        menu: '<ul class="typeahead dropdown-menu"></ul>',
        item: '<li role="option" aria-selected="false"><a></a></li>',
        autocompleteBehaviour: false
    };

    $.fn.combobox.Constructor = Combobox;

    $(function () {
        $('body').on('focus.combobox.data-api', '[data-provide="combobox"]', function (e) {
            var $this = $(this);
            if ($this.data('combobox')) {
                return;
            }
            e.preventDefault();
            $this.typeahead($this.data());
        });
    });
});
