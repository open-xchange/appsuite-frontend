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
