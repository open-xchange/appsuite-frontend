# Change Log

## Swiper 3.0.6 - Released on March 27, 2015
  * Fixed sometimes wrong slides position when using "Fade" effect
  * `.destroy(deleteInstance, cleanupStyles)` method now has second `cleanupStyles` argument, when passed - all custom styles will be removed from slides, wrapper and container. Useful if you need to destroy Swiper and to init again with new options or in different direction
  * Minor fixes

## Swiper 3.0.5 - Released on March 21, 2015
  * New Keyboard accessibility module to provide foucsable navigation buttons and basic ARIA for screen readers with new parameters:
    * `a11y: false` - enable accessibility
    * `prevSlideMessage: 'Previous slide'` - message for screen readers for previous button
    * `nextSlideMessage: 'Next slide'` - message for screen readers for next button
    * `firstSlideMessage: 'This is the first slide'` - message for screen readers for previous button when swiper is on first slide
    * `lastSlideMessage: 'This is the last slide'` - message for screen readers for next button when swiper is on last slide
  * New Emitter module. It allows to work with callbacks like with events, even adding them after initialization with new methods:
    * `.on(event, handler)` - add event/callback
    * `.off(event, handler)` - remove this event/callback
    * `.once(event, handler)` - add event/callback that will be executed only once
  * Plugins API is back. It allows to write custom Swiper plugins
  * Better support for browser that don't support flexbox layout
  * New parameter `setWrapperSize` (be default it is `false`) to provide better compatibility with browser without flexbox support. Enabled this option and plugin will set width/height on swiper wrapper equal to total size of all slides
  * New `virtualTranslate` parameter. When it is enabled swiper will be operated as usual except it will not move. Useful when you may need to create custom slide transition
  * Added support for multiple Pagination containers
  * Fixed `onLazyImage...` callbacks
  * Fixed issue with not accessible links inside of Slides on Android < 4.4
  * Fixed pagination bullets behavior in loop mode with specified `slidesPerGroup`
  * Fixed issues with clicks on IE 10+ touch devices
  * Fixed issues with Coverflow support on IE 10+
  * Hashnav now will update document hash after transition to prevent browsers UI lags, not in the beginning like before
  * Super basic support for IE 9 with swiper.jquery version. No animation and transitions, but basic stuff like switching slides/pagination/scrollbars works
  

## Swiper 3.0.4 - Released on March 6, 2015
  * New Images Lazy Load component
    * With new parameters `lazyLoading`, `lazyLoadingInPrevNext`, `lazyLoadingOnTransitionStart` (all disabled by default)
    * With new callbacks `onLazyImageLoad` and `onLazyImageReady`
  * `updateOnImages` ready split into 2 parameters:
    * `preloadImages` (by default is true) - to preload all images on swiper init
    * `updateOnImages` (by default is true) - update swiper when all images loaded
  * Fixed issues with touchmove on fouces form elements
  * New `onObserverUpdate` callback function to be called after updates by ovserver
  * Fixed issue with not working inputs with keyboard control for jQuery version
  * New `paginationBulletRender` parameter that accepts function which allow custom pagination elements layout
  * Hash Navigation will run callback dpending on `runCallbacksOnInit` parameter
  * `watchVisibility` parameter renamed to `watchSlidesVisibility`

## Swiper 3.0.3 - Released on March 1, 2015
  * Fixed issue with not firing onSlideChangeEnd callback after calling .slideTo with
runCallbacks=false
  * Fixed values of isBeginning/isEnd when there is only one slide
  * New `crossFade` option for fade effect
  * Improved support for devices with both touch and mouse inputs, not yet on IE
  * Fixed not correctly working mousewheel and keyobard control in swiper.jquery version
  * New parallax module for transitions with parallax effects on internal elements
  * Improved .update and .onResize methods
  * Minor fixes

## Swiper 3.0.2 - Released on February 22, 2015
  * Fixed issue with keyboard events not cleaned up with Swiper.destroy
  * Encoded inline SVG images for IE support
  * New callbacks
    * onInit (swiper)
    * onTouchMoveOpposite (swiper, e)
  * Fixed free mode momentum in RTL layout
  * `.update` method improved to fully cover what `onResize` do for full and correct update
  * Exposed `swiper.touches` object with the following properties: `startX`, `startY`, `currentX`, `currentY`, `diff`
  * New methods to remove slides
    * `.removeSlide(index)` or `.removeSlide([indexes])` - to remove selected slides
    * `.removeAllSlides()` - to remove all slides

## Swiper 3.0.1 - Released on February 13, 2015
  * Fixed issue with navigation buttons in Firefox in loop mode
  * Fixed issue with image dragging in IE 10+

## Swiper 3.0.0 - Released on February 11, 2015
  * Initial release of all new Swiper 3
  * Removed features
    * Dropped support for old browsers. Now it is compatible with:
      * iOS 7+
      * Android 4+ (multirow mode only for Android 4.4+)
      * Latest Chrome, Safari, Firefox and Opera desktop browsers
      * WP 8+, IE 10+ (3D effects may not work correctly on IE because of wrong nested 3D transform support)
    * Scroll Container. Removed in favor of pure CSS `overflow: auto` with `-webkit-overflow-scrolling: touch`
  * New features
    * Swiper now uses modern flexbox layout, which by itself give more features and advantages
    * Such Swiper 2.x plugins as Hash Navigation, Smooth Progress, 3D Flow and Scrollbar are now incoroporated into Swiper 3.x core
    * Full RTL support
    * Built-in navigation buttons/arrows
    * Controller. Now one Swiper could be controlled (or control itself) by another Swiper
    * Multi row slides layout with `slidesPerColumn` option
    * Better support for nested Swipers, now it is possible to use same-direction nested Swipers, like horizontal in horizontal
    * Space between slides
    * New transition effects: 3D Coverflow, 3D Cube and Fade transitions
    * Slides are `border-box` now, so it is possible to use borders and paddings directly on slides
    * Auto layout mode (`slidesPerView: 'auto'`) now gives more freedom, you can even specify slides sizes in % and use margins on them
    * Mutation Observers. If enabled, Swiper will watch for changes in Dom and update its layout automatically
    * Better clicks prevention during swiping
  * Many of API methods, parameters and callbacks are changed
  * Added a bit lightweight jQuery/Zepto version of Swiper that can be used if you use jQuery/Zepto in your project


