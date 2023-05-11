var defaults = {
    direction: 'horizontal',
    touchEventsTarget: 'container',
    initialSlide: 0,
    speed: 300,
    // autoplay
    autoplay: false,
    autoplayDisableOnInteraction: true,
    // Free mode
    freeMode: false,
    freeModeMomentum: true,
    freeModeMomentumRatio: 1,
    freeModeMomentumBounce: true,
    freeModeMomentumBounceRatio: 1,
    // Set wrapper width
    setWrapperSize: false,
    // Virtual Translate
    virtualTranslate: false,
    // Effects
    effect: 'slide', // 'slide' or 'fade' or 'cube' or 'coverflow'
    coverflow: {
        rotate: 50,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows : true
    },
    cube: {
        slideShadows: true,
        shadow: true,
        shadowOffset: 20,
        shadowScale: 0.94
    },
    fade: {
        crossFade: false
    },
    // Parallax
    parallax: false,
    // Scrollbar
    scrollbar: null,
    scrollbarHide: true,
    // Keyboard Mousewheel
    keyboardControl: false,
    mousewheelControl: false,
    mousewheelForceToAxis: false,
    // Hash Navigation
    hashnav: false,
    // Slides grid
    spaceBetween: 0,
    slidesPerView: 1,
    slidesPerColumn: 1,
    slidesPerColumnFill: 'column',
    slidesPerGroup: 1,
    centeredSlides: false,
    // Touches
    touchRatio: 1,
    touchAngle: 45,
    simulateTouch: true,
    shortSwipes: true,
    longSwipes: true,
    longSwipesRatio: 0.5,
    longSwipesMs: 300,
    followFinger: true,
    onlyExternal: false,
    threshold: 0,
    touchMoveStopPropagation: true,
    // Pagination
    pagination: null,
    paginationClickable: false,
    paginationHide: false,
    paginationBulletRender: null,
    // Resistance
    resistance: true,
    resistanceRatio: 0.85,
    // Next/prev buttons
    nextButton: null,
    prevButton: null,
    // Progress
    watchSlidesProgress: false,
    watchSlidesVisibility: false,
    // Cursor
    grabCursor: false,
    // Clicks
    preventClicks: true,
    preventClicksPropagation: true,
    slideToClickedSlide: false,
    // Lazy Loading
    lazyLoading: false,
    lazyLoadingInPrevNext: false,
    lazyLoadingOnTransitionStart: false,
    // Images
    preloadImages: true,
    updateOnImagesReady: true,
    // loop
    loop: false,
    loopAdditionalSlides: 0,
    loopedSlides: null,
    // Control
    control: undefined,
    controlInverse: false,
    // Swiping/no swiping
    allowSwipeToPrev: true,
    allowSwipeToNext: true,
    swipeHandler: null, //'.swipe-handler',
    noSwiping: true,
    noSwipingClass: 'swiper-no-swiping',
    // NS
    slideClass: 'swiper-slide',
    slideActiveClass: 'swiper-slide-active',
    slideVisibleClass: 'swiper-slide-visible',
    slideDuplicateClass: 'swiper-slide-duplicate',
    slideNextClass: 'swiper-slide-next',
    slidePrevClass: 'swiper-slide-prev',
    wrapperClass: 'swiper-wrapper',
    bulletClass: 'swiper-pagination-bullet',
    bulletActiveClass: 'swiper-pagination-bullet-active',
    buttonDisabledClass: 'swiper-button-disabled',
    paginationHiddenClass: 'swiper-pagination-hidden',
    // Observer
    observer: false,
    observeParents: false,
    // Accessibility
    a11y: false,
    prevSlideMessage: 'Previous slide',
    nextSlideMessage: 'Next slide',
    firstSlideMessage: 'This is the first slide',
    lastSlideMessage: 'This is the last slide',
    // Callbacks
    runCallbacksOnInit: true,
    /*
    Callbacks:
    onInit: function (swiper)
    onDestroy: function (swiper)
    onClick: function (swiper, e)
    onTap: function (swiper, e)
    onDoubleTap: function (swiper, e)
    onSliderMove: function (swiper, e)
    onSlideChangeStart: function (swiper)
    onSlideChangeEnd: function (swiper)
    onTransitionStart: function (swiper)
    onTransitionEnd: function (swiper)
    onImagesReady: function (swiper)
    onProgress: function (swiper, progress)
    onTouchStart: function (swiper, e)
    onTouchMove: function (swiper, e)
    onTouchMoveOpposite: function (swiper, e)
    onTouchEnd: function (swiper, e)
    onReachBeginning: function (swiper)
    onReachEnd: function (swiper)
    onSetTransition: function (swiper, duration)
    onSetTranslate: function (swiper, translate)
    onAutoplayStart: function (swiper)
    onAutoplayStop: function (swiper),
    onLazyImageLoad: function (swiper, slide, image)
    onLazyImageReady: function (swiper, slide, image)
    */

};
var initalVirtualTranslate = params && params.virtualTranslate;

params = params || {};
for (var def in defaults) {
    if (typeof params[def] === 'undefined') {
        params[def] = defaults[def];
    }
    else if (typeof params[def] === 'object') {
        for (var deepDef in defaults[def]) {
            if (typeof params[def][deepDef] === 'undefined') {
                params[def][deepDef] = defaults[def][deepDef];
            }
        }
    }
}

// Swiper
var s = this;

// Params
s.params = params;

// Classname
s.classNames = [];
/*=========================
  Dom Library and plugins
  ===========================*/
var $;
if (typeof Dom7 === 'undefined') {
    $ = window.Dom7 || window.Zepto || window.jQuery;
}
else {
    $ = Dom7;
}
if (!$) return;

// Export it to Swiper instance
s.$ = $;
/*=========================
  Preparation - Define Container, Wrapper and Pagination
  ===========================*/
s.container = $(container);
if (s.container.length === 0) return;
if (s.container.length > 1) {
    s.container.each(function () {
        new Swiper(this, params);
    });
    return;
}

// Save instance in container HTML Element and in data
s.container[0].swiper = s;
s.container.data('swiper', s);

s.classNames.push('swiper-container-' + s.params.direction);

if (s.params.freeMode) {
    s.classNames.push('swiper-container-free-mode');
}
if (!s.support.flexbox) {
    s.classNames.push('swiper-container-no-flexbox');
    s.params.slidesPerColumn = 1;
}
// Enable slides progress when required
if (s.params.parallax || s.params.watchSlidesVisibility) {
    s.params.watchSlidesProgress = true;
}
// Coverflow / 3D
if (['cube', 'coverflow'].indexOf(s.params.effect) >= 0) {
    if (s.support.transforms3d) {
        s.params.watchSlidesProgress = true;
        s.classNames.push('swiper-container-3d');
    }
    else {
        s.params.effect = 'slide';
    }
}
if (s.params.effect !== 'slide') {
    s.classNames.push('swiper-container-' + s.params.effect);
}
if (s.params.effect === 'cube') {
    s.params.resistanceRatio = 0;
    s.params.slidesPerView = 1;
    s.params.slidesPerColumn = 1;
    s.params.slidesPerGroup = 1;
    s.params.centeredSlides = false;
    s.params.spaceBetween = 0;
    s.params.virtualTranslate = true;
    s.params.setWrapperSize = false;
}
if (s.params.effect === 'fade') {
    s.params.slidesPerView = 1;
    s.params.slidesPerColumn = 1;
    s.params.slidesPerGroup = 1;
    s.params.watchSlidesProgress = true;
    s.params.spaceBetween = 0;
    if (typeof initalVirtualTranslate === 'undefined') {
        s.params.virtualTranslate = true;
    }
}

// Grab Cursor
if (s.params.grabCursor && s.support.touch) {
    s.params.grabCursor = false;
}

// Wrapper
s.wrapper = s.container.children('.' + s.params.wrapperClass);

// Pagination
if (s.params.pagination) {
    s.paginationContainer = $(s.params.pagination);
    if (s.params.paginationClickable) {
        s.paginationContainer.addClass('swiper-pagination-clickable');
    }
}

// Is Horizontal
function isH() {
    return s.params.direction === 'horizontal';
}

// RTL
s.rtl = isH() && (s.container[0].dir.toLowerCase() === 'rtl' || s.container.css('direction') === 'rtl');
if (s.rtl) {
    s.classNames.push('swiper-container-rtl');
}

// Wrong RTL support
if (s.rtl) {
    s.wrongRTL = s.wrapper.css('display') === '-webkit-box';
}

// Columns
if (s.params.slidesPerColumn > 1) {
    s.classNames.push('swiper-container-multirow');
}

// Check for Android
if (s.device.android) {
    s.classNames.push('swiper-container-android');
}

// Add classes
s.container.addClass(s.classNames.join(' '));

// Translate
s.translate = 0;

// Progress
s.progress = 0;

// Velocity
s.velocity = 0;

// Locks, unlocks
s.lockSwipeToNext = function () {
    s.params.allowSwipeToNext = false;
};
s.lockSwipeToPrev = function () {
    s.params.allowSwipeToPrev = false;
};
s.lockSwipes = function () {
    s.params.allowSwipeToNext = s.params.allowSwipeToPrev = false;
};
s.unlockSwipeToNext = function () {
    s.params.allowSwipeToNext = true;
};
s.unlockSwipeToPrev = function () {
    s.params.allowSwipeToPrev = true;
};
s.unlockSwipes = function () {
    s.params.allowSwipeToNext = s.params.allowSwipeToPrev = true;
};


/*=========================
  Set grab cursor
  ===========================*/
if (s.params.grabCursor) {
    s.container[0].style.cursor = 'move';
    s.container[0].style.cursor = '-webkit-grab';
    s.container[0].style.cursor = '-moz-grab';
    s.container[0].style.cursor = 'grab';
}
/*=========================
  Update on Images Ready
  ===========================*/
s.imagesToLoad = [];
s.imagesLoaded = 0;

s.loadImage = function (imgElement, src, checkForComplete, callback) {
    var image;
    function onReady () {
        if (callback) callback();
    }
    if (!imgElement.complete || !checkForComplete) {
        if (src) {
            image = new Image();
            image.onload = onReady;
            image.onerror = onReady;
            image.src = src;
        } else {
            onReady();
        }

    } else {//image already loaded...
        onReady();
    }
};
s.preloadImages = function () {
    s.imagesToLoad = s.container.find('img');
    function _onReady() {
        if (typeof s === 'undefined' || s === null) return;
        if (s.imagesLoaded !== undefined) s.imagesLoaded++;
        if (s.imagesLoaded === s.imagesToLoad.length) {
            if (s.params.updateOnImagesReady) s.update();
            s.emit('onImagesReady', s);
        }
    }
    for (var i = 0; i < s.imagesToLoad.length; i++) {
        s.loadImage(s.imagesToLoad[i], (s.imagesToLoad[i].currentSrc || s.imagesToLoad[i].getAttribute('src')), true, _onReady);
    }
};

/*=========================
  Autoplay
  ===========================*/
s.autoplayTimeoutId = undefined;
s.autoplaying = false;
s.autoplayPaused = false;
function autoplay() {
    s.autoplayTimeoutId = setTimeout(function () {
        if (s.params.loop) {
            s.fixLoop();
            s._slideNext();
        }
        else {
            if (!s.isEnd) {
                s._slideNext();
            }
            else {
                if (!params.autoplayStopOnLast) {
                    s._slideTo(0);
                }
                else {
                    s.stopAutoplay();
                }
            }
        }
    }, s.params.autoplay);
}
s.startAutoplay = function () {
    if (typeof s.autoplayTimeoutId !== 'undefined') return false;
    if (!s.params.autoplay) return false;
    if (s.autoplaying) return false;
    s.autoplaying = true;
    s.emit('onAutoplayStart', s);
    autoplay();
};
s.stopAutoplay = function (internal) {
    if (!s.autoplayTimeoutId) return;
    if (s.autoplayTimeoutId) clearTimeout(s.autoplayTimeoutId);
    s.autoplaying = false;
    s.autoplayTimeoutId = undefined;
    s.emit('onAutoplayStop', s);
};
s.pauseAutoplay = function (speed) {
    if (s.autoplayPaused) return;
    if (s.autoplayTimeoutId) clearTimeout(s.autoplayTimeoutId);
    s.autoplayPaused = true;
    if (speed === 0) {
        s.autoplayPaused = false;
        autoplay();
    }
    else {
        s.wrapper.transitionEnd(function () {
            s.autoplayPaused = false;
            if (!s.autoplaying) {
                s.stopAutoplay();
            }
            else {
                autoplay();
            }
        });
    }
};
/*=========================
  Min/Max Translate
  ===========================*/
s.minTranslate = function () {
    return (-s.snapGrid[0]);
};
s.maxTranslate = function () {
    return (-s.snapGrid[s.snapGrid.length - 1]);
};
/*=========================
  Slider/slides sizes
  ===========================*/
s.updateContainerSize = function () {
    s.width = s.container[0].clientWidth;
    s.height = s.container[0].clientHeight;
    s.size = isH() ? s.width : s.height;
};

s.updateSlidesSize = function () {
    s.slides = s.wrapper.children('.' + s.params.slideClass);
    s.snapGrid = [];
    s.slidesGrid = [];
    s.slidesSizesGrid = [];

    var spaceBetween = s.params.spaceBetween,
        slidePosition = 0,
        i,
        prevSlideSize = 0,
        index = 0;
    if (typeof spaceBetween === 'string' && spaceBetween.indexOf('%') >= 0) {
        spaceBetween = parseFloat(spaceBetween.replace('%', '')) / 100 * s.size;
    }

    s.virtualSize = -spaceBetween;
    // reset margins
    if (s.rtl) s.slides.css({marginLeft: '', marginTop: ''});
    else s.slides.css({marginRight: '', marginBottom: ''});

    var slidesNumberEvenToRows;
    if (s.params.slidesPerColumn > 1) {
        if (Math.floor(s.slides.length / s.params.slidesPerColumn) === s.slides.length / s.params.slidesPerColumn) {
            slidesNumberEvenToRows = s.slides.length;
        }
        else {
            slidesNumberEvenToRows = Math.ceil(s.slides.length / s.params.slidesPerColumn) * s.params.slidesPerColumn;
        }
    }

    // Calc slides
    var slideSize;
    for (i = 0; i < s.slides.length; i++) {
        slideSize = 0;
        var slide = s.slides.eq(i);
        if (s.params.slidesPerColumn > 1) {
            // Set slides order
            var newSlideOrderIndex;
            var column, row;
            var slidesPerColumn = s.params.slidesPerColumn;
            var slidesPerRow;
            if (s.params.slidesPerColumnFill === 'column') {
                column = Math.floor(i / slidesPerColumn);
                row = i - column * slidesPerColumn;
                newSlideOrderIndex = column + row * slidesNumberEvenToRows / slidesPerColumn;
                slide
                    .css({
                        '-webkit-box-ordinal-group': newSlideOrderIndex,
                        '-moz-box-ordinal-group': newSlideOrderIndex,
                        '-ms-flex-order': newSlideOrderIndex,
                        '-webkit-order': newSlideOrderIndex,
                        'order': newSlideOrderIndex
                    });
            }
            else {
                slidesPerRow = slidesNumberEvenToRows / slidesPerColumn;
                row = Math.floor(i / slidesPerRow);
                column = i - row * slidesPerRow;

            }
            slide
                .css({
                    'margin-top': (row !== 0 && s.params.spaceBetween) && (s.params.spaceBetween + 'px')
                })
                .attr('data-swiper-column', column)
                .attr('data-swiper-row', row);

        }
        if (slide.css('display') === 'none') continue;
        if (s.params.slidesPerView === 'auto') {
            slideSize = isH() ? slide.outerWidth(true) : slide.outerHeight(true);
        }
        else {
            slideSize = (s.size - (s.params.slidesPerView - 1) * spaceBetween) / s.params.slidesPerView;
            if (isH()) {
                s.slides[i].style.width = slideSize + 'px';
            }
            else {
                s.slides[i].style.height = slideSize + 'px';
            }
        }
        s.slides[i].swiperSlideSize = slideSize;
        s.slidesSizesGrid.push(slideSize);


        if (s.params.centeredSlides) {
            slidePosition = slidePosition + slideSize / 2 + prevSlideSize / 2 + spaceBetween;
            if (i === 0) slidePosition = slidePosition - s.size / 2 - spaceBetween;
            if (Math.abs(slidePosition) < 1 / 1000) slidePosition = 0;
            if ((index) % s.params.slidesPerGroup === 0) s.snapGrid.push(slidePosition);
            s.slidesGrid.push(slidePosition);
        }
        else {
            if ((index) % s.params.slidesPerGroup === 0) s.snapGrid.push(slidePosition);
            s.slidesGrid.push(slidePosition);
            slidePosition = slidePosition + slideSize + spaceBetween;
        }

        s.virtualSize += slideSize + spaceBetween;

        prevSlideSize = slideSize;

        index ++;
    }
    s.virtualSize = Math.max(s.virtualSize, s.size);

    var newSlidesGrid;

    if (
        s.rtl && s.wrongRTL && (s.params.effect === 'slide' || s.params.effect === 'coverflow')) {
        s.wrapper.css({width: s.virtualSize + s.params.spaceBetween + 'px'});
    }
    if (!s.support.flexbox || s.params.setWrapperSize) {
        if (isH()) s.wrapper.css({width: s.virtualSize + s.params.spaceBetween + 'px'});
        else s.wrapper.css({height: s.virtualSize + s.params.spaceBetween + 'px'});
    }

    if (s.params.slidesPerColumn > 1) {
        s.virtualSize = (slideSize + s.params.spaceBetween) * slidesNumberEvenToRows;
        s.virtualSize = Math.ceil(s.virtualSize / s.params.slidesPerColumn) - s.params.spaceBetween;
        s.wrapper.css({width: s.virtualSize + s.params.spaceBetween + 'px'});
        if (s.params.centeredSlides) {
            newSlidesGrid = [];
            for (i = 0; i < s.snapGrid.length; i++) {
                if (s.snapGrid[i] < s.virtualSize + s.snapGrid[0]) newSlidesGrid.push(s.snapGrid[i]);
            }
            s.snapGrid = newSlidesGrid;
        }
    }

    // Remove last grid elements depending on width
    if (!s.params.centeredSlides) {
        newSlidesGrid = [];
        for (i = 0; i < s.snapGrid.length; i++) {
            if (s.snapGrid[i] <= s.virtualSize - s.size) {
                newSlidesGrid.push(s.snapGrid[i]);
            }
        }
        s.snapGrid = newSlidesGrid;
        if (Math.floor(s.virtualSize - s.size) > Math.floor(s.snapGrid[s.snapGrid.length - 1])) {
            s.snapGrid.push(s.virtualSize - s.size);
        }
    }
    if (s.snapGrid.length === 0) s.snapGrid = [0];

    if (s.params.spaceBetween !== 0) {
        if (isH()) {
            if (s.rtl) s.slides.css({marginLeft: spaceBetween + 'px'});
            else s.slides.css({marginRight: spaceBetween + 'px'});
        }
        else s.slides.css({marginBottom: spaceBetween + 'px'});
    }
    if (s.params.watchSlidesProgress) {
        s.updateSlidesOffset();
    }
};
s.updateSlidesOffset = function () {
    for (var i = 0; i < s.slides.length; i++) {
        s.slides[i].swiperSlideOffset = isH() ? s.slides[i].offsetLeft : s.slides[i].offsetTop;
    }
};

/*=========================
  Slider/slides progress
  ===========================*/
s.updateSlidesProgress = function (translate) {
    if (typeof translate === 'undefined') {
        translate = s.translate || 0;
    }
    if (s.slides.length === 0) return;
    if (typeof s.slides[0].swiperSlideOffset === 'undefined') s.updateSlidesOffset();

    var offsetCenter = s.params.centeredSlides ? -translate + s.size / 2 : -translate;
    if (s.rtl) offsetCenter = s.params.centeredSlides ? translate - s.size / 2 : translate;

    // Visible Slides
    var containerBox = s.container[0].getBoundingClientRect();
    var sideBefore = isH() ? 'left' : 'top';
    var sideAfter = isH() ? 'right' : 'bottom';
    s.slides.removeClass(s.params.slideVisibleClass);
    for (var i = 0; i < s.slides.length; i++) {
        var slide = s.slides[i];
        var slideCenterOffset = (s.params.centeredSlides === true) ? slide.swiperSlideSize / 2 : 0;
        var slideProgress = (offsetCenter - slide.swiperSlideOffset - slideCenterOffset) / (slide.swiperSlideSize + s.params.spaceBetween);
        if (s.params.watchSlidesVisibility) {
            var slideBefore = -(offsetCenter - slide.swiperSlideOffset - slideCenterOffset);
            var slideAfter = slideBefore + s.slidesSizesGrid[i];
            var isVisible =
                (slideBefore >= 0 && slideBefore < s.size) ||
                (slideAfter > 0 && slideAfter <= s.size) ||
                (slideBefore <= 0 && slideAfter >= s.size);
            if (isVisible) {
                s.slides.eq(i).addClass(s.params.slideVisibleClass);
            }
        }
        slide.progress = s.rtl ? -slideProgress : slideProgress;
    }
};
s.updateProgress = function (translate) {
    if (typeof translate === 'undefined') {
        translate = s.translate || 0;
    }
    var translatesDiff = s.maxTranslate() - s.minTranslate();
    if (translatesDiff === 0) {
        s.progress = 0;
        s.isBeginning = s.isEnd = true;
    }
    else {
        s.progress = (translate - s.minTranslate()) / (translatesDiff);
        s.isBeginning = s.progress <= 0;
        s.isEnd = s.progress >= 1;
    }
    if (s.isBeginning) s.emit('onReachBeginning', s);
    if (s.isEnd) s.emit('onReachEnd', s);

    if (s.params.watchSlidesProgress) s.updateSlidesProgress(translate);
    s.emit('onProgress', s, s.progress);
};
s.updateActiveIndex = function () {
    var translate = s.rtl ? s.translate : -s.translate;
    var newActiveIndex, i, snapIndex;
    for (i = 0; i < s.slidesGrid.length; i ++) {
        if (typeof s.slidesGrid[i + 1] !== 'undefined') {
            if (translate >= s.slidesGrid[i] && translate < s.slidesGrid[i + 1] - (s.slidesGrid[i + 1] - s.slidesGrid[i]) / 2) {
                newActiveIndex = i;
            }
            else if (translate >= s.slidesGrid[i] && translate < s.slidesGrid[i + 1]) {
                newActiveIndex = i + 1;
            }
        }
        else {
            if (translate >= s.slidesGrid[i]) {
                newActiveIndex = i;
            }
        }
    }
    // Normalize slideIndex
    if (newActiveIndex < 0 || typeof newActiveIndex === 'undefined') newActiveIndex = 0;
    // for (i = 0; i < s.slidesGrid.length; i++) {
        // if (- translate >= s.slidesGrid[i]) {
            // newActiveIndex = i;
        // }
    // }
    snapIndex = Math.floor(newActiveIndex / s.params.slidesPerGroup);
    if (snapIndex >= s.snapGrid.length) snapIndex = s.snapGrid.length - 1;

    if (newActiveIndex === s.activeIndex) {
        return;
    }
    s.snapIndex = snapIndex;
    s.previousIndex = s.activeIndex;
    s.activeIndex = newActiveIndex;
    s.updateClasses();
};

/*=========================
  Classes
  ===========================*/
s.updateClasses = function () {
    s.slides.removeClass(s.params.slideActiveClass + ' ' + s.params.slideNextClass + ' ' + s.params.slidePrevClass);
    var activeSlide = s.slides.eq(s.activeIndex);
    // Active classes
    activeSlide.addClass(s.params.slideActiveClass);
    activeSlide.next('.' + s.params.slideClass).addClass(s.params.slideNextClass);
    activeSlide.prev('.' + s.params.slideClass).addClass(s.params.slidePrevClass);

    // Pagination
    if (s.bullets && s.bullets.length > 0) {
        s.bullets.removeClass(s.params.bulletActiveClass);
        var bulletIndex;
        if (s.params.loop) {
            bulletIndex = Math.ceil(s.activeIndex - s.loopedSlides)/s.params.slidesPerGroup;
            if (bulletIndex > s.slides.length - 1 - s.loopedSlides * 2) {
                bulletIndex = bulletIndex - (s.slides.length - s.loopedSlides * 2);
            }
            if (bulletIndex > s.bullets.length - 1) bulletIndex = bulletIndex - s.bullets.length;
        }
        else {
            if (typeof s.snapIndex !== 'undefined') {
                bulletIndex = s.snapIndex;
            }
            else {
                bulletIndex = s.activeIndex || 0;
            }
        }
        if (s.paginationContainer.length > 1) {
            s.bullets.each(function () {
                if ($(this).index() === bulletIndex) $(this).addClass(s.params.bulletActiveClass);
            });
        }
        else {
            s.bullets.eq(bulletIndex).addClass(s.params.bulletActiveClass);
        }
    }

    // Next/active buttons
    if (!s.params.loop) {
        if (s.params.prevButton) {
            if (s.isBeginning) {
                $(s.params.prevButton).addClass(s.params.buttonDisabledClass);
                if (s.params.a11y && s.a11y) s.a11y.disable($(s.params.prevButton));
            }
            else {
                $(s.params.prevButton).removeClass(s.params.buttonDisabledClass);
                if (s.params.a11y && s.a11y) s.a11y.enable($(s.params.prevButton));
            }
        }
        if (s.params.nextButton) {
            if (s.isEnd) {
                $(s.params.nextButton).addClass(s.params.buttonDisabledClass);
                if (s.params.a11y && s.a11y) s.a11y.disable($(s.params.nextButton));
            }
            else {
                $(s.params.nextButton).removeClass(s.params.buttonDisabledClass);
                if (s.params.a11y && s.a11y) s.a11y.enable($(s.params.nextButton));
            }
        }
    }
};

/*=========================
  Pagination
  ===========================*/
s.updatePagination = function () {
    if (!s.params.pagination) return;
    if (s.paginationContainer && s.paginationContainer.length > 0) {
        var bulletsHTML = '';
        var numberOfBullets = s.params.loop ? Math.ceil((s.slides.length - s.loopedSlides * 2) / s.params.slidesPerGroup) : s.snapGrid.length;
        for (var i = 0; i < numberOfBullets; i++) {
            if (s.params.paginationBulletRender) {
                bulletsHTML += s.params.paginationBulletRender(i, s.params.bulletClass);
            }
            else {
                bulletsHTML += '<span class="' + s.params.bulletClass + '"></span>';
            }
        }
        s.paginationContainer.html(bulletsHTML);
        s.bullets = s.paginationContainer.find('.' + s.params.bulletClass);
    }
};
/*=========================
  Common update method
  ===========================*/
s.update = function (updateTranslate) {
    s.updateContainerSize();
    s.updateSlidesSize();
    s.updateProgress();
    s.updatePagination();
    s.updateClasses();
    if (s.params.scrollbar && s.scrollbar) {
        s.scrollbar.set();
    }
    function forceSetTranslate() {
        newTranslate = Math.min(Math.max(s.translate, s.maxTranslate()), s.minTranslate());
        s.setWrapperTranslate(newTranslate);
        s.updateActiveIndex();
        s.updateClasses();
    }
    if (updateTranslate) {
        var translated, newTranslate;
        if (s.params.freeMode) {
            forceSetTranslate();
        }
        else {
            if (s.params.slidesPerView === 'auto' && s.isEnd && !s.params.centeredSlides) {
                translated = s.slideTo(s.slides.length - 1, 0, false, true);
            }
            else {
                translated = s.slideTo(s.activeIndex, 0, false, true);
            }
            if (!translated) {
                forceSetTranslate();
            }
        }

    }
};

/*=========================
  Resize Handler
  ===========================*/
s.onResize = function () {
    s.updateContainerSize();
    s.updateSlidesSize();
    s.updateProgress();
    if (s.params.slidesPerView === 'auto' || s.params.freeMode) s.updatePagination();
    if (s.params.scrollbar && s.scrollbar) {
        s.scrollbar.set();
    }
    if (s.params.freeMode) {
        var newTranslate = Math.min(Math.max(s.translate, s.maxTranslate()), s.minTranslate());
        s.setWrapperTranslate(newTranslate);
        s.updateActiveIndex();
        s.updateClasses();
    }
    else {
        s.updateClasses();
        if (s.params.slidesPerView === 'auto' && s.isEnd && !s.params.centeredSlides) {
            s.slideTo(s.slides.length - 1, 0, false, true);
        }
        else {
            s.slideTo(s.activeIndex, 0, false, true);
        }
    }

};

/*=========================
  Events
  ===========================*/

//Define Touch Events
var desktopEvents = ['mousedown', 'mousemove', 'mouseup'];
if (window.navigator.pointerEnabled) desktopEvents = ['pointerdown', 'pointermove', 'pointerup'];
else if (window.navigator.msPointerEnabled) desktopEvents = ['MSPointerDown', 'MSPointerMove', 'MSPointerUp'];
s.touchEvents = {
    start : s.support.touch || !s.params.simulateTouch  ? 'touchstart' : desktopEvents[0],
    move : s.support.touch || !s.params.simulateTouch ? 'touchmove' : desktopEvents[1],
    end : s.support.touch || !s.params.simulateTouch ? 'touchend' : desktopEvents[2]
};


// WP8 Touch Events Fix
if (window.navigator.pointerEnabled || window.navigator.msPointerEnabled) {
    (s.params.touchEventsTarget === 'container' ? s.container : s.wrapper).addClass('swiper-wp8-' + s.params.direction);
}

// Attach/detach events
s.initEvents = function (detach) {
    var actionDom = detach ? 'off' : 'on';
    var action = detach ? 'removeEventListener' : 'addEventListener';
    var touchEventsTarget = s.params.touchEventsTarget === 'container' ? s.container[0] : s.wrapper[0];
    var target = s.support.touch ? touchEventsTarget : document;

    var moveCapture = s.params.nested ? true : false;

    //Touch Events
    if (s.browser.ie) {
        touchEventsTarget[action](s.touchEvents.start, s.onTouchStart, false);
        target[action](s.touchEvents.move, s.onTouchMove, moveCapture);
        target[action](s.touchEvents.end, s.onTouchEnd, false);
    }
    else {
        if (s.support.touch) {
            touchEventsTarget[action](s.touchEvents.start, s.onTouchStart, false);
            touchEventsTarget[action](s.touchEvents.move, s.onTouchMove, moveCapture);
            touchEventsTarget[action](s.touchEvents.end, s.onTouchEnd, false);
        }
        if (params.simulateTouch && !s.device.ios && !s.device.android) {
            touchEventsTarget[action]('mousedown', s.onTouchStart, false);
            target[action]('mousemove', s.onTouchMove, moveCapture);
            target[action]('mouseup', s.onTouchEnd, false);
        }
    }
    window[action]('resize', s.onResize);

    // Next, Prev, Index
    if (s.params.nextButton) {
        $(s.params.nextButton)[actionDom]('click', s.onClickNext);
        if (s.params.a11y && s.a11y) $(s.params.nextButton)[actionDom]('keydown', s.a11y.onEnterKey);
    }
    if (s.params.prevButton) {
        $(s.params.prevButton)[actionDom]('click', s.onClickPrev);
        if (s.params.a11y && s.a11y) $(s.params.prevButton)[actionDom]('keydown', s.a11y.onEnterKey);
    }
    if (s.params.pagination && s.params.paginationClickable) {
        $(s.paginationContainer)[actionDom]('click', '.' + s.params.bulletClass, s.onClickIndex);
    }

    // Prevent Links Clicks
    if (s.params.preventClicks || s.params.preventClicksPropagation) touchEventsTarget[action]('click', s.preventClicks, true);
};
s.attachEvents = function (detach) {
    s.initEvents();
};
s.detachEvents = function () {
    s.initEvents(true);
};

/*=========================
  Handle Clicks
  ===========================*/
// Prevent Clicks
s.allowClick = true;
s.preventClicks = function (e) {
    if (!s.allowClick) {
        if (s.params.preventClicks) e.preventDefault();
        if (s.params.preventClicksPropagation) {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }
};
// Clicks
s.onClickNext = function (e) {
    e.preventDefault();
    s.slideNext();
};
s.onClickPrev = function (e) {
    e.preventDefault();
    s.slidePrev();
};
s.onClickIndex = function (e) {
    e.preventDefault();
    var index = $(this).index() * s.params.slidesPerGroup;
    if (s.params.loop) index = index + s.loopedSlides;
    s.slideTo(index);
};

/*=========================
  Handle Touches
  ===========================*/
function findElementInEvent(e, selector) {
    var el = $(e.target);
    if (!el.is(selector)) {
        if (typeof selector === 'string') {
            el = el.parents(selector);
        }
        else if (selector.nodeType) {
            var found;
            el.parents().each(function (index, _el) {
                if (_el === selector) found = selector;
            });
            if (!found) return undefined;
            else return selector;
        }
    }
    if (el.length === 0) {
        return undefined;
    }
    return el[0];
}
s.updateClickedSlide = function (e) {
    var slide = findElementInEvent(e, '.' + s.params.slideClass);
    if (slide) {
        s.clickedSlide = slide;
        s.clickedIndex = $(slide).index();
    }
    else {
        s.clickedSlide = undefined;
        s.clickedIndex = undefined;
        return;
    }
    if (s.params.slideToClickedSlide && s.clickedIndex !== undefined && s.clickedIndex !== s.activeIndex) {
        var slideToIndex = s.clickedIndex,
            realIndex;
        if (s.params.loop) {
            realIndex = $(s.clickedSlide).attr('data-swiper-slide-index');
            if (slideToIndex > s.slides.length - s.params.slidesPerView) {
                s.fixLoop();
                slideToIndex = s.wrapper.children('.' + s.params.slideClass + '[data-swiper-slide-index="' + realIndex + '"]').eq(0).index();
                setTimeout(function () {
                    s.slideTo(slideToIndex);
                }, 0);
            }
            else if (slideToIndex < s.params.slidesPerView - 1) {
                s.fixLoop();
                var duplicatedSlides = s.wrapper.children('.' + s.params.slideClass + '[data-swiper-slide-index="' + realIndex + '"]');
                slideToIndex = duplicatedSlides.eq(duplicatedSlides.length - 1).index();
                setTimeout(function () {
                    s.slideTo(slideToIndex);
                }, 0);
            }
            else {
                s.slideTo(slideToIndex);
            }
        }
        else {
            s.slideTo(slideToIndex);
        }
    }
};

var isTouched,
    isMoved,
    touchStartTime,
    isScrolling,
    currentTranslate,
    startTranslate,
    allowThresholdMove,
    // Form elements to match
    formElements = 'input, select, textarea, button',
    // Last click time
    lastClickTime = Date.now(), clickTimeout,
    //Velocities
    velocities = [],
    allowMomentumBounce;

// Animating Flag
s.animating = false;

// Touches information
s.touches = {
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    diff: 0
};

// Touch handlers
var isTouchEvent, startMoving;
s.onTouchStart = function (e) {
    if (e.originalEvent) e = e.originalEvent;
    isTouchEvent = e.type === 'touchstart';
    if (!isTouchEvent && 'which' in e && e.which === 3) return;
    if (s.params.noSwiping && findElementInEvent(e, '.' + s.params.noSwipingClass)) {
        s.allowClick = true;
        return;
    }
    if (s.params.swipeHandler) {
        if (!findElementInEvent(e, s.params.swipeHandler)) return;
    }
    isTouched = true;
    isMoved = false;
    isScrolling = undefined;
    startMoving = undefined;
    s.touches.startX = s.touches.currentX = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
    s.touches.startY = s.touches.currentY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
    touchStartTime = Date.now();
    s.allowClick = true;
    s.updateContainerSize();
    s.swipeDirection = undefined;
    if (s.params.threshold > 0) allowThresholdMove = false;
    if (e.type !== 'touchstart') {
        var preventDefault = true;
        if ($(e.target).is(formElements)) preventDefault = false;
        if (document.activeElement && $(document.activeElement).is(formElements)) {
            document.activeElement.blur();
        }
        if (preventDefault) {
            e.preventDefault();
        }
    }
    s.emit('onTouchStart', s, e);
};

s.onTouchMove = function (e) {
    if (e.originalEvent) e = e.originalEvent;
    if (isTouchEvent && e.type === 'mousemove') return;
    if (e.preventedByNestedSwiper) return;
    if (s.params.onlyExternal) {
        isMoved = true;
        s.allowClick = false;
        return;
    }
    if (isTouchEvent && document.activeElement) {
        if (e.target === document.activeElement && $(e.target).is(formElements)) {
            isMoved = true;
            s.allowClick = false;
            return;
        }
    }

    s.emit('onTouchMove', s, e);

    if (e.targetTouches && e.targetTouches.length > 1) return;

    s.touches.currentX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
    s.touches.currentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;

    if (typeof isScrolling === 'undefined') {
        var touchAngle = Math.atan2(Math.abs(s.touches.currentY - s.touches.startY), Math.abs(s.touches.currentX - s.touches.startX)) * 180 / Math.PI;
        isScrolling = isH() ? touchAngle > s.params.touchAngle : (90 - touchAngle > s.params.touchAngle);
    }
    if (isScrolling) {
        s.emit('onTouchMoveOpposite', s, e);
    }
    if (typeof startMoving === 'undefined' && s.browser.ieTouch) {
        if (s.touches.currentX !== s.touches.startX || s.touches.currentY !== s.touches.startY) {
            startMoving = true;
        }
    }
    if (!isTouched) return;
    if (isScrolling)  {
        isTouched = false;
        return;
    }
    if (!startMoving && s.browser.ieTouch) {
        return;
    }
    s.allowClick = false;
    s.emit('onSliderMove', s, e);
    e.preventDefault();
    if (s.params.touchMoveStopPropagation && !s.params.nested) {
        e.stopPropagation();
    }

    if (!isMoved) {
        if (params.loop) {
            s.fixLoop();
        }
        startTranslate = s.getWrapperTranslate();
        s.setWrapperTransition(0);
        if (s.animating) {
            s.wrapper.trigger('webkitTransitionEnd transitionend oTransitionEnd MSTransitionEnd msTransitionEnd');
        }
        if (s.params.autoplay && s.autoplaying) {
            if (s.params.autoplayDisableOnInteraction) {
                s.stopAutoplay();
            }
            else {
                s.pauseAutoplay();
            }
        }
        allowMomentumBounce = false;
        //Grab Cursor
        if (s.params.grabCursor) {
            s.container[0].style.cursor = 'move';
            s.container[0].style.cursor = '-webkit-grabbing';
            s.container[0].style.cursor = '-moz-grabbin';
            s.container[0].style.cursor = 'grabbing';
        }
    }
    isMoved = true;

    var diff = s.touches.diff = isH() ? s.touches.currentX - s.touches.startX : s.touches.currentY - s.touches.startY;

    diff = diff * s.params.touchRatio;
    if (s.rtl) diff = -diff;

    s.swipeDirection = diff > 0 ? 'prev' : 'next';
    currentTranslate = diff + startTranslate;

    var disableParentSwiper = true;
    if ((diff > 0 && currentTranslate > s.minTranslate())) {
        disableParentSwiper = false;
        if (s.params.resistance) currentTranslate = s.minTranslate() - 1 + Math.pow(-s.minTranslate() + startTranslate + diff, s.params.resistanceRatio);
    }
    else if (diff < 0 && currentTranslate < s.maxTranslate()) {
        disableParentSwiper = false;
        if (s.params.resistance) currentTranslate = s.maxTranslate() + 1 - Math.pow(s.maxTranslate() - startTranslate - diff, s.params.resistanceRatio);
    }

    if (disableParentSwiper) {
        e.preventedByNestedSwiper = true;
    }

    // Directions locks
    if (!s.params.allowSwipeToNext && s.swipeDirection === 'next' && currentTranslate < startTranslate) {
        currentTranslate = startTranslate;
    }
    if (!s.params.allowSwipeToPrev && s.swipeDirection === 'prev' && currentTranslate > startTranslate) {
        currentTranslate = startTranslate;
    }

    if (!s.params.followFinger) return;

    // Threshold
    if (s.params.threshold > 0) {
        if (Math.abs(diff) > s.params.threshold || allowThresholdMove) {
            if (!allowThresholdMove) {
                allowThresholdMove = true;
                s.touches.startX = s.touches.currentX;
                s.touches.startY = s.touches.currentY;
                currentTranslate = startTranslate;
                s.touches.diff = isH() ? s.touches.currentX - s.touches.startX : s.touches.currentY - s.touches.startY;
                return;
            }
        }
        else {
            currentTranslate = startTranslate;
            return;
        }
    }
    // Update active index in free mode
    if (s.params.freeMode || s.params.watchSlidesProgress) {
        s.updateActiveIndex();
    }
    if (s.params.freeMode) {
        //Velocity
        if (velocities.length === 0) {
            velocities.push({
                position: s.touches[isH() ? 'startX' : 'startY'],
                time: touchStartTime
            });
        }
        velocities.push({
            position: s.touches[isH() ? 'currentX' : 'currentY'],
            time: (new Date()).getTime()
        });
    }
    // Update progress
    s.updateProgress(currentTranslate);
    // Update translate
    s.setWrapperTranslate(currentTranslate);
};
s.onTouchEnd = function (e) {
    if (e.originalEvent) e = e.originalEvent;
    s.emit('onTouchEnd', s, e);
    if (!isTouched) return;
    //Return Grab Cursor
    if (s.params.grabCursor && isMoved && isTouched) {
        s.container[0].style.cursor = 'move';
        s.container[0].style.cursor = '-webkit-grab';
        s.container[0].style.cursor = '-moz-grab';
        s.container[0].style.cursor = 'grab';
    }

    // Time diff
    var touchEndTime = Date.now();
    var timeDiff = touchEndTime - touchStartTime;

    // Tap, doubleTap, Click
    if (s.allowClick) {
        s.updateClickedSlide(e);
        s.emit('onTap', s, e);
        if (timeDiff < 300 && (touchEndTime - lastClickTime) > 300) {
            if (clickTimeout) clearTimeout(clickTimeout);
            clickTimeout = setTimeout(function () {
                if (!s) return;
                if (s.params.paginationHide && s.paginationContainer.length > 0 && !$(e.target).hasClass(s.params.bulletClass)) {
                    s.paginationContainer.toggleClass(s.params.paginationHiddenClass);
                }
                s.emit('onClick', s, e);
            }, 300);

        }
        if (timeDiff < 300 && (touchEndTime - lastClickTime) < 300) {
            if (clickTimeout) clearTimeout(clickTimeout);
            s.emit('onDoubleTap', s, e);
        }
    }

    lastClickTime = Date.now();
    setTimeout(function () {
        if (s && s.allowClick) s.allowClick = true;
    }, 0);

    if (!isTouched || !isMoved || !s.swipeDirection || s.touches.diff === 0 || currentTranslate === startTranslate) {
        isTouched = isMoved = false;
        return;
    }
    isTouched = isMoved = false;

    var currentPos;
    if (s.params.followFinger) {
        currentPos = s.rtl ? s.translate : -s.translate;
    }
    else {
        currentPos = -currentTranslate;
    }
    if (s.params.freeMode) {
        if (currentPos < -s.minTranslate()) {
            s.slideTo(s.activeIndex);
            return;
        }
        else if (currentPos > -s.maxTranslate()) {
            s.slideTo(s.slides.length - 1);
            return;
        }

        if (s.params.freeModeMomentum) {
            if (velocities.length > 1) {
                var lastMoveEvent = velocities.pop(), velocityEvent = velocities.pop();

                var distance = lastMoveEvent.position - velocityEvent.position;
                var time = lastMoveEvent.time - velocityEvent.time;
                s.velocity = distance / time;
                s.velocity = s.velocity / 2;
                if (Math.abs(s.velocity) < 0.02) {
                    s.velocity = 0;
                }
                // this implies that the user stopped moving a finger then released.
                // There would be no events with distance zero, so the last event is stale.
                if (time > 150 || (new Date().getTime() - lastMoveEvent.time) > 300) {
                    s.velocity = 0;
                }
            } else {
                s.velocity = 0;
            }

            velocities.length = 0;
            var momentumDuration = 1000 * s.params.freeModeMomentumRatio;
            var momentumDistance = s.velocity * momentumDuration;

            var newPosition = s.translate + momentumDistance;
            if (s.rtl) newPosition = - newPosition;
            var doBounce = false;
            var afterBouncePosition;
            var bounceAmount = Math.abs(s.velocity) * 20 * s.params.freeModeMomentumBounceRatio;
            if (newPosition < s.maxTranslate()) {
                if (s.params.freeModeMomentumBounce) {
                    if (newPosition + s.maxTranslate() < -bounceAmount) {
                        newPosition = s.maxTranslate() - bounceAmount;
                    }
                    afterBouncePosition = s.maxTranslate();
                    doBounce = true;
                    allowMomentumBounce = true;
                }
                else {
                    newPosition = s.maxTranslate();
                }
            }
            if (newPosition > s.minTranslate()) {
                if (s.params.freeModeMomentumBounce) {
                    if (newPosition - s.minTranslate() > bounceAmount) {
                        newPosition = s.minTranslate() + bounceAmount;
                    }
                    afterBouncePosition = s.minTranslate();
                    doBounce = true;
                    allowMomentumBounce = true;
                }
                else {
                    newPosition = s.minTranslate();
                }
            }
            //Fix duration
            if (s.velocity !== 0) {
                if (s.rtl) {
                    momentumDuration = Math.abs((-newPosition - s.translate) / s.velocity);
                }
                else {
                    momentumDuration = Math.abs((newPosition - s.translate) / s.velocity);
                }
            }

            if (s.params.freeModeMomentumBounce && doBounce) {
                s.updateProgress(afterBouncePosition);
                s.setWrapperTransition(momentumDuration);
                s.setWrapperTranslate(newPosition);
                s.onTransitionStart();
                s.animating = true;
                s.wrapper.transitionEnd(function () {
                    if (!allowMomentumBounce) return;
                    s.emit('onMomentumBounce', s);

                    s.setWrapperTransition(s.params.speed);
                    s.setWrapperTranslate(afterBouncePosition);
                    s.wrapper.transitionEnd(function () {
                        s.onTransitionEnd();
                    });
                });
            } else if (s.velocity) {
                s.updateProgress(newPosition);
                s.setWrapperTransition(momentumDuration);
                s.setWrapperTranslate(newPosition);
                s.onTransitionStart();
                if (!s.animating) {
                    s.animating = true;
                    s.wrapper.transitionEnd(function () {
                        s.onTransitionEnd();
                    });
                }

            } else {
                s.updateProgress(newPosition);
            }

            s.updateActiveIndex();
        }
        if (!s.params.freeModeMomentum || timeDiff >= s.params.longSwipesMs) {
            s.updateProgress();
            s.updateActiveIndex();
        }
        return;
    }

    // Find current slide
    var i, stopIndex = 0, groupSize = s.slidesSizesGrid[0];
    for (i = 0; i < s.slidesGrid.length; i += s.params.slidesPerGroup) {
        if (typeof s.slidesGrid[i + s.params.slidesPerGroup] !== 'undefined') {
            if (currentPos >= s.slidesGrid[i] && currentPos < s.slidesGrid[i + s.params.slidesPerGroup]) {
                stopIndex = i;
                groupSize = s.slidesGrid[i + s.params.slidesPerGroup] - s.slidesGrid[i];
            }
        }
        else {
            if (currentPos >= s.slidesGrid[i]) {
                stopIndex = i;
                groupSize = s.slidesGrid[s.slidesGrid.length - 1] - s.slidesGrid[s.slidesGrid.length - 2];
            }
        }
    }

    // Find current slide size
    var ratio = (currentPos - s.slidesGrid[stopIndex]) / groupSize;

    if (timeDiff > s.params.longSwipesMs) {
        // Long touches
        if (!s.params.longSwipes) {
            s.slideTo(s.activeIndex);
            return;
        }
        if (s.swipeDirection === 'next') {
            if (ratio >= s.params.longSwipesRatio) s.slideTo(stopIndex + s.params.slidesPerGroup);
            else s.slideTo(stopIndex);

        }
        if (s.swipeDirection === 'prev') {
            if (ratio > (1 - s.params.longSwipesRatio)) s.slideTo(stopIndex + s.params.slidesPerGroup);
            else s.slideTo(stopIndex);
        }
    }
    else {
        // Short swipes
        if (!s.params.shortSwipes) {
            s.slideTo(s.activeIndex);
            return;
        }
        if (s.swipeDirection === 'next') {
            s.slideTo(stopIndex + s.params.slidesPerGroup);

        }
        if (s.swipeDirection === 'prev') {
            s.slideTo(stopIndex);
        }
    }
};
/*=========================
  Transitions
  ===========================*/
s._slideTo = function (slideIndex, speed) {
    return s.slideTo(slideIndex, speed, true, true);
};
s.slideTo = function (slideIndex, speed, runCallbacks, internal) {
    if (typeof runCallbacks === 'undefined') runCallbacks = true;
    if (typeof slideIndex === 'undefined') slideIndex = 0;
    if (slideIndex < 0) slideIndex = 0;
    s.snapIndex = Math.floor(slideIndex / s.params.slidesPerGroup);
    if (s.snapIndex >= s.snapGrid.length) s.snapIndex = s.snapGrid.length - 1;

    var translate = - s.snapGrid[s.snapIndex];

    // Stop autoplay

    if (s.params.autoplay && s.autoplaying) {
        if (internal || !s.params.autoplayDisableOnInteraction) {
            s.pauseAutoplay(speed);
        }
        else {
            s.stopAutoplay();
        }
    }
    // Update progress
    s.updateProgress(translate);

    // Normalize slideIndex
    for (var i = 0; i < s.slidesGrid.length; i++) {
        if (- translate >= s.slidesGrid[i]) {
            slideIndex = i;
        }
    }

    if (typeof speed === 'undefined') speed = s.params.speed;
    s.previousIndex = s.activeIndex || 0;
    s.activeIndex = slideIndex;

    if (translate === s.translate) {
        s.updateClasses();
        return false;
    }
    s.onTransitionStart(runCallbacks);
    var translateX = isH() ? translate : 0, translateY = isH() ? 0 : translate;
    if (speed === 0) {
        s.setWrapperTransition(0);
        s.setWrapperTranslate(translate);
        s.onTransitionEnd(runCallbacks);
    }
    else {
        s.setWrapperTransition(speed);
        s.setWrapperTranslate(translate);
        if (!s.animating) {
            s.animating = true;
            s.wrapper.transitionEnd(function () {
                s.onTransitionEnd(runCallbacks);
            });
        }

    }
    s.updateClasses();
    return true;
};

s.onTransitionStart = function (runCallbacks) {
    if (typeof runCallbacks === 'undefined') runCallbacks = true;
    if (s.lazy) s.lazy.onTransitionStart();
    if (runCallbacks) {
        s.emit('onTransitionStart', s);
        if (s.activeIndex !== s.previousIndex) {
            s.emit('onSlideChangeStart', s);
        }
    }
};
s.onTransitionEnd = function (runCallbacks) {
    s.animating = false;
    s.setWrapperTransition(0);
    if (typeof runCallbacks === 'undefined') runCallbacks = true;
    if (s.lazy) s.lazy.onTransitionEnd();
    if (runCallbacks) {
        s.emit('onTransitionEnd', s);
        if (s.activeIndex !== s.previousIndex) {
            s.emit('onSlideChangeEnd', s);
        }
    }
    if (s.params.hashnav && s.hashnav) {
        s.hashnav.setHash();
    }

};
s.slideNext = function (runCallbacks, speed, internal) {
    if (s.params.loop) {
        if (s.animating) return false;
        s.fixLoop();
        var clientLeft = s.container[0].clientLeft;
        return s.slideTo(s.activeIndex + s.params.slidesPerGroup, speed, runCallbacks, internal);
    }
    else return s.slideTo(s.activeIndex + s.params.slidesPerGroup, speed, runCallbacks, internal);
};
s._slideNext = function (speed) {
    return s.slideNext(true, speed, true);
};
s.slidePrev = function (runCallbacks, speed, internal) {
    if (s.params.loop) {
        if (s.animating) return false;
        s.fixLoop();
        var clientLeft = s.container[0].clientLeft;
        return s.slideTo(s.activeIndex - 1, speed, runCallbacks, internal);
    }
    else return s.slideTo(s.activeIndex - 1, speed, runCallbacks, internal);
};
s._slidePrev = function (speed) {
    return s.slidePrev(true, speed, true);
};
s.slideReset = function (runCallbacks, speed, internal) {
    return s.slideTo(s.activeIndex, speed, runCallbacks);
};

/*=========================
  Translate/transition helpers
  ===========================*/
s.setWrapperTransition = function (duration, byController) {
    s.wrapper.transition(duration);
    if (s.params.effect !== 'slide' && s.effects[s.params.effect]) {
        s.effects[s.params.effect].setTransition(duration);
    }
    if (s.params.parallax && s.parallax) {
        s.parallax.setTransition(duration);
    }
    if (s.params.scrollbar && s.scrollbar) {
        s.scrollbar.setTransition(duration);
    }
    if (s.params.control && s.controller) {
        s.controller.setTransition(duration, byController);
    }
    s.emit('onSetTransition', s, duration);
};
s.setWrapperTranslate = function (translate, updateActiveIndex, byController) {
    var x = 0, y = 0, z = 0;
    if (isH()) {
        x = s.rtl ? -translate : translate;
    }
    else {
        y = translate;
    }
    if (!s.params.virtualTranslate) {
        if (s.support.transforms3d) s.wrapper.transform('translate3d(' + x + 'px, ' + y + 'px, ' + z + 'px)');
        else s.wrapper.transform('translate(' + x + 'px, ' + y + 'px)');
    }

    s.translate = isH() ? x : y;

    if (updateActiveIndex) s.updateActiveIndex();
    if (s.params.effect !== 'slide' && s.effects[s.params.effect]) {
        s.effects[s.params.effect].setTranslate(s.translate);
    }
    if (s.params.parallax && s.parallax) {
        s.parallax.setTranslate(s.translate);
    }
    if (s.params.scrollbar && s.scrollbar) {
        s.scrollbar.setTranslate(s.translate);
    }
    if (s.params.control && s.controller) {
        s.controller.setTranslate(s.translate, byController);
    }
    s.emit('onSetTranslate', s, s.translate);
};

s.getTranslate = function (el, axis) {
    var matrix, curTransform, curStyle, transformMatrix;

    // automatic axis detection
    if (typeof axis === 'undefined') {
        axis = 'x';
    }

    if (s.params.virtualTranslate) {
        return s.rtl ? -s.translate : s.translate;
    }

    curStyle = window.getComputedStyle(el, null);
    if (window.WebKitCSSMatrix) {
        // Some old versions of Webkit choke when 'none' is passed; pass
        // empty string instead in this case
        transformMatrix = new WebKitCSSMatrix(curStyle.webkitTransform === 'none' ? '' : curStyle.webkitTransform);
    }
    else {
        transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform  || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
        matrix = transformMatrix.toString().split(',');
    }

    if (axis === 'x') {
        //Latest Chrome and webkits Fix
        if (window.WebKitCSSMatrix)
            curTransform = transformMatrix.m41;
        //Crazy IE10 Matrix
        else if (matrix.length === 16)
            curTransform = parseFloat(matrix[12]);
        //Normal Browsers
        else
            curTransform = parseFloat(matrix[4]);
    }
    if (axis === 'y') {
        //Latest Chrome and webkits Fix
        if (window.WebKitCSSMatrix)
            curTransform = transformMatrix.m42;
        //Crazy IE10 Matrix
        else if (matrix.length === 16)
            curTransform = parseFloat(matrix[13]);
        //Normal Browsers
        else
            curTransform = parseFloat(matrix[5]);
    }
    if (s.rtl && curTransform) curTransform = -curTransform;
    return curTransform || 0;
};
s.getWrapperTranslate = function (axis) {
    if (typeof axis === 'undefined') {
        axis = isH() ? 'x' : 'y';
    }
    return s.getTranslate(s.wrapper[0], axis);
};

/*=========================
  Observer
  ===========================*/
s.observers = [];
function initObserver(target, options) {
    options = options || {};
    // create an observer instance
    var ObserverFunc = window.MutationObserver || window.WebkitMutationObserver;
    var observer = new ObserverFunc(function (mutations) {
        mutations.forEach(function (mutation) {
            s.onResize();
            s.emit('onObserverUpdate', s, mutation);
        });
    });

    observer.observe(target, {
        attributes: typeof options.attributes === 'undefined' ? true : options.attributes,
        childList: typeof options.childList === 'undefined' ? true : options.childList,
        characterData: typeof options.characterData === 'undefined' ? true : options.characterData
    });

    s.observers.push(observer);
}
s.initObservers = function () {
    if (s.params.observeParents) {
        var containerParents = s.container.parents();
        for (var i = 0; i < containerParents.length; i++) {
            initObserver(containerParents[i]);
        }
    }

    // Observe container
    initObserver(s.container[0], {childList: false});

    // Observe wrapper
    initObserver(s.wrapper[0], {attributes: false});
};
s.disconnectObservers = function () {
    for (var i = 0; i < s.observers.length; i++) {
        s.observers[i].disconnect();
    }
    s.observers = [];
};
/*=========================
  Loop
  ===========================*/
// Create looped slides
s.createLoop = function () {
    // Remove duplicated slides
    s.wrapper.children('.' + s.params.slideClass + '.' + s.params.slideDuplicateClass).remove();

    var slides = s.wrapper.children('.' + s.params.slideClass);
    s.loopedSlides = parseInt(s.params.loopedSlides || s.params.slidesPerView, 10);
    s.loopedSlides = s.loopedSlides + s.params.loopAdditionalSlides;
    if (s.loopedSlides > slides.length) {
        s.loopedSlides = slides.length;
    }

    var prependSlides = [], appendSlides = [], i;
    slides.each(function (index, el) {
        var slide = $(this);
        if (index < s.loopedSlides) appendSlides.push(el);
        if (index < slides.length && index >= slides.length - s.loopedSlides) prependSlides.push(el);
        slide.attr('data-swiper-slide-index', index);
    });
    for (i = 0; i < appendSlides.length; i++) {
        s.wrapper.append($(appendSlides[i].cloneNode(true)).addClass(s.params.slideDuplicateClass));
    }
    for (i = prependSlides.length - 1; i >= 0; i--) {
        s.wrapper.prepend($(prependSlides[i].cloneNode(true)).addClass(s.params.slideDuplicateClass));
    }
};
s.destroyLoop = function () {
    s.wrapper.children('.' + s.params.slideClass + '.' + s.params.slideDuplicateClass).remove();
    s.slides.removeAttr('data-swiper-slide-index');
};
s.fixLoop = function () {
    var newIndex;
    //Fix For Negative Oversliding
    if (s.activeIndex < s.loopedSlides) {
        newIndex = s.slides.length - s.loopedSlides * 3 + s.activeIndex;
        newIndex = newIndex + s.loopedSlides;
        s.slideTo(newIndex, 0, false, true);
    }
    //Fix For Positive Oversliding
    else if ((s.params.slidesPerView === 'auto' && s.activeIndex >= s.loopedSlides * 2) || (s.activeIndex > s.slides.length - s.params.slidesPerView * 2)) {
        newIndex = -s.slides.length + s.activeIndex + s.loopedSlides;
        newIndex = newIndex + s.loopedSlides;
        s.slideTo(newIndex, 0, false, true);
    }
};
/*=========================
  Append/Prepend/Remove Slides
  ===========================*/
s.appendSlide = function (slides) {
    if (s.params.loop) {
        s.destroyLoop();
    }
    if (typeof slides === 'object' && slides.length) {
        for (var i = 0; i < slides.length; i++) {
            if (slides[i]) s.wrapper.append(slides[i]);
        }
    }
    else {
        s.wrapper.append(slides);
    }
    if (s.params.loop) {
        s.createLoop();
    }
    if (!(s.params.observer && s.support.observer)) {
        s.update(true);
    }
};
s.prependSlide = function (slides) {
    if (s.params.loop) {
        s.destroyLoop();
    }
    var newActiveIndex = s.activeIndex + 1;
    if (typeof slides === 'object' && slides.length) {
        for (var i = 0; i < slides.length; i++) {
            if (slides[i]) s.wrapper.prepend(slides[i]);
        }
        newActiveIndex = s.activeIndex + slides.length;
    }
    else {
        s.wrapper.prepend(slides);
    }
    if (s.params.loop) {
        s.createLoop();
    }
    if (!(s.params.observer && s.support.observer)) {
        s.update(true);
    }
    s.slideTo(newActiveIndex, 0, false);
};
s.removeSlide = function (slidesIndexes) {
    if (s.params.loop) {
        s.destroyLoop();
    }
    var newActiveIndex = s.activeIndex,
        indexToRemove;
    if (typeof slidesIndexes === 'object' && slidesIndexes.length) {
        for (var i = 0; i < slidesIndexes.length; i++) {
            indexToRemove = slidesIndexes[i];
            if (s.slides[indexToRemove]) s.slides.eq(indexToRemove).remove();
            if (indexToRemove < newActiveIndex) newActiveIndex--;
        }
        newActiveIndex = Math.max(newActiveIndex, 0);
    }
    else {
        indexToRemove = slidesIndexes;
        if (s.slides[indexToRemove]) s.slides.eq(indexToRemove).remove();
        if (indexToRemove < newActiveIndex) newActiveIndex--;
        newActiveIndex = Math.max(newActiveIndex, 0);
    }

    if (!(s.params.observer && s.support.observer)) {
        s.update(true);
    }
    s.slideTo(newActiveIndex, 0, false);
};
s.removeAllSlides = function () {
    var slidesIndexes = [];
    for (var i = 0; i < s.slides.length; i++) {
        slidesIndexes.push(i);
    }
    s.removeSlide(slidesIndexes);
};
