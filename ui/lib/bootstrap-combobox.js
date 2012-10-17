/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
    // just a brand new combobox
    // notice extends typeahead

$(document).ready(function () {

    'use strict';

    var Combobox = function (element, options) {
        this.$element = $(element);
        this.options = $.extend({}, $.fn.combobox.defaults, options);
        this.matcher = this.options.matcher || this.matcher;
        this.sorter = this.options.sorter || this.sorter;
        this.highlighter = this.options.highlighter || this.highlighter;
        this.$menu = $(this.options.menu).appendTo('body');
        this.source = this.options.source;
        this.shown = false;
        this.listen();
    };

    Combobox.prototype = $.extend({}, $.fn.typeahead.Constructor.prototype, {
        constructor: Combobox,
        listen: function () {
            this.$element
                .on('blur',     $.proxy(this.blur, this))
                .on('focus',    $.proxy(this.focus, this))
                .on('keypress', $.proxy(this.keypress, this))
                .on('keyup',    $.proxy(this.keyup, this));

            if ($.browser.webkit || $.browser.msie) {
                this.$element.on('keydown', $.proxy(this.keypress, this));
            }

            this.$menu
                .on('click', $.proxy(this.click, this)) // better than click
                .on('mouseenter', 'li', $.proxy(this.mouseenter, this));
        },
        focus: function (e) {
            this.lookup();
        },
        blur: function (e) {
            var self = this;
            e.stopPropagation();
            e.preventDefault();
            setTimeout(function () {
                self.select();
            }, 0);
        },
        keyup: function (e) {

            switch (e.keyCode) {
            case 40: // down arrow
            case 38: // up arrow
                if (!this.shown) {
                    this.lookup();
                }
                e.stopPropagation();
                break;

            case 9: // tab
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
                return ($(item).attr('data-value') === self.query);
            });

            if (selected) {
                $(selected).addClass('active');
            } else {
                //items.first().addClass('active');
            }

            this.$menu.html(items);
            return this;
        },
        show: function () {
            var pos = $.extend({}, this.$element.offset(), {
                height: this.$element[0].offsetHeight
            });

            this.$menu.css({
                top: pos.top + pos.height,
                left: pos.left
            });

            this.$menu.show();
            var selected = this.$menu.find('.active');
            if (selected.length > 0) {
                selected.get(0).scrollIntoView();
            }
            this.shown = true;
            return this;
        },
        next: function (e) {
            var active = this.$menu.find('.active').removeClass('active'),
                next = active.next();

            if (!next.length) {
                next = $(this.$menu.find('li')[0]);
            }
            next.get(0).scrollIntoView();
            next.addClass('active');
        },
        prev: function (e) {
            var active = this.$menu.find('.active').removeClass('active'),
                prev = active.prev();

            if (!prev.length) {
                prev = this.$menu.find('li').last();
            }
            prev.get(0).scrollIntoView();
            prev.addClass('active');
        },
        lookup: function (event) {
            var self = this,
                items,
                q;

            this.query = this.$element.val();

            if (!this.query && this.options.autocompleteBehavoir) {
                return this.shown ? this.hide() : this;
            }

            if (this.options.autocompleteBehavoir) {
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
        item: '<li><a href="#"></a></li>',
        autocompleteBehavoir: false
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