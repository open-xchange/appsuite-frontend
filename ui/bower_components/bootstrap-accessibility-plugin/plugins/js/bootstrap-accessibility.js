/* ========================================================================
* Extends Bootstrap v3.1.1

* Copyright (c) <2014> eBay Software Foundation

* All rights reserved.

* Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

* Neither the name of eBay or any of its subsidiaries or affiliates nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
* ======================================================================== */

(function($) {

    'use strict';

    // GENERAL UTILITY FUNCTIONS
    // ===============================
    var uniqueId = function (prefix) {
        return (prefix || 'ui-id') + '-' + Math.floor((Math.random()*1000)+1);
    };

    var removeMultiValAttributes = function (el, attr, val) {
        var describedby = (el.attr( attr ) || '').split( /\s+/ ),
            index = $.inArray(val, describedby);
        if (index !== -1) {
            describedby.splice(index, 1);
        }
        describedby = $.trim(describedby.join( ' ' ));
        if (describedby) {
            el.attr(attr, describedby);
        } else {
            el.removeAttr(attr);
        }
    };

    // Alert Extension
    // ===============================
    var alertConstructor = $.fn.dropdown.Constructor,
        alertFn = $.fn.dropdown;

    $.fn.alert = function () {
        $(this).attr({ role: 'alert' });
        return alertFn.apply(this, arguments);
    };
    $.fn.alert.Constructor = alertConstructor;

    // TOOLTIP Extension
    // ===============================
    var showTooltip = $.fn.tooltip.Constructor.prototype.show,
        hideTooltip = $.fn.tooltip.Constructor.prototype.hide;

    $.fn.tooltip.Constructor.prototype.show = function () {
        showTooltip.apply(this, arguments);
        var $tip = this.tip(),
            tooltipID = $tip.attr('id') || uniqueId('ui-tooltip');
        $tip.attr({ role: 'tooltip',id : tooltipID });
        this.$element.attr({ 'aria-describedby': tooltipID });
    };

    $.fn.tooltip.Constructor.prototype.hide = function () {
        hideTooltip.apply(this, arguments);
        removeMultiValAttributes(this.$element, 'aria-describedby', this.tip().attr('id'));
        return this;
    };

    // Popover Extension
    // ===============================
    var showPopover =     $.fn.popover.Constructor.prototype.setContent,
        hidePopover =     $.fn.popover.Constructor.prototype.hide;

    $.fn.popover.Constructor.prototype.setContent = function () {
        showPopover.apply(this, arguments);
        var $tip = this.tip(),
            tooltipID = $tip.attr('id') || uniqueId('ui-tooltip');
        $tip.attr({ role: 'alert', id: tooltipID });
        this.$element.attr('aria-describedby', tooltipID);
    };

    $.fn.popover.Constructor.prototype.hide =    function () {
        hidePopover.apply(this, arguments);
        removeMultiValAttributes(this.$element, 'aria-describedby', this.tip().attr('id'));
        return this;
    };

    // DROPDOWN Extension
    // ===============================
    function a11yDropdown() {
        var toggle = this,
            root = toggle.parent(),
            menu = root.find('ul'),
            items = menu.find('li');

        toggle
            .attr({ 'aria-haspopup': true, 'aria-expanded': false });
        menu
            .not('[role]')
            .attr({ role: 'menu' });
        items
            .filter(':not([role])')
            .attr({ role: 'presentation' });
        items
            .find('a')
            .attr({ tabIndex: '-1' })
            .filter(':not([role])')
            .attr({ role: 'menuitem' });

        root.on({
            'shown.bs.dropdown': function(e, args) {
                toggle.attr({ 'aria-expanded': true });
                var el = args.relatedTarget
                if (!$(el).data('preventFocus')) {
                    setTimeout(function() {
                        $('a[role^="menuitem"]',items).first(':visible').focus();
                    }, 200);
                }
                $(el).removeData('preventFocus')
            },
            'hidden.bs.dropdown': function(e) {
                toggle.attr('aria-expanded','false');
            }
        });

        return this;
    }

    $(document)
        .on('focusout.dropdown.data-api', '.dropdown-menu', function(e) {
            var that = this;
            setTimeout(function() {
                if (!$.contains(that, document.activeElement)) {
                    $(that)
                        .parent()
                        .removeClass('open')
                        .find('[data-toggle=dropdown]')
                        .attr({ 'aria-expanded': false });
                }
            }, 150);
        })
        .on('keydown.bs.dropdown.data-api', '[data-toggle=dropdown], [role=menu]' , function (e) {
            //Adding Space Key Behaviour, opens on spacebar
            if (e.which == 32 && $(e.target).is('a')) {
                $(e.target).click();
            }
        })
        .on('mousedown.bs.dropdown.data-api', '[data-toggle=dropdown]', function (e) {
            $(this).data('preventFocus', true);
        });

    var dropdownConstructor = $.fn.dropdown.Constructor,
            dropdownFn = $.fn.dropdown;

    $.fn.dropdown = function (option) {
        if (!$(this).data('bs.dropdown')) a11yDropdown.apply(this);
        if (typeof option === 'string' && option === 'toggle') {
            $(this).data('preventFocus', true);
        }
        return dropdownFn.apply(this, arguments);
    };
    $.fn.dropdown.Constructor = dropdownConstructor;

    // Modal Extension
    // ===============================
    $.fn.modal.Constructor.prototype._hide = $.fn.modal.Constructor.prototype.hide;
    $.fn.modal.Constructor.prototype._show = $.fn.modal.Constructor.prototype.show;

    $.fn.modal.Constructor.prototype.hide = function () {
        var modalOpener = this.$element.parent().find('[data-target="#' + this.$element.attr('id') + '"]');
        $.fn.modal.Constructor.prototype._hide.apply(this, arguments);
        modalOpener.focus();
    };

    $.fn.modal.Constructor.prototype.show = function () {
        $('.modal-dialog', this).attr({ role : 'document' });
        $.fn.modal.Constructor.prototype._show.apply(this, arguments);
    };

    // Carousel Extension
    // ===============================

    function a11yCarousel() {
        var $this = $(this),
            prev = $this.find('[data-slide="prev"]'),
            next = $this.find('[data-slide="next"]'),
            $options = $this.find('.item'),
            $listbox = $options.parent();

        $this.attr({ 'data-interval': false, 'data-wrap': false });
        $listbox.attr('role', 'listbox');
        $options.attr('role', 'option');

        prev.attr('role', 'button')
            .append($('<span class="sr-only">').text('Previous'));
        next.attr('role', 'button')
            .append($('<span class="sr-only">').text('Next'));

        $options.each(function () {
            var item = $(this);
            if (item.hasClass('active')) {
                item.attr({ 'aria-selected': 'true', 'tabindex' : '0' })
            } else {
                item.attr({ 'aria-selected': 'false', 'tabindex' : '-1' })
            }
        });
    }

    var slideCarousel = $.fn.carousel.Constructor.prototype.slide;
    $.fn.carousel.Constructor.prototype.slide = function (type, next) {
        var $active = this.$element.find('.item.active'),
            $next = next || $active[type]();

        slideCarousel.apply(this, arguments)

        $active
            .one($.support.transition.end, function () {
                $active.attr({ 'aria-selected': false, 'tabIndex': '-1' })
                $next.attr({ 'aria-selected': true, 'tabIndex': '0' })
            })
    }

    // add keyboad support to carousel
    $(document).on('keydown.carousel.data-api', 'div[role=option]', function (e) {
        var $this = $(this),
            $ul = $this.closest('div[role=listbox]'),
            $items = $ul.find('[role=option]'),
            $parent = $ul.parent(),
            k = e.which || e.keyCode,
            index = $items.index($items.filter('.active'));

        if (!/(37|38|39|40)/.test(k)) return;

        // Up
        if (k == 37 || k == 38) {
            $parent.carousel('prev');
            index--;
            if (index < 0) {
                index = $items.length -1
            } else {
                $this.prev().focus()
            }
        }

        // Down
        if (k == 39 || k == 40) {
            $parent.carousel('next');
            index++;
            if (index == $items.length) {
                index = 0;
            } else {
                $this.one($.support.transition.end, function () {
                    $this.next().focus();
                });
            }
        }
    });

    var carouselConstructor = $.fn.carousel.Constructor,
        carouselFn = $.fn.carousel;

    $.fn.carousel = function () {
        if (!$(this).data('bs.carousel')) a11yCarousel.apply(this);
        return carouselFn.apply(this, arguments);
    };
    $.fn.carousel.Constructor = carouselConstructor;

})(jQuery);